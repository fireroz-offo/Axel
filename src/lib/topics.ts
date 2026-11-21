// Phase 6: Topic Recommendation Engine. Deterministic, offline, uses ONLY the research the user already has.
// No invented facts: every field is derived from titles, dates and real signals (HN points, Wikipedia views, source counts).
// Anything that cannot be measured without YouTube/paid APIs says so in plain words.
import type { Category, ProviderResult, ResearchResult, SourceItem, Topic } from './types';
import { cleanWord } from './brain/script';

const STOP = new Set(('है हैं का की के में से और को पर यह वह कि ही तो भी एक जो था थे थी होता होती होते करते करता कर हो गया गई गए लिए साथ बाद तक या जब तब कोई अपने आप हम इस उस इन उन ने वे जैसे लेकिन अगर नहीं क्या कैसे क्यों ' +
  'the a an is are was were of to in on and or for with that this it as at by be from but not have has had will can its their new says say how what why who after over into about more than also').split(' '));

type Item = SourceItem & { kind: ProviderResult['kind']; provider: string; kw: Set<string> };

export const keywords = (title: string): Set<string> => {
  const out = new Set<string>();
  for (const raw of title.split(/[\s\-–—:|/,;()"“”‘’]+/)) {
    const w = cleanWord(raw).toLowerCase();
    if (w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w)) out.add(w);
  }
  return out;
};
const shared = (a: Set<string>, b: Set<string>) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n; };
const jacc = (a: Set<string>, b: Set<string>) => { const n = shared(a, b); return n / (a.size + b.size - n || 1); };
const related = (a: Item, b: Item) => { const n = shared(a.kw, b.kw); return n >= 3 || (n >= 2 && jacc(a.kw, b.kw) >= 0.25) || jacc(a.kw, b.kw) >= 0.45; };

const daysAgo = (iso: string | undefined, now: number) => { const t = iso ? Date.parse(iso) : NaN; return isFinite(t) ? Math.max(0, (now - t) / 86400000) : NaN; };
const signal = (note?: string): number => { const m = /([\d,]+)\s*(points|views)/i.exec(note ?? ''); return m ? parseInt(m[1].replace(/,/g, ''), 10) : 0; };
const short = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');
const HISTORY = /इतिहास|history|युद्ध|war|साम्राज्य|empire|खोज|discover|archaeolog|पुरात|सभ्यता|civiliz|crisis|संकट|crash|collapse|पतन|revolution|क्रांति|scandal|घोटाला/i;

export interface TopicOptions { now?: number; lang?: 'hi' | 'en' | 'both'; max?: number }

export function recommendTopics(research: ResearchResult, cat: Category, picked: SourceItem[] = [], opt: TopicOptions = {}): { topics: Topic[]; note: string } {
  const now = opt.now ?? Date.now(), max = Math.min(10, opt.max ?? 10);
  const pickedUrls = new Set(picked.map((p) => p.url));
  const all: Item[] = [];
  const seen = new Set<string>();
  for (const p of research.providers) {
    if (!p.ok) continue;
    for (const it of p.items) {
      const key = it.url || it.title;
      if (!it.title || seen.has(key)) continue;
      seen.add(key);
      all.push({ ...it, kind: p.kind, provider: p.provider, kw: keywords(it.title) });
    }
  }
  // user-picked items that are not in the fetched research (older session) still count
  for (const it of picked) if (!seen.has(it.url || it.title)) { seen.add(it.url || it.title); all.push({ ...it, kind: 'news', provider: it.source, kw: keywords(it.title) }); }
  if (!all.length) return { topics: [], note: 'Research mein koi result nahi mila (sab sources fail?). Pehle Research dobara chalayein.' };

  // union-find clustering on shared keywords
  const par = all.map((_, i) => i);
  const find = (x: number): number => (par[x] === x ? x : (par[x] = find(par[x])));
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (related(all[i], all[j])) par[find(i)] = find(j);
  const groups = new Map<number, Item[]>();
  all.forEach((it, i) => { const r = find(i); groups.set(r, [...(groups.get(r) ?? []), it]); });

  const topics: Topic[] = [];
  for (const g of groups.values()) {
    const userPicked = g.some((x) => pickedUrls.has(x.url));
    // Wikipedia "most read" is global and not category-filtered: only keep it when it is part of a cluster or the user picked it.
    if (g.length === 1 && g[0].kind === 'trend' && !userPicked) continue;
    // central item: most keyword overlap with the others; prefer news titles
    let centre = g[0], best = -1;
    for (const x of g) { const sc = g.reduce((a, y) => a + (x === y ? 0 : shared(x.kw, y.kw)), 0) + (x.kind === 'news' ? 0.5 : 0); if (sc > best) { best = sc; centre = x; } }
    const dates = g.map((x) => daysAgo(x.date, now)).filter((d) => isFinite(d));
    const minDays = dates.length ? Math.min(...dates) : NaN;
    const newest = g.filter((x) => x.date).sort((a, b) => Date.parse(b.date!) - Date.parse(a.date!))[0]?.date;
    const providers = new Set(g.map((x) => x.provider)), domains = new Set(g.map((x) => x.source));
    const newsN = g.filter((x) => x.kind === 'news').length;
    const sig = Math.max(0, ...g.map((x) => signal(x.note)));
    const sigSrc = g.find((x) => signal(x.note) === sig && sig > 0);
    const years = g.flatMap((x) => [...x.title.matchAll(/\b(1[5-9]\d\d|20[0-2]\d)\b/g)].map((m) => +m[1]));
    const doc = HISTORY.test(g.map((x) => x.title).join(' ')) || cat.id === 'history' || (new Set(years).size >= 2 && Math.max(...years) - Math.min(...years) > 15);

    const recency = isFinite(minDays) ? Math.exp(-minDays / 4) : 0.25;
    const cover = Math.min(1, Math.log2(1 + domains.size) / 3);
    const interest = sig ? Math.min(1, Math.log10(1 + sig) / 4.5) : 0;
    const score = 0.38 * recency + 0.3 * cover + 0.17 * interest + 0.15 * Math.min(1, providers.size / 3) + (userPicked ? 0.8 : 0) + (newsN ? 0.05 : 0);

    const srcs: SourceItem[] = g.map(({ title, url, source, date, note }) => ({ title, url, source, date, note })).sort((a, b) => (Date.parse(b.date ?? '') || 0) - (Date.parse(a.date ?? '') || 0)).slice(0, 8);
    const others = g.filter((x) => x !== centre).slice(0, 2).map((x) => short(x.title, 70));
    topics.push({
      id: 't_' + Math.abs(hash(centre.url || centre.title)).toString(36),
      title: short(centre.title.replace(/\s+[-–|]\s+[^-–|]{2,40}$/, ''), 110),
      summary: others.length ? `Ye sources isi par baat kar rahe hain: ${others.join(' · ')}` : (centre.note ? short(centre.note, 160) : `Source: ${centre.source}`),
      why: g.length > 1 ? `${domains.size} alag source / ${g.length} items ek hi vishay par mile${isFinite(minDays) ? `; sabse naya ${fmtAgo(minDays)}` : ''}.` : `Sirf 1 source mila (${centre.source})${isFinite(minDays) ? `, ${fmtAgo(minDays)}` : ''}; pehle ise verify karna hoga.`,
      relevance: isFinite(minDays) ? (minDays < 1.5 ? 'Bahut taaza (kal-aaj)' : minDays < 4 ? 'Taaza (is hafte)' : minDays < 14 ? 'Haal ka' : 'Purana ho sakta hai') + ` · ${fmtAgo(minDays)}` : 'Date source ne nahi di',
      interest: sig ? `${sig.toLocaleString('en-IN')} ${/views/i.test(sigSrc?.note ?? '') ? 'Wikipedia views' : 'HN points'} (${sigSrc?.source})` : 'Koi measurable signal nahi (sirf news dikhi)',
      coverage: `News coverage: ${domains.size} source · ${providers.size} provider`,
      gap: domains.size <= 1 ? 'Kam covered dikh raha hai (sirf news ke hisaab se) — naya angle ka mauka. YouTube competitor data keyless possible nahi.' : domains.size >= 4 ? 'News mein bahut covered hai — alag angle chahiye. YouTube competitor data keyless possible nahi.' : 'Beech ka coverage. YouTube competitor data keyless possible nahi.',
      videoType: doc ? 'documentary' : 'explanation',
      videoTypeWhy: doc ? 'Ghatna-kram / itihaas / kaaran-parinaam ka sanket mila → Documentary' : 'Concept ya "kaise/kyon" samjhane layak → Explanation',
      sources: srcs, score, newest, userPicked
    });
  }
  topics.sort((a, b) => b.score - a.score);
  const out = topics.slice(0, max);
  const note = out.length >= 5 ? `${out.length} topics, ${all.length} real items se bane.` : `Sirf ${out.length} topic ban paaye (research mein itna hi mila). Jhooth se 5 tak nahi bhara; Research dobara chalayein ya zyada items chunein.`;
  return { topics: out, note };
}

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h | 0; };
const fmtAgo = (d: number) => (d < 1 ? 'aaj' : d < 2 ? 'kal' : `${Math.round(d)} din pehle`);
