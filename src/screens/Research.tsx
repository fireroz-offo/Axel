import { useEffect, useState } from 'react';
import { getCategory } from '../lib/categories';
import { runResearch } from '../lib/research';
import type { Lang, Project, SourceItem } from '../lib/types';

const LANGS: Array<{ id: Lang; label: string }> = [{ id: 'hi', label: 'हिन्दी' }, { id: 'en', label: 'English' }, { id: 'both', label: 'दोनों' }];

export default function Research({ project, onUpdate, goHome }: { project: Project | null; onUpdate: (p: Project) => Promise<void>; goHome: () => void }) {
  const [busy, setBusy] = useState(false);

  const run = async (p: Project) => {
    setBusy(true);
    try {
      const research = await runResearch(getCategory(p.category), p.lang ?? 'hi');
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
  const lang = project.lang ?? 'hi';
  const selected = project.selected ?? [];
  const isSel = (it: SourceItem) => selected.some((s) => s.url === it.url);
  const toggle = (it: SourceItem) => onUpdate({ ...project, selected: isSel(it) ? selected.filter((s) => s.url !== it.url) : [...selected, it] });
  const length = project.length ?? 'short';
  const setLength = (l: 'short' | 'long') => onUpdate({ ...project, length: l });
  const setLang = async (l: Lang) => { const np = { ...project, lang: l, research: undefined }; await onUpdate(np); run(np); };

  return (
    <section>
      <h2>{cat.emoji} {cat.hi} — Live Research</h2>
      {r && <p className="muted">Research date: {new Date(r.ranAt).toLocaleString()}</p>}
      <div className="seg">{LANGS.map((l) => <button key={l.id} disabled={busy} className={lang === l.id ? 'on' : ''} onClick={() => setLang(l.id)}>{l.label}</button>)}</div>
      <small>Video length (script के लिए):</small>
      <div className="seg">
        <button className={length === 'short' ? 'on' : ''} onClick={() => setLength('short')}>Short · 30–50 सेकंड</button>
        <button className={length === 'long' ? 'on' : ''} onClick={() => setLength('long')}>Long · 5–10 मिनट</button>
      </div>
      <button className="btn" disabled={busy} onClick={() => run(project)}>{busy ? 'Research चल रही है… (1 मिनट तक लग सकता है)' : '🔄 दोबारा Research'}</button>

      <div className="card block">
        <h3>✅ चुने हुए विषय ({selected.length})</h3>
        {selected.length === 0 && <small>नीचे किसी भी खबर/विषय पर tap करके उसे Topic के लिए चुनिए. (Source खोलने के लिए 🔗 दबाइए)</small>}
        {selected.map((s) => <div key={s.url} className="row2"><span style={{ flex: 1, fontSize: 14 }}>{s.title}</span><button className="btn ghost" onClick={() => toggle(s)}>✖</button></div>)}
        {selected.length > 0 && <small>अगले phase में AI इनसे 5–10 हिन्दी Topic सुझाएगा, फिर आप एक Approve करेंगे.</small>}
      </div>

      {r?.providers.map((p) => (
        <div key={p.provider} className="card block">
          <h3>{p.provider} <span className={'pill ' + (p.ok ? 'ok' : 'bad')}>{p.ok ? `${p.items.length} items` : 'failed'}</span></h3>
          {!p.ok && <p className="err">{p.error} — यह source अभी उपलब्ध नहीं; AI इसे use नहीं करेगा.</p>}
          {p.ok && p.items.length === 0 && <small>कोई result नहीं मिला.</small>}
          <ul className="list">
            {p.items.map((it, i) => (
              <li key={i} className={'item' + (isSel(it) ? ' sel' : '')}>
                <button className="pick" onClick={() => toggle(it)}>
                  <span>{isSel(it) ? '✅' : '⬜'}</span>
                  <span><span className="ttl">{it.title}</span>
                    <small>{it.source}{it.date ? ' · ' + it.date.slice(0, 10) : ''}{it.note ? ' · ' + it.note : ''}</small></span>
                </button>
                <a className="src" href={it.url} target="_blank" rel="noreferrer" aria-label="Source खोलें">🔗</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
