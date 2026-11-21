// Phase 6: Topic Recommendations + Approval. Script generation never starts before the user approves a topic.
import { useState } from 'react';
import { getCategory } from '../lib/categories';
import { recommendTopics } from '../lib/topics';
import type { Project, Topic } from '../lib/types';

const TYPE_LABEL = { explanation: 'Explanation', documentary: 'Documentary' } as const;

export default function Topics({ project, onUpdate, goResearch, goScript }: { project: Project | null; onUpdate: (p: Project) => Promise<void>; goResearch: () => void; goScript: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const [edit, setEdit] = useState('');
  const [note, setNote] = useState('');
  if (!project) return <section><p>Pehle Home par category chuniye.</p></section>;
  if (!project.research) return <section><h2>🎯 Topics</h2><p className="muted">Pehle Research tab mein research poori hone dein.</p><button className="btn" onClick={goResearch}>🔎 Research par jayein</button></section>;
  const cat = getCategory(project.category), topics = project.topics ?? [], ap = project.approved;

  const generate = async () => {
    const r = recommendTopics(project.research!, cat, project.selected ?? [], { lang: project.lang });
    setNote(r.note);
    await onUpdate({ ...project, topics: r.topics, topicsRanAt: new Date().toISOString(), approved: undefined, stage: 'topics' });
  };
  const approve = async (t: Topic, title = t.title) => {
    await onUpdate({ ...project, approved: { ...t, title }, title, videoType: t.videoType, stage: 'vtype' });
    setEdit('');
  };
  const unapprove = () => onUpdate({ ...project, approved: undefined, stage: 'topics' });

  return (
    <section>
      <h2>🎯 {cat.emoji} Topic Recommendations</h2>
      <p className="muted">Research ke asli items se topics bante hain (taazgi, kitne sources, HN/Wikipedia signal). Koi nakli data nahi. Approve karne se pehle script shuru nahi hoga.</p>
      <button className="btn" onClick={generate}>{topics.length ? '🔄 Topics dobara banao' : '✨ Topics suggest karo'}</button>
      {note && <p className="muted">{note}</p>}
      {project.topicsRanAt && <small className="muted">Topics banaye: {new Date(project.topicsRanAt).toLocaleString()} · Research: {new Date(project.research.ranAt).toLocaleString()}</small>}

      {ap && (
        <div className="card block">
          <h3>✅ Approved topic</h3>
          <b>{ap.title}</b>
          <small>Suggested type: {TYPE_LABEL[ap.videoType]} — {ap.videoTypeWhy}</small>
          <div className="seg">
            {(['explanation', 'documentary'] as const).map((v) => <button key={v} className={project.videoType === v ? 'on' : ''} onClick={() => onUpdate({ ...project, videoType: v })}>{TYPE_LABEL[v]}</button>)}
          </div>
          <small className="muted">Video type chunkar "Script" tab par jayein: wahan AI deep research + script likhega, aap edit karke approve karenge.</small>
          <div className="seg"><button className="btn" onClick={goScript}>📝 AI Script banayein</button><button onClick={unapprove}>↩ Approval hatao</button></div>
        </div>
      )}

      {topics.map((t, i) => (
        <div key={t.id} className={'card block' + (ap?.id === t.id ? ' sel' : '')}>
          <b onClick={() => setOpen(open === t.id ? null : t.id)} style={{ cursor: 'pointer' }}>{i + 1}. {t.userPicked ? '⭐ ' : ''}{t.title}</b>
          <small>{t.summary}</small>
          <small>📌 {t.why}</small>
          <small>🕒 {t.relevance}</small>
          <small>👥 {t.interest}</small>
          <small>📰 {t.coverage}</small>
          <small>🧩 {t.gap}</small>
          <small>🎬 {TYPE_LABEL[t.videoType]} — {t.videoTypeWhy}</small>
          {open === t.id && (
            <div>
              <small className="muted">Sources ({t.sources.length}):</small>
              {t.sources.map((s) => <div key={s.url} className="row2"><span style={{ flex: 1, fontSize: 13 }}>{s.title}<br /><small>{s.source}{s.date ? ' · ' + s.date.slice(0, 10) : ''}</small></span><a className="src" href={s.url} target="_blank" rel="noreferrer">🔗</a></div>)}
              <small className="muted">Naya angle: title badal kar approve karein</small>
              <input className="ta" style={{ minHeight: 0 }} value={edit} onChange={(e) => setEdit(e.target.value)} placeholder={t.title} />
            </div>
          )}
          <div className="seg">
            <button className="btn" onClick={() => approve(t, open === t.id && edit.trim() ? edit.trim() : t.title)}>✅ Approve</button>
            <button onClick={() => setOpen(open === t.id ? null : t.id)}>{open === t.id ? 'Band' : 'Details / angle'}</button>
          </div>
        </div>
      ))}
      {topics.length > 0 && <button onClick={goResearch}>🔎 Aur research / alag items chunein</button>}
    </section>
  );
}
