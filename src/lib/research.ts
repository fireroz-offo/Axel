// Keyless, backend-free live research (Hindi first). Every provider reports its own success/failure.
// Inside the Android APK, fetch() goes through native HTTP (CapacitorHttp), so RSS feeds work without CORS.
// In a normal browser tab RSS sources without CORS will show "failed" honestly.
import type { Category, Lang, ProviderResult, ResearchResult, SourceItem } from './types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const q = encodeURIComponent;

async function getText(url: string, timeoutMs = 25000): Promise<string> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await Promise.race([
      fetch(url, { signal: ctl.signal }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout ' + timeoutMs / 1000 + 's')), timeoutMs + 500))
    ]);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  } finally { clearTimeout(timer); }
}

async function getJSON(url: string, timeoutMs = 25000): Promise<any> {
  const t = await getText(url, timeoutMs);
  try { return JSON.parse(t); } catch { throw new Error('non-JSON reply (rate limit?): ' + t.slice(0, 80)); }
}

const orQuery = (terms: string[]) => terms.map((t) => (t.includes(' ') ? `"${t}"` : t)).join(' OR ');

/** Words that steer Hindi Google News toward world (not only India) coverage. */
const WORLD_HI = 'दुनिया OR विश्व OR वैश्विक OR अंतरराष्ट्रीय';

function parseRss(xml: string, defaultSource: string, limit = 15): SourceItem[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  if (doc.querySelector('parsererror')) throw new Error('RSS parse error');
  return [...doc.querySelectorAll('item')].slice(0, limit).map((it) => {
    const raw = it.querySelector('title')?.textContent?.trim() ?? '';
    const src = it.querySelector('source')?.textContent ?? defaultSource;
    const pub = it.querySelector('pubDate')?.textContent;
    const suffix = ' - ' + src;
    return {
      title: raw.endsWith(suffix) ? raw.slice(0, -suffix.length) : raw,
      url: it.querySelector('link')?.textContent?.trim() ?? '',
      source: src,
      date: pub ? new Date(pub).toISOString() : undefined
    };
  });
}

/** Google News RSS, Hindi (world-focused) or English. Needs native HTTP (APK) for CORS. */
async function googleNews(cat: Category, lang: 'hi' | 'en'): Promise<SourceItem[]> {
  const terms = lang === 'hi' ? cat.hiTerms : cat.terms;
  const loc = lang === 'hi' ? 'hl=hi&gl=IN&ceid=IN:hi' : 'hl=en&gl=US&ceid=US:en';
  const query = lang === 'hi' ? `(${orQuery(terms)}) (${WORLD_HI}) when:7d` : `${orQuery(terms)} when:7d`;
  return parseRss(await getText(`https://news.google.com/rss/search?q=${q(query)}&${loc}`), 'Google News');
}

/** BBC News Hindi: general world/Hindi headlines (not category-filtered). */
async function bbcHindi(): Promise<SourceItem[]> {
  return parseRss(await getText('https://feeds.bbci.co.uk/hindi/rss.xml'), 'BBC News हिंदी');
}

/** GDELT DOC 2.0. Slow and rate limited (about 1 req / 5 s): long timeout + one retry. */
async function gdelt(cat: Category, lang: 'hi' | 'en'): Promise<SourceItem[]> {
  const terms = lang === 'hi' ? cat.hiTerms : cat.terms;
  const query = `(${orQuery(terms)}) sourcelang:${lang === 'hi' ? 'hindi' : 'english'}`;
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q(query)}&mode=artlist&maxrecords=15&format=json&sort=datedesc&timespan=${lang === 'hi' ? '7d' : '3d'}`;
  let j: any;
  try { j = await getJSON(url); } catch { await sleep(6000); j = await getJSON(url); }
  return ((j.articles ?? []) as any[]).map((a) => ({
    title: a.title,
    url: a.url,
    source: a.domain ?? 'GDELT',
    date: a.seendate ? gdeltDate(a.seendate) : undefined
  }));
}
function gdeltDate(s: string) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : undefined;
}

/** Hacker News (English only). */
async function hackerNews(cat: Category): Promise<SourceItem[]> {
  const j = await getJSON(`https://hn.algolia.com/api/v1/search_by_date?query=${q(cat.terms[0])}&tags=story&hitsPerPage=12`);
  return (j.hits as any[]).filter((h) => h.title).map((h) => ({
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    source: 'Hacker News',
    date: h.created_at,
    note: `${h.points ?? 0} points, ${h.num_comments ?? 0} comments`
  }));
}

/** Wikipedia search in the chosen language. */
async function wikipedia(cat: Category, lang: 'hi' | 'en'): Promise<SourceItem[]> {
  const terms = lang === 'hi' ? cat.hiTerms : cat.terms;
  const j = await getJSON(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q(terms.join(' OR '))}&srlimit=8&format=json&origin=*`);
  return ((j.query?.search ?? []) as any[]).map((s) => ({
    title: s.title,
    url: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(String(s.title).replace(/ /g, '_'))}`,
    source: lang === 'hi' ? 'हिंदी विकिपीडिया' : 'Wikipedia',
    date: s.timestamp,
    note: String(s.snippet).replace(/<[^>]+>/g, '')
  }));
}

/** Most-read Wikipedia pages (general trend signal, not category-filtered). */
async function wikiTrending(lang: 'hi' | 'en'): Promise<SourceItem[]> {
  const d = new Date(Date.now() - 2 * 86400000);
  const y = d.getUTCFullYear(), m = String(d.getUTCMonth() + 1).padStart(2, '0'), day = String(d.getUTCDate()).padStart(2, '0');
  const j = await getJSON(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${lang}.wikipedia/all-access/${y}/${m}/${day}`);
  const skip = /^(Main_Page|मुखपृष्ठ|Special:|विशेष:|Wikipedia:|विकिपीडिया:|Portal:|-|Category:|श्रेणी:|Help:)/;
  return (j.items[0].articles as any[]).filter((a) => !skip.test(a.article)).slice(0, 12).map((a) => ({
    title: String(a.article).replace(/_/g, ' '),
    url: `https://${lang}.wikipedia.org/wiki/${a.article}`,
    source: lang === 'hi' ? 'हिंदी विकिपीडिया (ट्रेंडिंग)' : 'Wikipedia trending',
    date: `${y}-${m}-${day}`,
    note: `${a.views.toLocaleString()} views`
  }));
}

type Job = { provider: string; kind: ProviderResult['kind']; run: () => Promise<SourceItem[]> };

export async function runResearch(cat: Category, lang: Lang): Promise<ResearchResult> {
  const jobs: Job[] = [];
  const hi = lang === 'hi' || lang === 'both';
  const en = lang === 'en' || lang === 'both';
  if (hi) {
    jobs.push({ provider: 'Google News (हिंदी, विश्व)', kind: 'news', run: () => googleNews(cat, 'hi') });
    jobs.push({ provider: 'BBC News हिंदी (ताज़ा विश्व समाचार)', kind: 'news', run: () => bbcHindi() });
    jobs.push({ provider: 'GDELT हिंदी समाचार (विश्व)', kind: 'news', run: () => gdelt(cat, 'hi') });
    jobs.push({ provider: 'हिंदी विकिपीडिया', kind: 'reference', run: () => wikipedia(cat, 'hi') });
    jobs.push({ provider: 'हिंदी विकिपीडिया ट्रेंडिंग', kind: 'trend', run: () => wikiTrending('hi') });
  }
  if (en) {
    jobs.push({ provider: 'Google News (English)', kind: 'news', run: () => googleNews(cat, 'en') });
    jobs.push({ provider: 'GDELT English news', kind: 'news', run: () => gdelt(cat, 'en') });
    jobs.push({ provider: 'Hacker News', kind: 'discussion', run: () => hackerNews(cat) });
    jobs.push({ provider: 'Wikipedia', kind: 'reference', run: () => wikipedia(cat, 'en') });
    jobs.push({ provider: 'Wikipedia trending', kind: 'trend', run: () => wikiTrending('en') });
  }
  // GDELT calls are staggered so the two languages do not trip its rate limit.
  const settled = await Promise.allSettled(jobs.map((j, i) => (async () => { if (/GDELT/.test(j.provider) && i > 0 && jobs.slice(0, i).some((p) => /GDELT/.test(p.provider))) await sleep(6000); return j.run(); })()));
  const providers: ProviderResult[] = settled.map((s, i) =>
    s.status === 'fulfilled'
      ? { provider: jobs[i].provider, kind: jobs[i].kind, ok: true, items: s.value }
      : { provider: jobs[i].provider, kind: jobs[i].kind, ok: false, error: String((s.reason as Error)?.message ?? s.reason), items: [] }
  );
  return { category: cat.id, lang, ranAt: new Date().toISOString(), providers };
}
