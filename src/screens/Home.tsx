import { CATEGORIES } from '../lib/categories';
import { STAGES } from '../lib/workflow';
import type { CategoryId } from '../lib/types';

export default function Home({ onPick }: { onPick: (c: CategoryId) => void }) {
  return (
    <section>
      <h2>Category चुनिए</h2>
      <p className="muted">बस category चुनिए — AI live research शुरू कर देगा।</p>
      <div className="grid">
        {CATEGORIES.map((c) => (
          <button key={c.id} className="card cat" onClick={() => onPick(c.id)}>
            <span className="emoji">{c.emoji}</span>
            <b>{c.label}</b>
            <small>{c.hi}</small>
          </button>
        ))}
      </div>
      <h3>Workflow status</h3>
      <ol className="stages">
        {STAGES.map((s) => (
          <li key={s.id} className={s.done ? 'done' : ''}>
            <span>{s.done ? '✅' : '⏳'}</span> {s.label}
            {!s.done && <em> — Phase {s.phase}</em>}
          </li>
        ))}
      </ol>
    </section>
  );
}
