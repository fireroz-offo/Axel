import { useEffect, useMemo, useRef, useState } from 'react';
import type { Project } from '../lib/types';
import { splitSentences } from '../lib/brain/script';
import { applyLLM, BLOCKS, canBuild, changeBlock, IS_3D, planScenes, type BlockType, type Mode, type SceneSpec } from '../lib/brain/plan';
import type { AlignResult, AudioInfo } from '../lib/audio/analyze';
import { runAlign } from '../workers/runAlign';
import { direct } from '../ai/director/director';
import { transcribe, WHISPER_MODELS, type WhisperTier } from '../ai/speech/transcribe';
import { alignScriptToAsr } from '../ai/speech/scriptAlign';
import { renderFrame, THEMES } from '../lib/motion/engine';
import { decodeAudioFile, renderVideo, SIZES, supportsEncoding, type Aspect } from '../lib/render/renderVideo';
import { saveToDownloads } from '../lib/saveFile';
import { AssetRuntime } from '../lib/assets/runtime';
import { loadAssets, type AssetDef } from '../lib/assets/store';
import { applyAssets, useAsset } from '../lib/assets/match';
import { planBitrate, QUALITY, SIZE_CAPS_MB, type Quality } from '../lib/render/budget';

const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
const LABEL: Record<BlockType, string> = { coins3d: '3D coins (growth)', city3d: '3D city', exploded3d: '3D exploded view', atom3d: '3D atom', helix3d: '3D DNA helix', planet3d: '3D planet', network3d: '3D network', road3d: '3D timeline road', title: 'Title', stat: 'Number/%', bars: 'Bar chart', bars3d: '3D bars', line: 'Line graph', timeline: 'Timeline', steps: 'Steps', compare: 'Compare', quote: 'Quote', words: 'Kinetic words', callout: 'Callout', sphere3d: '3D globe', hero: 'Hero + subject', orbit: 'Glass labels', chartcard: 'Glow chart card', end: 'End card', asset: 'Library asset' };

export default function Studio({ project, onUpdate }: { project: Project | null; onUpdate: (p: Project) => Promise<void> }) {
  const [script, setScript] = useState(project?.script ?? '');
  const [mode, setMode] = useState<Mode>('explanation');
  const [aspect, setAspect] = useState<Aspect>('16:9');
  const [fps, setFps] = useState<24 | 30>(30);
  const [caps, setCaps] = useState(true);
  const [use3d, setUse3d] = useState(true);
  const [netAI, setNetAI] = useState(true);
  const [asr, setAsr] = useState<'off' | WhisperTier>('tiny');
  const [quality, setQuality] = useState<Quality>('balanced');
  const [maxMB, setMaxMB] = useState(100);
  const [useLib, setUseLib] = useState(true);
  const [lib, setLib] = useState<AssetDef[]>([]);
  const rtRef = useRef<AssetRuntime | null>(null);
  useEffect(() => { loadAssets().then(setLib).catch(() => {}); return () => { rtRef.current?.dispose(); }; }, []);
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
  const audioUrl = useMemo(() => (audioFile ? URL.createObjectURL(audioFile) : ''), [audioFile]);
  useEffect(() => { setScript(project?.script ?? ''); }, [project?.id]);

  const [W, H] = SIZES[aspect];
  const draw = (t: number) => { const c = cv.current?.getContext('2d'); if (c && scenes.length) renderFrame(c, W, H, scenes, t, THEMES[mode], { captions: caps, assets: rtRef.current ?? undefined }); };
  useEffect(() => { draw(au.current?.currentTime ?? 0); }, [scenes, aspect, mode, caps]);
  useEffect(() => {
    if (!playing) return; let raf = 0;
    const loop = () => { rtRef.current?.primeSoon(scenes, au.current?.currentTime ?? 0); draw(au.current?.currentTime ?? 0); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, [playing, scenes, aspect, mode, caps]);

  const buildRuntime = (sc: SceneSpec[]) => {
    rtRef.current?.dispose(); rtRef.current = null;
    if (!sc.some((x) => x.block === 'asset')) return null;
    const th = THEMES[mode];
    rtRef.current = new AssetRuntime(new Map(lib.map((a) => [a.id, a])), { w: W, h: H }, () => ({ acc: th.acc, ink: th.ink, bg: th.bg0 }));
    return rtRef.current;
  };
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
      let sc = planScenes(al.scenes, { mode, allow3d: use3d, category: project?.category, title: project?.title && project.title !== 'Meri script' ? project.title : '' });
      if (netAI) { // internet AI (no key, 0 MB). Fails -> rule plan stays.
        const d = await direct(sentences, mode, { onStatus: setMsg });
        if (d.picks.size) sc = applyLLM(sc, d.picks as any, use3d);
        setMsg(d.note);
      }
      if (useLib && lib.some((a) => a.enabled)) sc = applyAssets(sc, lib, project?.category ?? 'other');
      const used = sc.filter((x) => x.block === 'asset').length;
      const rt = buildRuntime(sc); if (rt) await rt.prime(sc, sc.find((x) => x.block === 'asset')!.start + 0.1);
      setScenes(sc); setMsg(`✅ ${sc.length} scenes taiyaar (${used} library se, ${sc.length - used} AI-generated), audio ${fmt(dec.duration)}.`);
      if (project) onUpdate({ ...project, script, stage: 'story' }).catch(() => {});
    } catch (e: any) { setMsg('❌ ' + (e?.message ?? e)); }
    setBusy(false);
  };

  const setAsset = async (i: number, id: string) => {
    const a = lib.find((x) => x.id === id); if (!a) return;
    const sc = scenes.map((s, k) => (k === i ? useAsset(s, a, 'user ne library asset chuna: ' + a.name) : s));
    const rt = buildRuntime(sc); if (rt) await rt.prime(sc, sc[i].start + 0.1);
    setScenes(sc); setMsg('');
  };
  const setBlock = (i: number, b: BlockType) => {
    const base = scenes[i].block === 'asset' && scenes[i].params.orig ? { ...scenes[i], block: scenes[i].params.orig.block as BlockType, params: scenes[i].params.orig.params } : scenes[i];
    const n = changeBlock(base, b); if (!n) { setMsg(`Scene ${i + 1} ke text mein "${LABEL[b]}" ke liye data (number/year/list) nahi hai.`); return; }
    setScenes(scenes.map((s, k) => (k === i ? n : s))); setMsg('');
  };
  const seek = (t: number) => { if (au.current) au.current.currentTime = t; draw(t); };
  const toggle = () => { const a = au.current; if (!a) return; if (a.paused) { a.play(); setPlaying(true); } else { a.pause(); setPlaying(false); } };

  const render = async () => {
    if (!audio || !audioFile || !scenes.length) return;
    setBusy(true); setProg(0); if (outUrl) URL.revokeObjectURL(outUrl); setOutUrl(''); setOutBlob(null); setMsg('Render shuru…'); abort.current = new AbortController();
    try {
      setMsg('Audio decode (render quality)…'); const hq = await decodeAudioFile(audioFile!, 48000); // decoded only for the render, freed right after
      const r = await renderVideo({ quality, maxMB, assets: rtRef.current ?? undefined, scenes, theme: THEMES[mode], aspect, fps, duration: hq.duration, captions: caps, audio: hq.samples, sampleRate: hq.sampleRate, signal: abort.current.signal, onProgress: (p, st) => { setProg(p); setMsg(st === 'audio' ? 'Audio encode…' : 'Video render…'); } });
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
      <p className="muted">Script + voiceover → AI scenes → motion graphics → MP4 (max 720p).</p>
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
        <label><input type="checkbox" checked={use3d} onChange={(e) => setUse3d(e.target.checked)} /> 3D scenes allow</label><br />
        <label><input type="checkbox" checked={useLib} onChange={(e) => setUseLib(e.target.checked)} /> Meri HTML library ({lib.filter((a) => a.enabled).length} assets) se match karo; fit na ho to AI naya banaye</label><br />
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
              <b onClick={() => seek(s.start + 0.5)} style={{ cursor: 'pointer' }}>#{i + 1} · {fmt(s.start)}–{fmt(s.end)} {IS_3D[s.block] ? '· 3D' : '· 2D'}</b>
              <small>{s.text.slice(0, 90)}</small>
              <small className="muted">{s.reason} · transition: {s.transition}</small>
              {s.block !== 'title' && s.block !== 'end' && (
                <select value={s.block === 'asset' ? 'asset:' + s.params.assetId : s.block} onChange={(e) => (e.target.value.startsWith('asset:') ? setAsset(i, e.target.value.slice(6)) : setBlock(i, e.target.value as BlockType))}>
                  {lib.filter((a) => a.enabled).map((a) => <option key={a.id} value={'asset:' + a.id}>🧩 {a.name}</option>)}
                  {BLOCKS.filter((b) => b !== 'title' && b !== 'end' && (use3d || !IS_3D[b])).map((b) => <option key={b} value={b} disabled={!canBuild(b, s.text)}>{LABEL[b]}{canBuild(b, s.text) ? '' : ' (data nahi)'}</option>)}
                </select>
              )}
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
