import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Code2, Eye, Film, FolderOpen, Play, Pause, Download, SlidersHorizontal, Layers, Undo2, Redo2, RefreshCw,
  FileCode2, Diamond, Trash2, Share2, X,
} from 'lucide-react';
import {
  DEFAULT_KF, EASES, EASE_LABEL, FORMATS, STARTER, buildDoc, fmt, mutate, readInline, readProj, roundEven, scanLayers, writeProj,
  type KF, type Layer, type Meta, type Proj,
} from './project';
import { exportMp4 } from './exporter';
import { importZip } from './zipImport';
import { isNative, saveBytes, shareBytes } from './files';

const CodeEditor = lazy(() => import('./CodeEditor'));

type Anim = Omit<KF, 't'>;
type Reply = { ok: boolean; svg?: string; auto?: number; error?: string };

function Slider(p: { label: string; value: number; min: number; max: number; step?: number; unit?: string; on: (n: number) => void }) {
  return (
    <label>
      <span>{p.label}</span>
      <b>{p.value}{p.unit || ''}</b>
      <input type="range" min={p.min} max={p.max} step={p.step || 1} value={p.value} onChange={(e) => p.on(+e.target.value)} />
    </label>
  );
}

export default function App() {
  const [code, setCode] = useState(STARTER);
  const proj = useMemo(() => readProj(code), [code]);
  const meta = proj.meta;
  const [tab, setTab] = useState<'visual' | 'code'>('visual');
  const [plain, setPlain] = useState(isNative());
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selected, setSelected] = useState('');
  const [time, setTime] = useState(0);
  const timeRef = useRef(0);
  timeRef.current = time;
  const [playing, setPlaying] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [history, setHistory] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);
  const [props, setProps] = useState({ text: '', color: '#ffffff', bg: '#000000', size: 48, opacity: 100 });
  const [anim, setAnim] = useState<Anim>({ ...DEFAULT_KF });
  const [liveCode, setLiveCode] = useState(code);
  const [frameKey, setFrameKey] = useState(0);
  const [quality, setQuality] = useState(0.2);
  const [exp, setExp] = useState({ on: false, done: 0, total: 0 });
  const [err, setErr] = useState('');
  const [result, setResult] = useState<{ url: string; bytes: Uint8Array; name: string } | null>(null);

  const frame = useRef<HTMLIFrameElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 300, h: 300 });
  const exporting = useRef(false);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const loadWaiter = useRef<(() => void) | null>(null);
  const pend = useRef(new Map<number, (m: Reply) => void>());
  const rid = useRef(0);
  const lastPush = useRef({ key: '', at: 0 });

  const selectedLayer = layers.find((l) => l.id === selected);
  const kfList: KF[] = proj.kf[selected] || [];
  const doc = useMemo(() => buildDoc(liveCode), [liveCode]);

  /* ---------- code history ---------- */
  const pushCode = (next: string, key = '') => {
    if (next === code) return;
    const now = Date.now();
    const merge = !!key && lastPush.current.key === key && now - lastPush.current.at < 700;
    lastPush.current = { key, at: now };
    if (!merge) setHistory((h) => [...h.slice(-39), code]);
    setFuture([]);
    setCode(next);
  };
  const undo = () => {
    if (!history.length) return;
    setFuture((f) => [code, ...f]);
    setCode(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setStatus('Undo');
  };
  const redo = () => {
    if (!future.length) return;
    setHistory((h) => [...h, code]);
    setCode(future[0]);
    setFuture((f) => f.slice(1));
    setStatus('Redo');
  };
  const commit = (next: Proj, key = '') => pushCode(writeProj(code, next), key);

  /* ---------- preview frame plumbing (postMessage RPC to the runtime inside the iframe) ---------- */
  useEffect(() => {
    const t = setTimeout(() => setLiveCode(code), 250);
    return () => clearTimeout(t);
  }, [code]);

  useEffect(() => {
    const on = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      const m = e.data;
      if (!m || m.type !== 'DIVRIZ_REPLY') return;
      const f = pend.current.get(m.id);
      if (f) { pend.current.delete(m.id); f(m as Reply); }
    };
    window.addEventListener('message', on);
    return () => window.removeEventListener('message', on);
  }, []);

  const rpc = (msg: Record<string, unknown>, timeout = 20000) =>
    new Promise<Reply>((resolve, reject) => {
      const w = frame.current?.contentWindow;
      if (!w) { reject(new Error('Preview ready nahi hai')); return; }
      const id = ++rid.current;
      const to = setTimeout(() => { pend.current.delete(id); reject(new Error('Preview ne jawab nahi diya (timeout)')); }, timeout);
      pend.current.set(id, (m) => { clearTimeout(to); resolve(m); });
      w.postMessage({ ...msg, id }, '*');
    });

  const seekNow = (t: number) => {
    rpc({ type: 'seek', t }, 8000)
      .then((r) => { if (!r.ok && !exporting.current) setFrameKey((k) => k + 1); }) // page uses JS timers: rewind = reload + replay
      .catch(() => undefined);
  };
  const onFrameLoad = () => {
    const w = loadWaiter.current;
    loadWaiter.current = null;
    if (w) w();
    if (!exporting.current) seekNow(timeRef.current);
  };
  const reloadFrame = () => new Promise<void>((res) => { loadWaiter.current = res; setFrameKey((k) => k + 1); });

  useEffect(() => { if (!exporting.current) seekNow(time); }, [time]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing) return;
    const t0 = performance.now(), base = timeRef.current;
    let raf = 0, last = -1;
    const loop = () => {
      const t = base + (performance.now() - t0) / 1000;
      if (t >= meta.dur) { setTime(meta.dur); setPlaying(false); return; }
      if (t - last >= 1 / 30) { last = t; setTime(+t.toFixed(3)); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, meta.dur]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: Math.max(80, el.clientWidth - 24), h: Math.max(80, el.clientHeight - 24) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const k = Math.max(0.05, Math.min(box.w / meta.w, box.h / meta.h));

  /* ---------- layers & visual edits ---------- */
  const loadProps = (l: Layer, c = code) => setProps({ text: l.text, ...readInline(c, l.selector) });
  const scan = (c = code) => {
    const r = scanLayers(c);
    setLayers(r.layers);
    const first = r.layers.find((l) => l.id === selected) || r.layers[0];
    setSelected(first ? first.id : '');
    if (r.code !== c) pushCode(r.code);
    if (first) loadProps(first, r.code);
    setStatus(`${r.layers.length} elements detected`);
  };
  useEffect(() => { scan(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chooseLayer = (l: Layer) => { setSelected(l.id); loadProps(l); setAnim({ ...DEFAULT_KF }); };
  const applyStyle = (key: string, value: string) => {
    if (!selectedLayer) return;
    pushCode(mutate(code, selectedLayer.selector, (el) => el.style.setProperty(key, value)), 'style:' + key);
  };
  const editText = (value: string) => {
    if (!selectedLayer) return;
    pushCode(mutate(code, selectedLayer.selector, (el) => { el.textContent = value; }), 'text');
    setLayers((a) => a.map((x) => (x.id === selected ? { ...x, text: value, label: value || x.label } : x)));
    setProps((p) => ({ ...p, text: value }));
  };

  /* ---------- project meta ---------- */
  const setMeta = (p: Partial<Meta>) => commit({ meta: { ...meta, ...p }, kf: proj.kf }, 'meta');
  const autoDuration = async () => {
    try {
      const r = await rpc({ type: 'info' });
      if (r.auto && r.auto > 0) { setMeta({ dur: Math.min(300, Math.max(1, Math.ceil(r.auto * 10) / 10 + 0.5)) }); setStatus('Duration animation se detect hua'); }
      else setStatus('Auto duration nahi mili — manually set karo');
    } catch (e) { setStatus(String(e)); }
  };

  /* ---------- keyframes ---------- */
  const setKFs = (id: string, list: KF[], key = '') => {
    const next = { ...proj.kf };
    if (list.length) next[id] = list.slice().sort((a, b) => a.t - b.t);
    else delete next[id];
    commit({ meta, kf: next }, key);
  };
  const near = (a: number, b: number) => Math.abs(a - b) < 0.05;
  const mergeKF = (list: KF[], add: KF[]) => [...list.filter((x) => !add.some((a) => near(a.t, x.t))), ...add];
  const clampT = (t: number) => +Math.min(meta.dur, Math.max(0, t)).toFixed(2);

  const setKeyframe = () => {
    if (!selected) return;
    setKFs(selected, mergeKF(kfList, [{ t: clampT(time), ...anim }]));
    setStatus(`Keyframe @ ${fmt(time)}s`);
  };
  const onAnim = (patch: Partial<Anim>) => {
    const next = { ...anim, ...patch };
    setAnim(next);
    const cur = kfList.find((x) => near(x.t, time));
    if (cur) setKFs(selected, kfList.map((x) => (x === cur ? { ...x, ...next } : x)), 'anim');
  };
  const pickKF = (x: KF) => {
    setTime(x.t);
    setAnim({ x: x.x, y: x.y, s: x.s, r: x.r, o: x.o, e: x.e });
  };
  const PRESETS: { name: string; make: (t: number) => KF[] }[] = [
    { name: 'Fade In', make: (t) => [{ t, ...DEFAULT_KF, o: 0, e: 'ease-out' }, { t: t + 0.6, ...DEFAULT_KF }] },
    { name: 'Fade Out', make: (t) => [{ t, ...DEFAULT_KF }, { t: t + 0.6, ...DEFAULT_KF, o: 0 }] },
    { name: 'Slide Up', make: (t) => [{ t, ...DEFAULT_KF, y: 90, o: 0, e: 'ease-out' }, { t: t + 0.7, ...DEFAULT_KF }] },
    { name: 'Zoom In', make: (t) => [{ t, ...DEFAULT_KF, s: 50, o: 0, e: 'ease-out' }, { t: t + 0.6, ...DEFAULT_KF }] },
    { name: 'Pop', make: (t) => [{ t, ...DEFAULT_KF, s: 0, o: 0, e: 'cubic-bezier(.34,1.56,.64,1)' }, { t: t + 0.7, ...DEFAULT_KF }] },
    { name: 'Spin In', make: (t) => [{ t, ...DEFAULT_KF, r: -180, s: 30, o: 0, e: 'ease-out' }, { t: t + 0.8, ...DEFAULT_KF }] },
  ];
  const applyPreset = (p: (typeof PRESETS)[number]) => {
    if (!selected) return;
    const add = p.make(clampT(time)).map((x) => ({ ...x, t: clampT(x.t) }));
    setKFs(selected, mergeKF(kfList, add));
    setStatus(`${p.name} @ ${fmt(time)}s`);
  };

  /* ---------- import / save ---------- */
  const loadProject = (text: string, name: string) => {
    const r = scanLayers(text);
    setHistory((h) => [...h.slice(-39), code]);
    setFuture([]);
    setCode(r.code);
    setLayers(r.layers);
    setSelected(r.layers[0] ? r.layers[0].id : '');
    if (r.layers[0]) loadProps(r.layers[0], r.code);
    setTime(0);
    setPlaying(false);
    setStatus(`Imported ${name} · ${r.layers.length} elements`);
  };
  const openFile = async (file?: File) => {
    if (!file) return;
    try {
      const text = /\.zip$/i.test(file.name) ? await importZip(file) : await file.text();
      loadProject(text, file.name);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  };
  const save = async () => {
    try { setStatus(await saveBytes(new TextEncoder().encode(code), 'divriz-project.html', 'text/html')); }
    catch (e) { setStatus(String(e)); }
  };

  /* ---------- export ---------- */
  const exportVideo = async () => {
    if (exp.on) return;
    setPlaying(false);
    setErr('');
    const sig = { cancelled: false };
    cancelRef.current = sig;
    exporting.current = true;
    setExp({ on: true, done: 0, total: Math.round(meta.dur * meta.fps) });
    setStatus('Export shuru…');
    try {
      setLiveCode(code);
      await reloadFrame(); // fresh page, virtual clock = 0
      await rpc({ type: 'prepare' });
      const bytes = await exportMp4({
        w: meta.w, h: meta.h, fps: meta.fps, dur: meta.dur, bpp: quality, signal: sig,
        onProgress: (done, total) => setExp({ on: true, done, total }),
        frame: async (t) => {
          const r = await rpc({ type: 'frame', t, w: meta.w, h: meta.h }, 30000);
          if (!r.ok || !r.svg) throw new Error(r.error || 'Frame capture fail ho gaya');
          return r.svg;
        },
      });
      const d = new Date(), p2 = (n: number) => String(n).padStart(2, '0');
      const name = `divriz-${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}.mp4`;
      setResult({ url: URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'video/mp4' })), bytes, name });
      setStatus('Export complete ✓');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
      setStatus('Export fail: ' + msg);
    } finally {
      exporting.current = false;
      setExp({ on: false, done: 0, total: 0 });
      setFrameKey((x) => x + 1);
    }
  };
  const closeResult = () => { if (result) URL.revokeObjectURL(result.url); setResult(null); };

  /* ---------- ui ---------- */
  const fmtIdx = FORMATS.findIndex((f) => f.w === meta.w && f.h === meta.h);
  const trackLayers = Object.keys(proj.kf).slice(0, 6);
  const labelOf = (id: string) => layers.find((l) => l.id === id)?.label || id;
  const pct = exp.total ? Math.round((exp.done / exp.total) * 100) : 0;
  const busy = exp.on;

  return (
    <div className="app">
      <header>
        <div className="brand"><div className="logo">D</div><div><b>DIVRIZ</b><small>AFTER MOTION <em>V0.3</em></small></div></div>
        <div className="head-actions">
          <span className="status">{status}</span>
          <button disabled={busy} onClick={() => document.getElementById('file')?.click()}><FolderOpen size={16} /> Import</button>
          <input id="file" type="file" accept=".html,.htm,.zip" hidden onChange={(e) => { void openFile(e.target.files?.[0]); e.target.value = ''; }} />
          <button className="blue" onClick={save}>Save</button>
        </div>
      </header>
      <main>
        <section className="panel source">
          <div className="panel-title">
            <span><Code2 size={16} /> PROJECT SOURCE</span>
            <div className="tools">
              <button title="Undo" onClick={undo}><Undo2 size={15} /></button>
              <button title="Redo" onClick={redo}><Redo2 size={15} /></button>
              <button title="Detect HTML elements" onClick={() => scan()}><RefreshCw size={15} /> Detect</button>
            </div>
          </div>
          <div className="tabs">
            <button className={tab === 'visual' ? 'active' : ''} onClick={() => setTab('visual')}><SlidersHorizontal size={14} /> Layers</button>
            <button className={tab === 'code' ? 'active' : ''} onClick={() => setTab('code')}><FileCode2 size={14} /> HTML Code</button>
            {tab === 'code' && <button onClick={() => setPlain(!plain)}>{plain ? 'Pro editor' : 'Simple editor'}</button>}
          </div>
          {tab === 'code' ? (
            <div className="editor">
              {plain ? (
                <textarea className="plain-editor" spellCheck={false} value={code} onChange={(e) => pushCode(e.target.value, 'type')} />
              ) : (
                <Suspense fallback={<div className="empty"><b>Editor load ho raha hai…</b></div>}>
                  <CodeEditor value={code} onChange={(v) => pushCode(v, 'type')} />
                </Suspense>
              )}
            </div>
          ) : (
            <div className="layer-area">
              <div className="layer-head"><b><Layers size={14} /> LAYERS</b><span>{layers.length} items</span></div>
              {layers.length === 0 ? (
                <div className="empty"><FileCode2 size={30} /><b>Koi layer nahi mili</b><p>HTML Code tab me code paste karo ya Import karo, phir Detect dabao.</p><button className="blue" onClick={() => scan()}>Detect Elements</button></div>
              ) : layers.map((l) => (
                <button key={l.id} className={`layer ${selected === l.id ? 'selected' : ''}`} onClick={() => chooseLayer(l)}>
                  <span className="layer-icon">{l.kind === 'Text' ? 'T' : l.kind === 'Image' ? '▧' : l.kind === 'SVG' ? '◇' : '▱'}</span>
                  <span className="layer-copy"><b>{l.label}</b><small>{l.kind} · &lt;{l.tag}&gt;</small></span>
                  {proj.kf[l.id] && <Diamond size={12} className="kf-badge" />}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="panel preview-panel">
          <div className="panel-title"><span><Eye size={16} /> LIVE CANVAS</span><span className="tag">{meta.w}×{meta.h} · {meta.fps}fps</span></div>
          <div className="preview-area" ref={wrap}>
            <div className="stagebox" style={{ width: meta.w * k, height: meta.h * k }}>
              <iframe
                key={frameKey}
                ref={frame}
                title="Motion preview"
                srcDoc={doc}
                sandbox="allow-scripts"
                onLoad={onFrameLoad}
                style={{ width: meta.w, height: meta.h, transform: `scale(${k})`, transformOrigin: '0 0' }}
              />
            </div>
          </div>
          <div className="transport">
            <button className="play" disabled={busy} onClick={() => { if (time >= meta.dur) setTime(0); setPlaying(!playing); }}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
            <span>{time.toFixed(1)}s / {meta.dur}s</span>
            <input type="range" min="0" max={meta.dur} step=".01" value={time} disabled={busy} onChange={(e) => { setPlaying(false); setTime(+e.target.value); }} />
          </div>
          <div className="timeline">
            <div className="timeline-title"><span><Film size={14} /> TIMELINE</span><span className="hint">◆ = keyframe</span></div>
            <div className="timeline-track"><span>Scene</span><div className="track"><div style={{ width: `${(time / meta.dur) * 100}%` }} /></div></div>
            {trackLayers.map((id) => (
              <div className="timeline-track" key={id}>
                <span title={labelOf(id)}>{labelOf(id)}</span>
                <div className="track muted kf-track">
                  <div className="kf-fill" style={{ width: `${(time / meta.dur) * 100}%` }} />
                  {proj.kf[id].map((x, i) => (
                    <button key={i} className="kf-dot" style={{ left: `${(x.t / meta.dur) * 100}%` }} title={`${fmt(x.t)}s`} onClick={() => { setSelected(id); pickKF(x); }}>◆</button>
                  ))}
                </div>
              </div>
            ))}
            {trackLayers.length === 0 && <div className="timeline-track"><span /><small className="hint">Layer select karke keyframe ya preset lagao →</small></div>}
          </div>
          <div className="project-bar">
            <label>Format
              <select value={fmtIdx} disabled={busy} onChange={(e) => { const f = FORMATS[+e.target.value]; if (f) setMeta({ w: f.w, h: f.h }); }}>
                {fmtIdx < 0 && <option value={-1}>Custom {meta.w}×{meta.h}</option>}
                {FORMATS.map((f, i) => <option key={f.name} value={i}>{f.name}</option>)}
              </select>
            </label>
            <label>FPS
              <select value={meta.fps} disabled={busy} onChange={(e) => setMeta({ fps: +e.target.value })}>{[24, 30, 60].map((f) => <option key={f}>{f}</option>)}</select>
            </label>
            <label>Duration
              <input type="number" min={1} max={300} step={0.5} value={meta.dur} disabled={busy} onChange={(e) => setMeta({ dur: Math.max(1, Math.min(300, +e.target.value || 1)) })} />s
            </label>
            <button disabled={busy} onClick={autoDuration} title="Animation ki length se duration set karo">Auto</button>
            <label>W×H
              <input type="number" value={meta.w} disabled={busy} onChange={(e) => setMeta({ w: roundEven(+e.target.value || 2) })} />
              <input type="number" value={meta.h} disabled={busy} onChange={(e) => setMeta({ h: roundEven(+e.target.value || 2) })} />
            </label>
          </div>
          <div className="export">
            <div>
              <b>Export MP4 (H.264)</b>
              <small>{busy ? `Frame ${exp.done}/${exp.total} · ${pct}% — app khula rakho` : `${meta.dur}s · ${Math.round(meta.dur * meta.fps)} frames · on-device`}</small>
            </div>
            <div className="export-actions">
              {!busy && (
                <select value={quality} onChange={(e) => setQuality(+e.target.value)} title="Quality">
                  <option value={0.1}>Small</option><option value={0.2}>Normal</option><option value={0.35}>High</option>
                </select>
              )}
              {busy
                ? <button onClick={() => { cancelRef.current.cancelled = true; }}><X size={15} /> Cancel</button>
                : <button className="blue" onClick={exportVideo}><Download size={15} /> Export</button>}
            </div>
          </div>
          {busy && <div className="progress"><div style={{ width: `${pct}%` }} /></div>}
          {err && <div className="err">{err}</div>}
        </section>

        <section className="panel inspector">
          <div className="panel-title"><span><SlidersHorizontal size={16} /> PROPERTIES</span><span className="tag">V0.3</span></div>
          {selectedLayer ? (
            <div className="inspector-body">
              <div className="selected-name">{selectedLayer.label}<small>{selectedLayer.selector}</small></div>
              {selectedLayer.kind === 'Text' && <label>Text Content<textarea value={props.text} onChange={(e) => editText(e.target.value)} /></label>}
              <label>Text Color<input type="color" value={props.color} onChange={(e) => { setProps((p) => ({ ...p, color: e.target.value })); applyStyle('color', e.target.value); }} /></label>
              <label>Background<input type="color" value={props.bg} onChange={(e) => { setProps((p) => ({ ...p, bg: e.target.value })); applyStyle('background-color', e.target.value); }} /></label>
              <Slider label="Font Size" value={props.size} min={8} max={240} unit="px" on={(n) => { setProps((p) => ({ ...p, size: n })); applyStyle('font-size', n + 'px'); }} />
              <Slider label="Opacity" value={props.opacity} min={0} max={100} unit="%" on={(n) => { setProps((p) => ({ ...p, opacity: n })); applyStyle('opacity', String(n / 100)); }} />

              <div className="section-title"><Diamond size={13} /> ANIMATION KEYFRAMES</div>
              <div className="presets">{PRESETS.map((p) => <button key={p.name} disabled={busy} onClick={() => applyPreset(p)}>{p.name}</button>)}</div>
              <Slider label="Position X" value={anim.x} min={-meta.w} max={meta.w} unit="px" on={(n) => onAnim({ x: n })} />
              <Slider label="Position Y" value={anim.y} min={-meta.h} max={meta.h} unit="px" on={(n) => onAnim({ y: n })} />
              <Slider label="Scale" value={anim.s} min={0} max={400} unit="%" on={(n) => onAnim({ s: n })} />
              <Slider label="Rotate" value={anim.r} min={-720} max={720} unit="°" on={(n) => onAnim({ r: n })} />
              <Slider label="Opacity" value={anim.o} min={0} max={100} unit="%" on={(n) => onAnim({ o: n })} />
              <label>Easing
                <select value={anim.e} onChange={(e) => onAnim({ e: e.target.value })}>{EASES.map((e) => <option key={e} value={e}>{EASE_LABEL[e] || e}</option>)}</select>
              </label>
              <button className="blue wide" disabled={busy} onClick={setKeyframe}><Diamond size={14} /> Set keyframe @ {fmt(time)}s</button>
              <div className="kf-list">
                {kfList.map((x, i) => (
                  <span key={i} className={`chip ${near(x.t, time) ? 'on' : ''}`}>
                    <button onClick={() => pickKF(x)}>{fmt(x.t)}s</button>
                    <button title="Delete keyframe" onClick={() => setKFs(selected, kfList.filter((y) => y !== x))}><Trash2 size={11} /></button>
                  </span>
                ))}
                {kfList.length === 0 && <small className="hint">Abhi koi keyframe nahi. Timeline pe time chuno, sliders badlo, phir &quot;Set keyframe&quot; dabao. Do keyframe ke beech smooth animation banegi.</small>}
              </div>
              <p className="note">Keyframes HTML ke andar JSON me save hote hain aur video export me bhi aate hain. Position/scale/rotate original CSS animation ke upar compose hote hain.</p>
            </div>
          ) : (
            <div className="empty compact"><SlidersHorizontal size={26} /><b>Layer select karo</b><p>Left panel se koi element chuno.</p></div>
          )}
        </section>
      </main>

      {result && (
        <div className="modal" onClick={closeResult}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="panel-title"><span>VIDEO READY · {(result.bytes.length / 1048576).toFixed(1)} MB</span><button onClick={closeResult}><X size={14} /></button></div>
            <video src={result.url} controls playsInline autoPlay loop />
            <div className="modal-actions">
              <button className="blue" onClick={() => saveBytes(result.bytes, result.name, 'video/mp4').then(setStatus).catch((e) => setStatus(String(e)))}><Download size={15} /> {isNative() ? 'Save' : 'Download'}</button>
              {isNative() && <button onClick={() => shareBytes(result.bytes, result.name, 'video/mp4').then(setStatus).catch((e) => setStatus(String(e)))}><Share2 size={15} /> Share</button>}
            </div>
          </div>
        </div>
      )}
      <footer><span>DIVRIZ AFTER MOTION · HTML → MP4</span><span>ON-DEVICE RENDER · WEBCODECS</span></footer>
    </div>
  );
}
