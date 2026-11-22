import { useRef, useState } from 'react';
import { runFeasibility, type TestResult } from '../lib/feasibility';
import { renderTestMp4, type PocResult } from '../lib/mp4poc';
import { saveToDownloads, shareFile } from '../lib/saveFile';

export default function Lab() {
  const [res, setRes] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [prog, setProg] = useState(0);
  const [poc, setPoc] = useState<(PocResult & { url: string }) | null>(null);
  const [err, setErr] = useState('');
  const [size, setSize] = useState<'360' | '720'>('360');
  const urlRef = useRef<string>('');
  const [saveMsg, setSaveMsg] = useState('');
  const run2 = async (fn: typeof saveToDownloads) => { setSaveMsg('Saving…'); try { setSaveMsg(await fn(poc!.blob, 'divriz-test.mp4')); } catch (e) { setSaveMsg('❌ ' + (e as Error).message); } };

  const runAll = async () => { setRes([]); setRunning(true); await runFeasibility((r) => setRes((x) => [...x, r])); setRunning(false); };

  const renderPoc = async () => {
    setErr(''); setPoc(null); setProg(0); setSaveMsg('');
    try {
      const [w, h] = size === '720' ? [1280, 720] : [640, 360];
      const r = await renderTestMp4({ width: w, height: h, fps: 30, seconds: 4, withAudio: true }, setProg);
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(r.blob);
      setPoc({ ...r, url: urlRef.current });
    } catch (e) { setErr((e as Error).message); }
  };

  const groups = [...new Set(res.map((r) => r.group))];
  return (
    <section>
      <h2>🧪 Feasibility Lab</h2>
      <p className="muted">Asli tests — is phone/browser par kya chalta hai. Result report me save karne ke liye screenshot lijiye.</p>
      <button className="btn" disabled={running} onClick={runAll}>{running ? 'Testing…' : 'Run all capability tests'}</button>
      {groups.map((g) => (
        <div key={g} className="card block">
          <h3>{g}</h3>
          {res.filter((r) => r.group === g).map((r) => (
            <div key={r.id} className="row"><span>{r.status === 'pass' ? '✅' : r.status === 'warn' ? '⚠️' : '❌'}</span><div><b>{r.label}</b><small>{r.detail}</small></div></div>
          ))}
        </div>
      ))}
      <div className="card block">
        <h3>Real MP4 render test</h3>
        <p className="muted">4 sec animation + audio tone ko WebCodecs se encode karke asli MP4 banata hai.</p>
        <div className="seg">
          <button className={size === '360' ? 'on' : ''} onClick={() => setSize('360')}>360p</button>
          <button className={size === '720' ? 'on' : ''} onClick={() => setSize('720')}>720p</button>
        </div>
        <button className="btn" onClick={renderPoc} disabled={prog > 0 && prog < 1}>Render test MP4</button>
        {prog > 0 && prog < 1 && <div className="bar"><i style={{ width: prog * 100 + '%' }} /></div>}
        {err && <p className="err">❌ {err}</p>}
        {poc && (
          <>
            <video src={poc.url} controls playsInline style={{ width: '100%', borderRadius: 12 }} />
            <p className="muted">{poc.note} · {poc.frames} frames · {(poc.ms / 1000).toFixed(1)}s render · {(poc.blob.size / 1024).toFixed(0)} KB</p>
            <button className="btn" onClick={() => run2(saveToDownloads)}>⬇️ Downloads me save karein</button>
            <button className="btn ghost" onClick={() => run2(shareFile)}>📤 Share</button>
            {saveMsg && <p className="muted">{saveMsg}</p>}
          </>
        )}
      </div>
    </section>
  );
}
