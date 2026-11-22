// Motion Pro library browser: 171,000 templates, preview + edit text + download. (The Studio uses the same templates automatically.)
import { useMemo, useState } from 'react';
import { buildDoc, catalogue, MP_TOTAL, mpInfo, type MpCopy } from '../lib/motionpro';

const PAL: Array<[string, string, string, string, string, 0 | 1]> = [['#0b1020', '#1a2559', '#ffb454', '#5ee0c0', '#ffffff', 1], ['#070b14', '#0f1b33', '#4f8cff', '#7be0ff', '#ffffff', 1], ['#0d0716', '#25104a', '#9b6bff', '#ff7ad9', '#ffffff', 1], ['#f6f8ff', '#e4ebff', '#2f5bff', '#00c2a8', '#0b1230', 0]];

export default function MotionProBrowser() {
  const [idx, setIdx] = useState(2202), [pal, setPal] = useState(0), [head, setHead] = useState(''), [sub, setSub] = useState(''), [steps, setSteps] = useState(''), [stat, setStat] = useState(''), [name, setName] = useState(''), [nonce, setNonce] = useState(0);
  const names = useMemo(() => [...catalogue().keys()].sort(), []);
  const copy: MpCopy = useMemo(() => {
    const c: MpCopy = {}; const h = head.split('/').map((x) => x.trim()).filter(Boolean); if (h.length) c.head = h.slice(0, 3); if (sub.trim()) c.sub = sub.trim();
    const st = steps.split('/').map((x) => x.trim()).filter(Boolean); if (st.length) c.steps = st;
    const m = /^(\D*?)(\d[\d.,]*)(.*)$/.exec(stat.trim()); if (m) c.stat = { label: sub.trim() || 'Stat', prefix: m[1].trim(), value: parseFloat(m[2].replace(/,/g, '')), suffix: m[3].trim() };
    return c;
  }, [head, sub, steps, stat]);
  const doc = useMemo(() => { try { return buildDoc({ idx, copy, pal: PAL[pal] }); } catch { return null; } }, [idx, copy, pal, nonce]);
  const info = useMemo(() => { try { return mpInfo(idx); } catch { return null; } }, [idx]);
  const go = (d: number) => setIdx((i) => Math.min(MP_TOTAL, Math.max(1, i + d)));
  const jump = (n: string) => { const a = catalogue().get(n); if (a) setIdx(a[Math.floor(Math.random() * a.length)]); };
  const download = () => { if (!doc) return; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([doc.html], { type: 'text/html' })); a.download = `motion_pro_${idx}.html`; a.click(); };
  return (
    <div className="card">
      <h3>✨ Motion Pro ({MP_TOTAL.toLocaleString()} templates)</h3>
      <small className="muted">Studio mein AI inhe script ke hisaab se khud edit karke lagata hai. Yahan aap dekh sakte hain, text badal sakte hain aur HTML download kar sakte hain.</small>
      <div className="seg"><button onClick={() => go(-1)}>◀</button><input type="number" min={1} max={MP_TOTAL} value={idx} onChange={(e) => setIdx(Math.min(MP_TOTAL, Math.max(1, +e.target.value || 1)))} style={{ width: 110 }} /><button onClick={() => go(1)}>▶</button><button onClick={() => setNonce((n) => n + 1)}>🔁 Replay</button></div>
      <select value={name} onChange={(e) => { setName(e.target.value); jump(e.target.value); }}><option value="">Type chuno ({names.length} types)…</option>{names.map((n) => <option key={n} value={n}>{n}</option>)}</select>
      {info && <small>#{idx} · {info.name} · {info.T}s</small>}
      {doc && <iframe key={idx + '-' + pal + '-' + nonce + doc.html.length} title="Motion Pro preview" sandbox="allow-scripts" srcDoc={doc.html} style={{ width: '100%', aspectRatio: '16/9', border: 0, borderRadius: 12, background: '#000' }} />}
      <div className="seg">{PAL.map((_, i) => <button key={i} className={pal === i ? 'on' : ''} onClick={() => setPal(i)}>Colour {i + 1}</button>)}</div>
      <input placeholder="Headline (/ se lines alag)" value={head} onChange={(e) => setHead(e.target.value)} />
      <input placeholder="Sub text / label" value={sub} onChange={(e) => setSub(e.target.value)} />
      <input placeholder="Steps ya timeline items (/ se alag)" value={steps} onChange={(e) => setSteps(e.target.value)} />
      <input placeholder="Stat number, jaise ₹5000 ya 12%" value={stat} onChange={(e) => setStat(e.target.value)} />
      <button className="btn" onClick={download}>⬇️ HTML download</button>
    </div>
  );
}
