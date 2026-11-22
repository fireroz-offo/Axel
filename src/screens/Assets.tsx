// Phase 13: HTML/CSS/JS/ZIP/Lottie motion library. Assets are inspected, previewed in a sandbox, and used by the Studio only when they fit a scene.
import { useEffect, useRef, useState } from 'react';
import { readZip } from '../lib/assets/zip';
import { bundleHtml } from '../lib/assets/bundle';
import { inspectHtml } from '../lib/assets/inspect';
import { AssetRuntime, lottieWrapper } from '../lib/assets/runtime';
import { addAsset, loadAssets, saveAssets, type AssetDef } from '../lib/assets/store';

const SAMPLE = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Growth bars sample</title>
<meta name="divriz-duration" content="3"><meta name="divriz-tags" content="chart,bar,growth,finance"><meta name="divriz-category" content="finance">
<style>html,body{margin:0;height:100%;background:transparent;font-family:sans-serif}
.w{position:absolute;left:10%;right:10%;bottom:30%;height:40%;display:flex;gap:4%;align-items:flex-end}
.b{flex:1;background:var(--divriz-acc,#ffb454);border-radius:10px 10px 0 0;height:0;animation:up 2s cubic-bezier(.2,.8,.2,1) forwards}
.b:nth-child(2){animation-delay:.25s}.b:nth-child(3){animation-delay:.5s}.b:nth-child(4){animation-delay:.75s}
@keyframes up{to{height:var(--h)}}
h1{position:absolute;top:12%;left:0;right:0;text-align:center;color:var(--divriz-ink,#fff);font-size:5vw;margin:0}</style></head>
<body><h1>{{keyword}}</h1><div class="w"><div class="b" style="--h:25%"></div><div class="b" style="--h:45%"></div><div class="b" style="--h:70%"></div><div class="b" style="--h:100%"></div></div></body></html>`;

export default function Assets() {
  const [list, setList] = useState<AssetDef[]>([]);
  const [msg, setMsg] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [t, setT] = useState(0);
  const cv = useRef<HTMLCanvasElement>(null);
  const rt = useRef<AssetRuntime | null>(null);
  useEffect(() => { loadAssets().then(setList).catch(() => {}); return () => rt.current?.dispose(); }, []);

  const preview = async (a: AssetDef, time: number) => {
    rt.current?.dispose();
    rt.current = new AssetRuntime(new Map([[a.id, a]]), { w: 640, h: 360 }, () => ({ acc: '#ffb454', ink: '#ffffff', bg: '#0b1020' }));
    try {
      const bm = await rt.current.capture(a, time % Math.max(0.5, a.duration), { text: 'Preview text', keyword: 'Preview', number: '100%', acc: '#ffb454', ink: '#ffffff', bg: '#0b1020' });
      const c = cv.current?.getContext('2d'); if (c) { c.fillStyle = '#0b1020'; c.fillRect(0, 0, 640, 360); c.drawImage(bm, 0, 0); } bm.close(); setMsg('');
    } catch (e: any) { setMsg('Preview fail: ' + (e?.message ?? e)); }
  };
  useEffect(() => { const a = list.find((x) => x.id === sel); if (a) preview(a, t); /* eslint-disable-next-line */ }, [sel, t]);

  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return; setMsg('Inspect ho raha hai…');
    try {
      let next = list;
      for (const f of Array.from(files)) {
        const ext = f.name.split('.').pop()?.toLowerCase() ?? '', name = f.name.replace(/\.[^.]+$/, '');
        let html = '', external: string[] = [], kind: 'html' | 'lottie' = 'html', dur: number | undefined;
        if (ext === 'zip') { const b = bundleHtml(await readZip(await f.arrayBuffer())); html = b.html; external = b.external; if (b.missing.length) setMsg(`Missing files: ${b.missing.slice(0, 3).join(', ')}`); }
        else if (ext === 'json' || ext === 'lottie') { const w = lottieWrapper(await f.text()); html = w.html; kind = 'lottie'; dur = w.duration; }
        else if (ext === 'html' || ext === 'htm') html = await f.text();
        else if (ext === 'css' || ext === 'js') throw new Error('Akeli CSS/JS file asset nahi banti: HTML ya (HTML+CSS+JS wali) ZIP upload karein.');
        else throw new Error('Supported: .html, .zip, Lottie .json');
        const info = inspectHtml(html, [], external); if (kind === 'lottie') { info.libs = ['lottie']; if (dur) info.duration = dur; info.category = 'other'; }
        next = await addAsset(name, kind, html, info);
      }
      setList(next); setSel(next[0]?.id ?? null); setMsg(`✅ ${files.length} asset library mein add hua.`);
    } catch (e: any) { setMsg('❌ ' + (e?.message ?? e)); }
  };
  const addSample = async () => { const info = inspectHtml(SAMPLE); const n = await addAsset('Sample: growth bars', 'html', SAMPLE, info); setList(n); setSel(n[0].id); };
  const patch = async (id: string, p: Partial<AssetDef>) => { const n = list.map((a) => (a.id === id ? { ...a, ...p } : a)); setList(n); await saveAssets(n); };
  const remove = async (id: string) => { const n = list.filter((a) => a.id !== id); setList(n); await saveAssets(n); if (sel === id) setSel(null); };
  const cur = list.find((a) => a.id === sel);

  return (
    <section>
      <h2>🧩 HTML Motion Library</h2>
      <p className="muted">Apne motion graphics (HTML, HTML+CSS+JS ZIP, Lottie JSON) yahan daalein. Studio har scene ke liye pehle library mein dekhta hai; fit na baithe to AI naya motion graphic khud banata hai.</p>
      <input type="file" multiple accept=".html,.htm,.zip,.json,.lottie" onChange={(e) => { importFiles(e.target.files); e.target.value = ''; }} />
      <button onClick={addSample}>➕ Sample asset (test ke liye)</button>
      {msg && <p className={msg.startsWith('❌') ? 'bad' : msg.startsWith('✅') ? 'good' : 'muted'}>{msg}</p>}
      <details className="card block"><summary>📘 Asset kaise likhein (seek contract)</summary>
        <small>Har frame time ka function hota hai. Sabse aasaan: CSS animation / GSAP timeline likhein — runtime unhe time par seek kar leta hai. Canvas/JS ke liye <code>window.divrizSeek = function(t, v){'{'} … {'}'}</code> define karein (t = seconds, v = {'{'}text, keyword, number, acc, ink, bg{'}'}).</small>
        <small>Text placeholders: <code>{'{{text}} {{keyword}} {{number}}'}</code>. Colours: CSS vars <code>--divriz-acc / --divriz-ink / --divriz-bg</code>. Optional meta: <code>divriz-duration</code>, <code>divriz-tags</code>, <code>divriz-category</code>.</small>
        <small>Safety: asset sandbox mein chalta hai (network, storage, parent access band). External CDN links hata diye jate hain, isliye GSAP/Lottie app ke saath bundled aate hain.</small>
      </details>
      {list.map((a) => (
        <div key={a.id} className={'card block' + (sel === a.id ? ' sel' : '')}>
          <b onClick={() => setSel(sel === a.id ? null : a.id)} style={{ cursor: 'pointer' }}>{a.kind === 'lottie' ? '🎞️' : '🧩'} {a.name}</b>
          <small>{a.category} · {a.duration.toFixed(1)}s · {(a.size / 1024).toFixed(0)} KB{a.libs.length ? ' · ' + a.libs.join('+') : ''}{a.hasSeek ? ' · seek hook' : ''}</small>
          <small>Tags (comma): </small>
          <input className="ta" style={{ minHeight: 0 }} defaultValue={a.tags.join(', ')} onBlur={(e) => patch(a.id, { tags: e.target.value.split(',').map((x) => x.trim().toLowerCase()).filter(Boolean) })} />
          {a.warnings.map((w, i) => <small key={i} className="bad">⚠️ {w}</small>)}
          <div className="seg"><label><input type="checkbox" checked={a.enabled} onChange={(e) => patch(a.id, { enabled: e.target.checked })} /> Use karo</label><button onClick={() => remove(a.id)}>🗑 Hatao</button></div>
        </div>
      ))}
      {cur && (<div className="card"><canvas ref={cv} width={640} height={360} style={{ width: '100%', borderRadius: 12, background: '#0b1020' }} />
        <input type="range" min={0} max={cur.duration} step={0.1} value={t} onChange={(e) => setT(+e.target.value)} style={{ width: '100%' }} /><small>t = {t.toFixed(1)}s (sandbox preview)</small></div>)}
    </section>
  );
}
