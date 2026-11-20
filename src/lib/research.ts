// Keyless, backend-free live research. Every provider is a public endpoint that allows browser (CORS) calls.
// Each provider reports its own success/failure so the UI never pretends a failed source worked.
import type { Category, ProviderResult, ResearchResult, SourceItem } from './types';

async function getJSON(url: string, timeoutMs = 12000): Promise<any> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const q = encodeURIComponent;

/** Hacker News (Algolia) - recent stories, strong for tech/finance/science discussion. */
async function hackerNews(cat: Category): Promise<SourceItem[]> {
  const j = await getJSON(`https://hn.algolia.com/api/v1/search_by_date?query=${q(cat.terms[0])}&tags=story&hitsPerPage=12`);
  return (j.hits as any[])
    .filter((h) => h.title)
    .map((h) => ({
      title: h.title,
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: 'Hacker News',
      date: h.created_at,
      note: `${h.points ?? 0} points, ${h.num_comments ?? 0} comments`
    }));
}

/** GDELT DOC 2.0 - global news index (keyless). Rate limited: ~1 request / 5 seconds. */
async function gdelt(cat: Category): Promise<SourceItem[]> {
  const query = cat.terms[0].includes(' ') ? `"${cat.terms[0]}"` : cat.terms[0];
  const j = await getJSON(
    `https://api.gdeltproject.org/api/v2/doc/doc?query=${q(query + ' sourcelang:english')}&mode=artlist&maxrecords=15&format=json&sort=datedesc&timespan=3d`
  );
  const arts: any[] = j.articles ?? [];
  return arts.map((a) => ({
    title: a.title,
    url: a.url,
    source: a.domain ?? 'GDELT',
    date: a.seendate ? gdeltDate(a.seendate) : undefined
  }));
}
function gdeltDate(s: string) {
  // 20260520T101500Z
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : undefined;
}

/** Wikipedia search - background/reference articles for the category (recently edited first is not guaranteed). */
async function wikipedia(cat: Category): Promise<SourceItem[]> {
  const j = await getJSON(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q(cat.terms.join(' '))}&srlimit=8&format=json&origin=*`
  );
  return (j.query?.search as any[]).map((s) => ({
    title: s.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(s.title).replace(/ /g, '_'))}`,
    source: 'Wikipedia',
    date: s.timestamp,
    note: String(s.snippet).replace(/<[^>]+>/g, '')
  }));
}

/** Wikimedia top pageviews - what the world is reading about (general trend signal, not category-filtered). */
async function wikiTrending(): Promise<SourceItem[]> {
  const d = new Date(Date.now() - 2 * 86400000); // data lags ~1 day
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const j = await getJSON(`https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${y}/${m}/${day}`);
  const skip = /^(Main_Page|Special:|Wikipedia:|Portal:|-)/;
  return (j.items[0].articles as any[])
    .filter((a) => !skip.test(a.article))
    .slice(0, 12)
    .map((a) => ({
      title: String(a.article).replace(/_/g, ' '),
      url: `https://en.wikipedia.org/wiki/${a.article}`,
      source: 'Wikimedia pageviews',
      date: `${y}-${m}-${day}`,
      note: `${a.views.toLocaleString()} views`
    }));
}

export async function runResearch(cat: Category): Promise<ResearchResult> {
  const jobs: Array<{ provider: string; kind: ProviderResult['kind']; run: () => Promise<SourceItem[]> }> = [
    { provider: 'GDELT global news', kind: 'news', run: () => gdelt(cat) },
    { provider: 'Hacker News', kind: 'discussion', run: () => hackerNews(cat) },
    { provider: 'Wikipedia', kind: 'reference', run: () => wikipedia(cat) },
    { provider: 'Wikipedia trending', kind: 'trend', run: () => wikiTrending() }
  ];
  const settled = await Promise.allSettled(jobs.map((j) => j.run()));
  const providers: ProviderResult[] = settled.map((s, i) =>
    s.status === 'fulfilled'
      ? { provider: jobs[i].provider, kind: jobs[i].kind, ok: true, items: s.value }
      : { provider: jobs[i].provider, kind: jobs[i].kind, ok: false, error: String((s.reason as Error)?.message ?? s.reason), items: [] }
  );
  return { category: cat.id, ranAt: new Date().toISOString(), providers };
}
