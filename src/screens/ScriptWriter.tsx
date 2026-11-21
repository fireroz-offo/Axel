// Phases 7-9: Video type -> deep research + AI script (section by section) -> edit / regenerate -> APPROVE.
// Voiceover stage starts only after approval. Every section shows whether it came from the AI or only from sources.
import { useRef, useState } from 'react';
import type { Project } from '../lib/types';
import type { ScriptDoc, Section } from '../schemas/ai';
import { generateScript, scriptText, wikiFacts, writeSection, type ScriptReq } from '../ai/script-engine';
import { saveToDownloads } from '../lib/saveFile';

const WPM = 140, TARGET = { short: [30, 50], long: [300, 600] } as const;
const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

export default function ScriptWriter({ project, onUpdate }: { project: Project; onUpdate: (p: Project) => Promise<void> }) {
  const ap = project.approved!;
  const type = project.videoType ?? ap.videoType, length = project.length ?? 'short', lang = project.lang === 'en' ? 'en' : 'hi';
  const doc = project.scriptDoc, approved = !!project.scriptApproved;
  const [busy, setBusy] = useState(false), [msg, setMsg] = useState(''), [busyId, setBusyId] = useState('');
  const abort = useRef<AbortController | null>(null);
  const req = (): ScriptReq => ({ topic: ap, type, length, lang });

  const save = (d: ScriptDoc, extra: Partial<Project> = {}) =>
    onUpdate({ ...project, scriptDoc: d, script: scriptText(d), scriptSource: 'ai', scriptApproved: false, stage: 'script', ...extra });

  const generate = async () => {
    setBusy(true); setMsg('Deep research: Wikipedia + topic ke sources…'); abort.current = new AbortController();
    try {
      const extra = await wikiFacts(ap.title, lang);
      const d = await generateScript(req(), { factsExtra: extra, signal: abort.current.signal, onProgress: (i, n, t) => setMsg(i < n ? `Script likh raha hoon ${i + 1}/${n}: ${t}` : 'Ho gaya') });
      await save(d);
      setMsg(`✅ Script taiyaar (${d.engine}). Facts: ${d.facts.length}. Padhkar edit karein, phir Approve.`);
    } catch (e: any) { setMsg('❌ ' + (e?.message ?? e)); }
    setBusy(false);
  };
  const cancel = () => abort.current?.abort();

  const editSection = (id: string, text: string) => doc && save({ ...doc, sections: doc.sections.map((s) => (s.id === id ? { ...s, text } : s)) });
  const regen = async (idx: number) => {
    if (!doc) return; const s = doc.sections[idx]; setBusyId(s.id); setMsg(`"${s.title}" dobara likh raha hoon…`);
    try {
      const n: Section = await writeSection(req(), s.title, idx, doc.facts, doc.sections[idx - 1]?.text ?? '');
      await save({ ...doc, sections: doc.sections.map((x, i) => (i === idx ? n : x)) }); setMsg(`✅ "${s.title}" naya hua`);
    } catch (e: any) { setMsg('❌ ' + (e?.message ?? e)); }
    setBusyId('');
  };
  const approve = () => onUpdate({ ...project, scriptApproved: true, script: doc ? scriptText(doc) : project.script, stage: 'voice' });
  const copy = async () => { try { await navigator.clipboard.writeText(scriptText(doc!)); setMsg('✅ Copy hua'); } catch { setMsg('Copy nahi ho paya'); } };
  const download = async () => { try { const p = await saveToDownloads(new Blob([scriptText(doc!)], { type: 'text/plain' }), `script-${Date.now()}.txt`); setMsg('✅ Save hua: ' + p); } catch (e: any) { setMsg('❌ ' + (e?.message ?? e)); } };

  const total = doc ? words(scriptText(doc)) : 0, secs = (total / WPM) * 60, [lo, hi] = TARGET[length];
  return (
    <div className="card block">
      <h3>🤖 AI Script (approved topic)</h3>
      <b>{ap.title}</b>
      <small className="muted">Video type (Phase 7):</small>
      <div className="seg">
        {(['explanation', 'documentary'] as const).map((v) => <button key={v} disabled={busy || approved} className={type === v ? 'on' : ''} onClick={() => onUpdate({ ...project, videoType: v, scriptApproved: false })}>{v === 'explanation' ? 'Explanation' : 'Documentary'}</button>)}
      </div>
      <div className="seg">
        {(['short', 'long'] as const).map((l) => <button key={l} disabled={busy || approved} className={length === l ? 'on' : ''} onClick={() => onUpdate({ ...project, length: l, scriptApproved: false })}>{l === 'short' ? 'Short 30–50 s' : 'Long 5–10 min'}</button>)}
        {(['hi', 'en'] as const).map((l) => <button key={l} disabled={busy || approved} className={lang === l ? 'on' : ''} onClick={() => onUpdate({ ...project, lang: l, scriptApproved: false })}>{l === 'hi' ? 'हिन्दी' : 'English'}</button>)}
      </div>
      <div className="seg">
        <button className="btn" disabled={busy || approved} onClick={generate}>{doc ? '🔄 Poori script dobara' : '✨ Research + Script banao'}</button>
        {busy && <button onClick={cancel}>⏹ Roko</button>}
      </div>
      {msg && <small className={msg.startsWith('❌') ? '' : 'good'}>{msg}</small>}

      {doc && (
        <>
          <small>{total} shabd · ~{fmt(secs)} voiceover {secs < lo ? `⚠️ chhoti (target ${fmt(lo)}–${fmt(hi)})` : secs > hi ? `⚠️ lambi (target ${fmt(lo)}–${fmt(hi)})` : '✅ target ke andar'}</small>
          {doc.engine.startsWith('extractive') && <small>⚠️ Internet AI nahi mila: script sirf sources ke vaakyon se bani hai. Settings → AI test chalao, phir dobara banao.</small>}
          {doc.sections.map((s, i) => (
            <div key={s.id} className="card">
              <b>{i + 1}. {s.title} <small>{s.source === 'ai' ? '🤖 AI' : '📄 sirf sources'} · {words(s.text)} shabd</small></b>
              <textarea className="ta" style={{ minHeight: 110 }} disabled={approved} defaultValue={s.text} key={s.id + s.text.length + s.source} onBlur={(e) => e.target.value !== s.text && editSection(s.id, e.target.value)} />
              {s.warnings.map((w, k) => <small key={k}>⚠️ {w}</small>)}
              <button disabled={approved || busy || !!busyId} onClick={() => regen(i)}>{busyId === s.id ? '…' : '↻ Ye hissa dobara likho'}</button>
            </div>
          ))}
          <small className="muted">Sources ({doc.facts.length}):</small>
          {doc.facts.slice(0, 12).map((f, i) => <small key={i} className="muted">{i + 1}. {f.source}{f.url ? ' · ' : ''}{f.url && <a className="src" href={f.url} target="_blank" rel="noreferrer">🔗</a>}</small>)}
          <div className="seg"><button onClick={copy}>📋 Copy</button><button onClick={download}>⬇️ Download</button></div>
          {approved
            ? <div className="seg"><b className="good">✅ Script approved — ab Studio mein voiceover upload karein</b><button onClick={() => onUpdate({ ...project, scriptApproved: false })}>↩ Approval hatao</button></div>
            : <button className="btn" onClick={approve}>✅ Script Approve karo</button>}
        </>
      )}
    </div>
  );
}
