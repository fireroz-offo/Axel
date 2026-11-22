import { useEffect, useMemo, useRef, useState } from 'react';
import type { Project } from '../lib/types';
import { splitSentences } from '../lib/brain/script';
import { applyLLM, planScenes, type Mode, type SceneSpec } from '../lib/brain/plan';
import type { AlignResult, AudioInfo } from '../lib/audio/analyze';
import { runAlign } from '../workers/runAlign';
import { direct } from '../ai/director/director';
import { transcribe, WHISPER_MODELS, type WhisperTier } from '../ai/speech/transcribe';
import { alignScriptToAsr } from '../ai/speech/scriptAlign';
import { THEMES } from '../lib/motion/theme';
import { MotionProCompositor } from '../lib/motion/htmlCompositor';
import { motionProSceneUrl } from '../lib/motion/motionProHtml';
import { decodeAudioFile, renderVideo, SIZES, supportsEncoding, type Aspect } from '../lib/render/renderVideo';
import { saveToDownloads } from '../lib/saveFile';
import { planBitrate, QUALITY, SIZE_CAPS_MB, type Quality } from '../lib/render/budget';

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
export default function Studio({ project, onUpdate }: { project: Project | null; onUpdate: (p: Project) => Promise<void> }) {
  const [script, setScript] = useState(project?.script ?? '');
  const [mode, setMode] = useState<Mode>('explanation');
  const [aspect, setAspect] = useState<Aspect>('16:9');
  const [fps, setFps] = useState<24 | 30>(30);
  const [caps, setCaps] = useState(true);
  const [netAI, setNetAI] = useState(true);
  const [asr, setAsr] = useState<'off' | WhisperTier>('tiny');
  const [quality, setQuality] = useState<Quality>('balanced');
  const [maxMB, setMaxMB] = useState(100);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audio, setAudio] = useState<{ samples: Float32Array; sampleRate: number; duration: number } | null>(null);
  const [info, setInfo] = useState<AudioInfo | null>(null);
  const [align, setAlign] = useState<AlignResult | null>(null);
  const [scenes, setScenes] = useState<SceneSpec[]>([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState(0);
  const [outUrl, setOutUrl] = useState('');
  const [outInfo, setOutInfo] = useState('');
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [playing, setPlaying] = useState(false);
  const cv = useRef<HTMLCanvasElement>(null), au = useRef<HTMLAudioElement>(null), abort = useRef<AbortController | null>(null);
  const compositorRef = useRef<MotionProCompositor | null>(null), drawToken = useRef(0);
  const audioUrl = useMemo(() => (audioFile ? URL.createObjectURL(audioFile) : ''), [audioFile]);
  useEffect(() => { setScript(project?.script ?? ''); }, [project?.id]);

  const [W, H] = SIZES[aspect];
  const draw = (t: number) => {
    const compositor = compositorRef.current; if (!compositor || !scenes.length) return;
    const token = ++drawToken.current;
    compositor.renderFrame(scenes, t, THEMES[mode], caps).then((frame) => {
      if (token !== drawToken.current) return;
      const c = cv.current?.getContext('2d'); if (c) c.drawImage(frame, 0, 0, W, H);
    }).catch((e) => setMsg('❌ HTML motion preview: ' + (e?.message ?? e)));
  };
  useEffect(() => {
    if (!scenes.length) return;
    const compositor = new MotionProCompositor(W, H); compositorRef.current = compositor;
    drawToken.current++;
    compositor.renderFrame(scenes, au.current?.currentTime ?? 0, THEMES[mode], caps).then((frame) => {
      if (compositorRef.current !== compositor) return;
      const c = cv.current?.getContext('2d'); if (c) c.drawImage(frame, 0, 0, W, H);
    }).catch((e) => setMsg('❌ HTML motion preview: ' + (e?.message ?? e)));
    return () => { if (compositorRef.current === compositor) compositorRef.current = null; drawToken.current++; void compositor.dispose(); };
  }, [scenes, aspect, mode, caps]);
  useEffect(() => {
    if (!playing || !scenes.length) return; let raf = 0, inFlight = false, active = true;
    const loop = () => {
      if (!inFlight && compositorRef.current) {
        inFlight = true;
        compositorRef.current.renderFrame(scenes, au.current?.currentTime ?? 0, THEMES[mode], caps).then((frame) => {
          if (!active) return; const c = cv.current?.getContext('2d'); if (c) c.drawImage(frame, 0, 0, W, H);
        }).catch((e) => setMsg('❌ HTML motion preview: ' + (e?.message ?? e))).finally(() => { inFlight = false; if (active) raf = requestAnimationFrame(loop); });
      } else if (active) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop); return () => { active = false; cancelAnimationFrame(raf); };
  }, [playing, scenes, aspect, mode, caps]);
  const sentences = useMemo(() => splitSentences(script), [script]);

  const analyze = async () => {
    if (!audioFile || !sentences.length) return;
    setBusy(true); setMsg('Audio decode ho raha hai…'); setOutUrl('');
    try {
      const dec = await decodeAudioFile(audioFile, 16000); setAudio({ samples: new Float32Array(0), sampleRate: dec.sampleRate, duration: dec.duration });
      setMsg('Audio aur script align ho rahe hain…');
      let asrAl: ReturnType<typeof alignScriptToAsr> = null;
      if (asr !== 'off') { // Whisper: asli shabd-level timestamps. Fail/kharab -> timing-based alignment (neeche)
        try {
          const words = await transcribe(dec.samples.slice(), { tier: asr, lang: project?.lang === 'en' ? 'en' : 'hi', onStatus: setMsg });
          asrAl = alignScriptToAsr(sentences, words, dec.duration);
          if (!asrAl) setMsg('Whisper ka text script se match nahi hua; timing-based alignment use ho raha hai.');
        } catch (e: any) { setMsg('Whisper nahi chala (' + (e?.message ?? e) + '); timing-based alignment use ho raha hai.'); }
      }
      setMsg('Audio aur script align ho rahe hain…');
      const { info: inf, align: al0 } = await runAlign(dec.samples, dec.sampleRate, sentences); // worker: UI freeze nahi
      const al = asrAl ?? al0; setInfo(inf); setAlign(al);
      let sc = planScenes(al.scenes, { mode, allow3d: true, category: project?.category, title: project?.title && project.title !== 'Meri script' ? project.title : '' });
      if (netAI) { // internet AI (no key, 0 MB). Fails -> rule plan stays.
        const d = await direct(sentences, mode, { onStatus: setMsg });
        if (d.picks.size) sc = applyLLM(sc, d.picks as any, true);
        setMsg(d.note);
      }
      setScenes(sc); setMsg(`✅ ${sc.length} scenes taiyaar · har scene ke liye original HTML/CSS motion template AI ne select kiya · audio ${fmt(dec.duration)}.`);
      if (project) onUpdate({ ...project, script, stage: 'story' }).catch(() => {});
    } catch (e: any) { setMsg('❌ ' + (e?.message ?? e)); }
    setBusy(false);
  };

  const seek = (t: number) => { if (au.current) au.current.currentTime = t; draw(t); };
  const toggle = () => { const a = au.current; if (!a) return; if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); } };

  const render = async () => {
    if (!audio || !audioFile || !scenes.length) return;
    setBusy(true); setProg(0); if (outUrl) URL.revokeObjectURL(outUrl); setOutUrl(''); setOutBlob(null); setMsg('Render shuru…'); abort.current = new AbortController();
    if (au.current) au.current.pause(); setPlaying(false);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    try {
      setMsg('Audio decode (render quality)…'); const hq = await decodeAudioFile(audioFile!, 48000); // decoded only for the render, freed right after
      const r = await renderVideo({ quality, maxMB, scenes, compositor: compositorRef.current ?? undefined, theme: THEMES[mode], aspect, fps, duration: hq.duration, captions: caps, audio: hq.samples, sampleRate: hq.sampleRate, signal: abort.current.signal, onProgress: (p, st) => { setProg(p); setMsg(st === 'audio' ? 'Audio encode…' : 'Video render…'); } });
      setOutBlob(r.blob); setOutUrl(URL.createObjectURL(r.blob));
      setOutInfo(`${r.width}×${r.height} · ${fps}fps · ${(r.blob.size / 1048576).toFixed(1)} MB · ${(r.ms / 1000).toFixed(0)}s mein bana · ${r.streaming ? 'seedha disk par likha (RAM flat)' : 'RAM mein bana'}${r.capped ? ' · size-cap se bitrate kam hua' : ''} · ${r.note}`); setMsg('✅ MP4 taiyaar');
    } catch (e: any) { setMsg('❌ ' + (e?.message ?? e)); }
    setBusy(false);
  };
  const download = async () => { if (!outBlob) return; try { const p = await saveToDownloads(outBlob, `divriz-${Date.now()}.mp4`); setMsg('✅ Save hua: ' + p); } catch (e: any) { setMsg('❌ ' + (e?.message ?? e)); } };

  return (
    <section>
      <h2>🎬 Studio</h2>
      {project?.approved && project.scriptSource === 'ai' && !project.scriptApproved && <p className="card note">⚠️ AI script abhi approve nahi hui. Pehle Script tab mein approve karein, phir voiceover upload karein.</p>}
      <p className="muted">Script + voiceover → AI-selected original HTML/CSS/JS motion → browser compositor → MP4 (max 720p).</p>
      {!supportsEncoding() && <div className="card note">⚠️ Is browser mein WebCodecs nahi hai: preview chalega par MP4 export nahi. Android Chrome (latest) ya APK use karein.</div>}
      <label className="muted">1. Script</label>
      <textarea className="ta" value={script} onChange={(e) => setScript(e.target.value)} placeholder="Script yahan paste karein…" />
      <small className="muted">{sentences.length} vaakya</small>
      <label className="muted">2. Voiceover (MP3 / WAV / M4A)</label>
      <input type="file" accept="audio/*,.mp3,.wav,.m4a" onChange={(e) => { setAudioFile(e.target.files?.[0] ?? null); setScenes([]); setAlign(null); setOutUrl(''); }} />
      <div className="seg">{(['explanation', 'documentary'] as Mode[]).map((m) => <button key={m} className={mode === m ? 'on' : ''} onClick={() => setMode(m)}>{m === 'explanation' ? 'Explanation' : 'Documentary'}</button>)}</div>
      <div className="seg">{(['16:9', '9:16', '1:1'] as Aspect[]).map((a) => <button key={a} className={aspect === a ? 'on' : ''} onClick={() => setAspect(a)}>{a}</button>)}
        {([24, 30] as const).map((f) => <button key={f} className={fps === f ? 'on' : ''} onClick={() => setFps(f)}>{f}fps</button>)}</div>
      <div className="card">
        <label><input type="checkbox" checked={caps} onChange={(e) => setCaps(e.target.checked)} /> Captions (word highlight)</label><br />
        <small className="muted">Voiceover pehchan (Whisper, ek baar model download, phir cache):</small>
        <select value={asr} onChange={(e) => setAsr(e.target.value as any)}>
          <option value="off">Off (sirf timing se, 0 MB)</option>
          {(Object.keys(WHISPER_MODELS) as WhisperTier[]).map((k) => <option key={k} value={k}>{WHISPER_MODELS[k].label}</option>)}
        </select><br />
        <label><input type="checkbox" checked={netAI} onChange={(e) => setNetAI(e.target.checked)} /> Internet AI director (koi key/download nahi; na chale to rule-based)</label>
      </div>
      <div className="card">
        <small className="muted">Video quality / max file size (bitrate size-cap se nikalta hai, file isse bada nahi hoti):</small>
        <div className="seg">{(Object.keys(QUALITY) as Quality[]).map((q) => <button key={q} className={quality === q ? 'on' : ''} onClick={() => setQuality(q)}>{QUALITY[q].label}</button>)}</div>
        <div className="seg">{SIZE_CAPS_MB.map((m) => <button key={m} className={maxMB === m ? 'on' : ''} onClick={() => setMaxMB(m)}>≤{m} MB</button>)}</div>
        {audio && <small>Andaza: ~{planBitrate({ width: W, height: H, fps, duration: audio.duration, quality, maxMB, hasAudio: true }).estMB.toFixed(0)} MB ({fmt(audio.duration)} ka video)</small>}
      </div>
      <button className="btn" disabled={busy || !audioFile || !sentences.length} onClick={analyze}>🔍 Audio analyze + scenes banao</button>
      {msg && <p className={msg.startsWith('❌') ? 'bad' : msg.startsWith('✅') ? 'good' : 'muted'}>{msg}</p>}

      {align && info && (
        <div className="card">
          <b>Audio analysis</b>
          <small>Duration {fmt(info.duration)} · bolna {fmt(info.speechStart)}–{fmt(info.speechEnd)} · {info.silences.length} pauses</small>
          <small>Script ka anumaan {fmt(align.report.expectedSec)} (speech/anumaan = {align.report.ratio.toFixed(2)})</small>
          {align.report.flags.length ? align.report.flags.map((f, i) => <small key={i} className="bad">⚠️ {f}</small>) : <small className="good">✅ Timing mein koi badi gadbad nahi dikhi</small>}
          <small className="muted">Alignment timing-based hai (pauses + shabdon ki lambai). Ye sun kar shabd nahi pehchanta, isliye chhoota/extra shabd nahi pakad sakta.</small>
        </div>
      )}

      {scenes.length > 0 && (
        <>
          <canvas ref={cv} width={W} height={H} style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: '60vh', objectFit: 'contain' }} />
          <audio ref={au} src={audioUrl} onEnded={() => setPlaying(false)} onSeeked={() => draw(au.current?.currentTime ?? 0)} />
          <div className="seg"><button onClick={toggle}>{playing ? '⏸ Pause' : '▶️ Preview'}</button><button onClick={() => { seek(0); }}>⏮ Shuru</button></div>
          <h3>Storyboard ({scenes.length})</h3>
          {scenes.map((s, i) => (
            <div className="card" key={i}>
              <b onClick={() => seek(s.start + 0.5)} style={{ cursor: 'pointer' }}>#{i + 1} · {fmt(s.start)}–{fmt(s.end)} · HTML motion</b>
              <small>{s.text.slice(0, 90)}</small>
              <small className="muted">{s.reason} · transition: {s.transition}</small>
              <small className="muted">HTML Motion #{s.params.motionId ?? '71001'} · {s.params.motionFilter ?? s.params.motionFamily ?? 'Motion Pro'} · AI-edited scene</small>
              <a className="btn ghost" href={motionProSceneUrl(s, THEMES[mode].acc)} target="_blank" rel="noreferrer">✦ Original HTML Motion preview / edit</a>
            </div>
          ))}
          <button className="btn" disabled={busy || !supportsEncoding()} onClick={render}>🎞️ MP4 render karo ({W}×{H})</button>
          {busy && prog > 0 && <><progress value={prog} max={1} style={{ width: '100%' }} /><button onClick={() => abort.current?.abort()}>Cancel</button></>}
        </>
      )}
      {outUrl && (
        <div className="card">
          <video src={outUrl} controls playsInline style={{ width: '100%', borderRadius: 12 }} />
          <small>{outInfo}</small>
          <button className="btn" onClick={download}>⬇️ MP4 download</button>
        </div>
      )}
    </section>
  );
}
