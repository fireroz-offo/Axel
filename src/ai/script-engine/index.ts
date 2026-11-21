// Script engine (Phase 8): research facts -> outline -> ONE SMALL AI CALL PER SECTION -> validation -> script.
// Per-section calls keep every request short (fast), allow "regenerate this paragraph", and let us check each part.
// Hallucination guard: AI is told to use only the facts given; any number in its text that is not in the facts is flagged.
import type { Topic } from '../../lib/types';
import { ask, type AskResult, type Msg } from '../net/keyless';
import { ScriptSchema, SectionSchema, type ScriptDoc, type Section } from '../../schemas/ai';

export interface Fact { text: string; source: string; url?: string }
export interface ScriptReq { topic: Topic; type: 'explanation' | 'documentary'; length: 'short' | 'long'; lang: 'hi' | 'en' }
type AskFn = (m: Msg[], o?: any) => Promise<AskResult | null>;

export const OUTLINE = {
  explanation: ['Hook', 'Introduction', 'Concept', 'Example', 'Insight', 'Conclusion'],
  documentary: ['Hook', 'Background', 'Timeline', 'Turning point', 'Impact', 'Conclusion']
} as const;
const WORDS = { short: 110, long: 1000 }; // total target (short ~40 s, long ~7 min at 140 wpm)

/** Keyless public facts: Wikipedia extracts (CORS enabled). Returns [] on any failure. */
export async function wikiFacts(query: string, lang: 'hi' | 'en', f: typeof fetch = fetch): Promise<Fact[]> {
  try {
    const u = `https://${lang}.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=extracts&exintro=1&explaintext=1&exchars=900&format=json&origin=*`;
    const r = await f(u); if (!r.ok) return [];
    const pages = Object.values((await r.json())?.query?.pages ?? {}) as any[];
    return pages.filter((p) => p.extract).map((p) => ({ text: String(p.extract).replace(/\s+/g, ' ').trim(), source: `Wikipedia (${lang}): ${p.title}`, url: `https://${lang}.wikipedia.org/?curid=${p.pageid}` }));
  } catch { return []; }
}

export const factsFromTopic = (t: Topic): Fact[] =>
  t.sources.map((s) => ({ text: s.title + (s.note ? ` — ${s.note}` : ''), source: `${s.source}${s.date ? ' (' + s.date.slice(0, 10) + ')' : ''}`, url: s.url }));

const numsIn = (s: string) => new Set((s.match(/\d[\d,.]*/g) ?? []).map((x) => x.replace(/[,.]+$/, '').replace(/,/g, '')));
/** numbers that appear in the text but in none of the facts (possible invented figures) */
export function unsupportedNumbers(text: string, facts: Fact[]): string[] {
  const ok = numsIn(facts.map((f) => f.text).join(' ') + ' ' + facts.map((f) => f.source).join(' '));
  return [...numsIn(text)].filter((n) => n.length >= 2 && !ok.has(n));
}
const devRatio = (s: string) => { const l = [...s].filter((c) => /\p{L}/u.test(c)); return l.length ? l.filter((c) => /[\u0900-\u097F]/.test(c)).length / l.length : 0; };

const sentencesOf = (s: string) => s.split(/(?<=[।.!?])\s+/).filter(Boolean);
/** No-AI fallback: honest extractive section built only from the facts. */
function extractive(title: string, facts: Fact[], idx: number, n: number, words: number): string {
  const pool = facts.flatMap((f) => sentencesOf(f.text)); if (!pool.length) return `${title}: is vishay par verified jaankari abhi nahi mili.`;
  const out: string[] = []; let w = 0;
  for (let k = 0; k < pool.length && w < words; k++) { const s = pool[(idx + k * n) % pool.length]; if (!out.includes(s)) { out.push(s); w += s.split(/\s+/).length; } }
  return out.join(' ');
}

export async function writeSection(req: ScriptReq, title: string, idx: number, facts: Fact[], prev: string, o: { askFn?: AskFn; signal?: AbortSignal } = {}): Promise<Section> {
  const n = OUTLINE[req.type].length, words = Math.round(WORDS[req.length] / n), askFn = o.askFn ?? ask;
  const lang = req.lang === 'hi' ? 'Hindi (Devanagari)' : 'English';
  const sys = `You write voiceover scripts for a ${req.type} video. Language: ${lang}. Use ONLY the facts below; never invent numbers, names or quotes. Plain spoken sentences, about ${words} words, no headings, no markdown.`;
  const usr = `Topic: ${req.topic.title}\nSection ${idx + 1}/${n}: ${title}\n${prev ? 'Previous section ended with: ' + prev.slice(-160) + '\n' : ''}FACTS:\n` + facts.slice(0, 8).map((f, i) => `${i + 1}. ${f.text.slice(0, 400)} [${f.source}]`).join('\n');
  const warnings: string[] = [];
  const r = await askFn([{ role: 'system', content: sys }, { role: 'user', content: usr }], { signal: o.signal, maxTokens: Math.min(900, words * 4), temperature: 0.5 });
  let text = r?.text.trim() ?? '', source: Section['source'] = 'ai';
  if (text && req.lang === 'hi' && devRatio(text) < 0.5) { warnings.push('Jawab Hindi mein nahi tha'); text = ''; }
  if (text) { const bad = unsupportedNumbers(text, facts); if (bad.length) warnings.push('Ye numbers facts mein nahi mile (check karein): ' + bad.slice(0, 5).join(', ')); }
  if (text.length < 20) { text = extractive(title, facts, idx, n, words); source = 'extractive'; if (r) warnings.push('AI jawab bekaar tha; sirf sources ke vaakya use hue'); }
  return SectionSchema.parse({ id: `s${idx}`, title, text, source, warnings });
}

export async function generateScript(req: ScriptReq, o: { askFn?: AskFn; signal?: AbortSignal; onProgress?: (done: number, total: number, title: string) => void; factsExtra?: Fact[] } = {}): Promise<ScriptDoc> {
  const facts = [...factsFromTopic(req.topic), ...(o.factsExtra ?? [])];
  const titles = OUTLINE[req.type], sections: Section[] = [];
  for (let i = 0; i < titles.length; i++) {
    if (o.signal?.aborted) throw new Error('Cancelled');
    o.onProgress?.(i, titles.length, titles[i]);
    sections.push(await writeSection(req, titles[i], i, facts, sections[i - 1]?.text ?? '', o));
  }
  o.onProgress?.(titles.length, titles.length, '');
  return ScriptSchema.parse({ sections, facts, engine: sections.some((s) => s.source === 'ai') ? 'internet-ai + facts' : 'extractive (no AI reachable)' });
}
export const scriptText = (d: ScriptDoc) => d.sections.map((s) => s.text).join('\n\n');
