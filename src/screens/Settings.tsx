import { useEffect, useState } from 'react';

export default function Settings() {
  const [est, setEst] = useState('');
  useEffect(() => {
    navigator.storage?.estimate?.().then((e) => setEst(`${Math.round((e.usage ?? 0) / 1e6)} MB used / ~${Math.round((e.quota ?? 0) / 1e6)} MB`));
  }, []);
  const persist = async () => { const ok = await navigator.storage?.persist?.(); alert(ok ? 'Persistent storage granted' : 'Browser ne persistent storage nahi diya'); };
  return (
    <section>
      <h2>⚙️ Settings</h2>
      <div className="card block"><b>Storage</b><small>{est || '…'}</small><button className="btn" onClick={persist}>Request persistent storage</button></div>
      <div className="card block"><b>Privacy</b><small>कोई backend नहीं, कोई API key नहीं. सारा project data आपके device (IndexedDB/OPFS) में रहता है. Research requests सीधे public sources (GDELT, Hacker News, Wikipedia) को जाती हैं.</small></div>
      <div className="card block"><b>Version</b><small>DIVRIZ AI 0.3.0 — Phase 1–4 build</small></div>
    </section>
  );
}
