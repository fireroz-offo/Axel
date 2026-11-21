import { useEffect, useState } from 'react';
import type { Project } from '../lib/types';

const WPM = 140; // comfortable Hindi narration pace (words per minute)
const TARGET = {
  short: { minS: 30, maxS: 50, label: 'Short · 30–50 सेकंड' },
  long: { minS: 300, maxS: 600, label: 'Long · 5–10 मिनट' }
} as const;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function ScriptInput({ project, onUpdate, onNew }: { project: Project | null; onUpdate: (p: Project) => Promise<void>; onNew: () => Promise<Project> }) {
  const [text, setText] = useState(project?.script ?? '');
  const [msg, setMsg] = useState('');
  useEffect(() => { setText(project?.script ?? ''); setMsg(''); }, [project?.id]);

  const length = project?.length ?? 'short';
  const t = TARGET[length];
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const secs = Math.round((words / WPM) * 60);
  const minW = Math.round((t.minS / 60) * WPM), maxW = Math.round((t.maxS / 60) * WPM);
  const status = words === 0 ? '' : secs < t.minS ? `⚠️ छोटी है (लगभग ${minW}–${maxW} शब्द चाहिए)` : secs > t.maxS ? `⚠️ लंबी है (लगभग ${minW}–${maxW} शब्द चाहिए)` : '✅ चुनी हुई length के अंदर';

  const save = async () => {
    const p = project ?? (await onNew());
    await onUpdate({ ...p, script: text, scriptSource: 'user', length, stage: 'script-own' });
    setMsg('✅ Script save हो गई (Projects में दिखेगी).');
  };
  const setLength = async (l: 'short' | 'long') => {
    const p = project ?? (await onNew());
    await onUpdate({ ...p, length: l });
  };

  return (
    <section>
      <h2>📝 अपनी Script</h2>
      <p className="muted">Script यहाँ paste या type कीजिए. इसी से video बनेगा — research ज़रूरी नहीं.</p>
      <div className="seg">
        {(['short', 'long'] as const).map((l) => (
          <button key={l} className={length === l ? 'on' : ''} onClick={() => setLength(l)}>{TARGET[l].label}</button>
        ))}
      </div>
      <textarea className="ta" value={text} onChange={(e) => setText(e.target.value)} placeholder="यहाँ अपनी script लिखिए या paste कीजिए…" />
      <div className="card">
        <b>{words} शब्द · अनुमानित voiceover {fmt(secs)}</b>
        <small>{status}</small>
        <small>(अनुमान: {WPM} शब्द/मिनट. असली timing आपकी voiceover से आएगी.)</small>
      </div>
      <button className="btn" disabled={!text.trim()} onClick={save}>💾 Script save करें</button>
      {msg && <p className="good">{msg}</p>}
      <div className="card note">
        <b>अगले steps (Phase 10–17):</b> आप अपनी Voiceover upload करेंगे → AI script और audio match करेगा → storyboard → 2D/3D motion graphics → MP4.
      </div>
    </section>
  );
}
