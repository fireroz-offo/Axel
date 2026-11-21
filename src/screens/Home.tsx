import { CATEGORIES } from '../lib/categories';
import { STAGES } from '../lib/workflow';
import type { CategoryId } from '../lib/types';

export default function Home({ onPick, onOwnScript }: { onPick: (c: CategoryId) => void; onOwnScript: () => void }) {
  return (
    <section>
      <button className="card cat" style={{ width: '100%', marginBottom: 14 }} onClick={onOwnScript}>
        <b>📝 मेरे पास अपनी Script है</b>
        <small>Script दीजिए — research के बिना सीधे video बनेगा (Voiceover → Motion → MP4)</small>
      </button>
      <h2>या Category चुनिए (AI research)</h2>
      <p className="muted">बस category चुनिए — AI पूरी दुनिया की ताज़ा खबरों की हिन्दी में live research शुरू कर देगा।</p>
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
