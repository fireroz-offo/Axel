import { useEffect, useState } from 'react';
import { CAPS_MB, deleteModelCache, enforce, modelCacheInfo, purgeLegacyModels } from '../storage/budget';
import { health } from '../ai/net/keyless';
import { cleanRenders, rendersSize } from '../lib/render/output';

export default function Settings() {
  const [est, setEst] = useState('');
  const [cap, setCap] = useState<number>(Number(localStorage.getItem('divriz.capMB')) || 100);
  const [rsz, setRsz] = useState(0);
  const [wm, setWm] = useState<{ files: number; mb: number | null }>({ files: 0, mb: 0 });
  const [msg, setMsg] = useState('');
  const refresh = () => {
    navigator.storage?.estimate?.().then((e) => setEst(`${Math.round((e.usage ?? 0) / 1e6)} MB used / ~${Math.round((e.quota ?? 0) / 1e6)} MB`));
    rendersSize().then(setRsz); modelCacheInfo().then(setWm);
  };
  useEffect(refresh, []);
  const persist = async () => { const ok = await navigator.storage?.persist?.(); setMsg(ok ? 'Persistent storage granted' : 'Browser ne persistent storage nahi diya'); };
  return (
    <section>
      <h2>⚙️ Settings</h2>
      <div className="card block"><b>Storage (GB kahan jaa raha hai)</b><small>{est || '…'}</small>
        <small>Purane renders (OPFS): {(rsz / 1048576).toFixed(1)} MB</small>
        <button className="btn" onClick={async () => { const n = await cleanRenders(); setMsg(`${n} purani MP4 hatayi`); refresh(); }}>🧹 Purane renders saaf karo</button>
        <button className="btn" onClick={persist}>Request persistent storage</button></div>
      <div className="card block"><b>Storage limit (app data)</b>
        <small className="muted">App apna data is limit ke andar rakhta hai; zyada hone par sabse purani MP4/cache pehle hatti hai.</small>
        <div className="row2">{CAPS_MB.map((c) => <button key={c} className={cap === c ? 'btn' : 'btn ghost'} onClick={() => { setCap(c); localStorage.setItem('divriz.capMB', String(c)); }}>{c} MB</button>)}</div>
        <button className="btn" onClick={async () => { const r = await enforce(cap); setMsg(`${r.removed} file hati; ab ${r.afterMB.toFixed(1)} MB${r.fits ? '' : ' (pinned files limit se bade hain)'}`); refresh(); }}>🧹 Limit lagao abhi</button>
        <button className="btn ghost" onClick={async () => { const n = await purgeLegacyModels(); setMsg(n ? `${n} purane AI-model cache hataye (GB wapas)` : 'Koi purana model cache nahi mila'); refresh(); }}>Purane AI model cache hatao</button></div>
      <div className="card block"><b>Whisper model (voiceover pehchan)</b>
        <small className="muted">{wm.files ? `Device par saved: ${wm.files} files${wm.mb !== null ? ' · ' + wm.mb.toFixed(0) + ' MB' : ''}` : 'Abhi download nahi hua (Studio mein pehli baar chunne par ~40-80 MB).'}</small>
        {wm.files > 0 && <button className="btn ghost" onClick={async () => { await deleteModelCache(); setMsg('Whisper model hata diya'); refresh(); }}>Whisper model hatao</button>}</div>
      <div className="card block"><b>Internet AI check</b>
        <small className="muted">Keyless public AI endpoint abhi chal raha hai ya nahi, yahan asli test hota hai. Na chale to app rule-based engine se kaam karta hai.</small>
        <button className="btn" onClick={async () => { setMsg('Test ho raha hai…'); const r = await health(); setMsg(r.map((x) => `${x.id}: ${x.ok ? 'OK ' + x.ms + ' ms' : 'FAIL ' + x.error}`).join(' | ')); }}>AI test chalao</button></div>
      {msg && <p className="muted">{msg}</p>}
      <div className="card block"><b>Privacy</b><small>कोई backend नहीं, कोई API key नहीं. सारा project data आपके device (IndexedDB/OPFS) में रहता है. Research requests सीधे public sources (GDELT, Hacker News, Wikipedia) को जाती हैं.</small></div>
      <div className="card block"><b>Version</b><small>DIVRIZ AI 0.9.0 — Whisper + Pro Motion</small></div>
    </section>
  );
}
