import { useEffect, useState } from 'react';
import { getCategory } from '../lib/categories';
import { runResearch } from '../lib/research';
import type { Project } from '../lib/types';

export default function Research({ project, onUpdate, goHome }: { project: Project | null; onUpdate: (p: Project) => Promise<void>; goHome: () => void }) {
  const [busy, setBusy] = useState(false);

  const run = async (p: Project) => {
    setBusy(true);
    try {
      const research = await runResearch(getCategory(p.category));
      await onUpdate({ ...p, research, stage: 'news' });
    } finally { setBusy(false); }
  };

  useEffect(() => {
    if (project && !project.research && !busy) run(project);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  if (!project) return <section><p>पहले Home पर category चुनिए.</p><button className="btn" onClick={goHome}>Home</button></section>;
  const cat = getCategory(project.category);
  const r = project.research;

  return (
    <section>
      <h2>{cat.emoji} {cat.label} — Live Research</h2>
      {r && <p className="muted">Research date: {new Date(r.ranAt).toLocaleString()}</p>}
      <button className="btn" disabled={busy} onClick={() => run(project)}>{busy ? 'Researching…' : '🔄 Research again'}</button>
      {r?.providers.map((p) => (
        <div key={p.provider} className="card block">
          <h3>{p.provider} <span className={'pill ' + (p.ok ? 'ok' : 'bad')}>{p.ok ? `${p.items.length} items` : 'failed'}</span></h3>
          {!p.ok && <p className="err">{p.error} — यह source अभी उपलब्ध नहीं; AI इसे use नहीं करेगा.</p>}
          <ul className="list">
            {p.items.map((it, i) => (
              <li key={i}>
                <a href={it.url} target="_blank" rel="noreferrer">{it.title}</a>
                <small>{it.source}{it.date ? ' · ' + it.date.slice(0, 10) : ''}{it.note ? ' · ' + it.note : ''}</small>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="card note">
        <b>अगला step (Phase 5–6):</b> Competitor research और AI Topic Recommendations. YouTube browser से सीधे CORS block करता है, इसलिए
        उसका keyless रास्ता Phase 5 में test होगा (देखें docs/FEASIBILITY_REPORT.md).
      </div>
    </section>
  );
}
