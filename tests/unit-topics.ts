import { recommendTopics } from '../src/lib/topics';
import { getCategory } from '../src/lib/categories';
import type { ResearchResult } from '../src/lib/types';
const now = Date.parse('2026-11-21T10:00:00Z'), d = (n: number) => new Date(now - n * 86400000).toISOString();
const P = (provider: string, kind: any, items: any[], ok = true) => ({ provider, kind, ok, items });
const r: ResearchResult = { category: 'finance', lang: 'en', ranAt: d(0), providers: [
  P('Google News (English)', 'news', [
    { title: 'RBI keeps repo rate unchanged at 5.5 percent - Mint', url: 'u1', source: 'Mint', date: d(0.5) },
    { title: 'RBI repo rate unchanged, inflation outlook cut - Hindu', url: 'u2', source: 'The Hindu', date: d(1) },
    { title: 'Why RBI left repo rate unchanged this week - ET', url: 'u3', source: 'ET', date: d(1.2) },
    { title: 'Gold price hits record high as dollar weakens - Reuters', url: 'u4', source: 'Reuters', date: d(2) },
    { title: 'Gold record high dollar weakens investors flock - BBC', url: 'u5', source: 'BBC', date: d(2.5) },
    { title: 'Mutual fund SIP inflows touch new peak in October', url: 'u6', source: 'Moneycontrol', date: d(3) },
    { title: 'Compound interest explained for new investors', url: 'u7', source: 'Blog', date: d(20) },
    { title: 'Great Depression 1929 crash lessons history', url: 'u8', source: 'History', date: d(30) } ]),
  P('Hacker News', 'discussion', [{ title: 'Show HN: A tiny SIP calculator', url: 'u9', source: 'Hacker News', date: d(1), note: '420 points, 80 comments' }]),
  P('Wikipedia trending', 'trend', [{ title: 'Taylor Swift', url: 'w1', source: 'Wikipedia trending', date: d(2), note: '900,000 views' }]),
  P('GDELT', 'news', [], false) ] };
const { topics, note } = recommendTopics(r, getCategory('finance'), [], { now });
console.log(note); topics.forEach((t, i) => console.log(i + 1, t.score.toFixed(2), t.videoType, '|', t.title, '|', t.coverage, '|', t.relevance));
const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
ok(topics.length >= 5, '>=5 topics');
ok(topics[0].title.includes('RBI') || topics[0].title.toLowerCase().includes('repo'), 'RBI cluster first');
ok(topics.find((t) => /RBI/.test(t.title))!.sources.length === 3, 'RBI cluster has 3 sources');
ok(topics.find((t) => /Gold/i.test(t.title))!.sources.length === 2, 'gold cluster has 2');
ok(!topics.some((t) => /Taylor/.test(t.title)), 'global trending noise dropped');
ok(topics.find((t) => /Depression/.test(t.title))!.videoType === 'documentary', 'history -> documentary');
const pk = recommendTopics(r, getCategory('finance'), [r.providers[0].items[6]], { now }).topics;
ok(pk[0].userPicked && /Compound/.test(pk[0].title), 'user-picked topic ranked first');
const empty = recommendTopics({ ...r, providers: [P('x', 'news', [], false)] }, getCategory('finance'), [], { now });
ok(empty.topics.length === 0, 'no fake topics when research empty');
console.log('TOPICS OK');
