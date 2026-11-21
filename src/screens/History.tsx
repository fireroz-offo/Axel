import { useEffect, useState } from 'react';
import { deleteProject, listProjects } from '../lib/db';
import { getCategory } from '../lib/categories';
import type { Project } from '../lib/types';

export default function History({ current, onOpen }: { current?: string; onOpen: (p: Project) => void }) {
  const [items, setItems] = useState<Project[]>([]);
  const load = () => listProjects().then(setItems).catch(() => setItems([]));
  useEffect(() => { load(); }, []);
  return (
    <section>
      <h2>🗂️ Projects</h2>
      {items.length === 0 && <p className="muted">अभी कोई project नहीं.</p>}
      {items.map((p) => (
        <div key={p.id} className="card block row2">
          <div onClick={() => onOpen(p)}>
            <b>{getCategory(p.category).emoji} {p.title}</b> {p.id === current && <span className="pill ok">current</span>}
            <small>{new Date(p.updatedAt).toLocaleString()}</small>
          </div>
          <button className="btn ghost" onClick={async () => { await deleteProject(p.id); load(); }}>🗑️</button>
        </div>
      ))}
    </section>
  );
}
