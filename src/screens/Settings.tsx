import { useEffect, useState } from 'react';
import { cachedModels, deleteModel, type LlmTier } from '../lib/brain/llm';
import { cleanRenders, rendersSize } from '../lib/render/output';

export default function Settings() {
  const [est, setEst] = useState('');
  const [models, setModels] = useState<Array<{ tier: LlmTier; cached: boolean }>>([]);
  const [rsz, setRsz] = useState(0);
  const [msg, setMsg] = useState('');
  const refresh = () => {
    navigator.storage?.estimate?.().then((e) => setEst(`${Math.round((e.usage ?? 0) / 1e6)} MB used / ~${Math.round((e.quota ?? 0) / 1e6)} MB`));
    cachedModels().then(setModels); rendersSize().then(setRsz);
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
      <div className="card block"><b>AI model cache</b>
        <small className="muted">Models sirf tab download hote hain jab Studio mein aap unhe chunen. Yahan se delete karke GB wapas len.</small>
        {models.map(({ tier, cached }) => <div className="row2" key={tier.id}><span style={{ flex: 1, fontSize: 14 }}>{tier.label}<br /><small>{cached ? 'Device par saved' : 'Download nahi hua'}</small></span>{cached && <button className="btn ghost" onClick={async () => { await deleteModel(tier); setMsg(tier.label + ' delete hua'); refresh(); }}>🗑</button>}</div>)}
      </div>
      {msg && <p className="muted">{msg}</p>}
      <div className="card block"><b>Privacy</b><small>कोई backend नहीं, कोई API key नहीं. सारा project data आपके device (IndexedDB/OPFS) में रहता है. Research requests सीधे public sources (GDELT, Hacker News, Wikipedia) को जाती हैं.</small></div>
      <div className="card block"><b>Version</b><small>DIVRIZ AI 0.6.0 — Phase 6 + Library + size fixes</small></div>
    </section>
  );
}
