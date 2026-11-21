// Tests with a MOCK network (the sandbox has no internet): validates parsing, fallback, validation, chunking, eviction.
import { direct } from '../src/ai/director/director';
import { generateScript, unsupportedNumbers, scriptText } from '../src/ai/script-engine/index.ts';
import { planEviction } from '../src/storage/budget';
import { ask, pollinations } from '../src/ai/net/keyless';
import { ScenePlanSchema, extractJSON } from '../src/schemas/ai';
import type { Topic } from '../src/lib/types';
let fails = 0; const ok = (c: boolean, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };

// 1. JSON extraction + schema
ok(Array.isArray(extractJSON('Sure!\n```json\n[{"i":0,"block":"title"}]\n```')), 'extractJSON handles fences/chatter');
ok(!ScenePlanSchema.safeParse([{ i: 0, block: 'bogus' }]).success, 'schema rejects unknown block');

// 2. director: chunking (60 lines -> 3 calls), partial failure fallback
let calls = 0; const sent = Array.from({ length: 60 }, (_, i) => `line ${i}`);
const fake = async (m: any) => { calls++; if (calls === 2) return null; const n = (m[0].content.match(/^\d+:/gm) ?? []).length; return { provider: 'mock', text: JSON.stringify(Array.from({ length: n }, (_, i) => ({ i, block: i % 2 ? 'stat' : 'words' }))) }; };
const d = await direct(sent, 'explanation', { askFn: fake as any });
ok(calls === 3, 'director chunks 60 lines into 3 requests'); ok(d.picks.size === 35 && d.picks.has(0) && !d.picks.has(30), 'failed chunk -> only those lines left to rule engine (' + d.picks.size + ')');
const none = await direct(sent.slice(0, 5), 'documentary', { askFn: (async () => null) as any }); ok(none.picks.size === 0 && /rule-based/.test(none.note), 'all AI down -> rule-based note');

// 3. keyless client: provider failure -> null (no throw), success path parses OpenAI shape
const failFetch = (async () => { throw new Error('offline'); }) as any;
ok((await ask([{ role: 'user', content: 'x' }], { fetchImpl: failFetch, timeoutMs: 500 })) === null, 'offline -> ask() returns null');
const goodFetch = (async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: 'hello' } }] }) })) as any;
ok((await pollinations.call([{ role: 'user', content: 'x' }], { fetchImpl: goodFetch, timeoutMs: 500 })) === 'hello', 'OpenAI-style response parsed');

// 4. script engine
const topic = { id: 't', title: 'RBI repo rate', sources: [{ title: 'RBI keeps repo rate unchanged at 5.5 percent', url: 'u', source: 'Mint', date: '2026-11-20T00:00:00Z' }, { title: 'Inflation outlook cut to 3.1 percent', url: 'u2', source: 'Hindu' }] } as unknown as Topic;
ok(unsupportedNumbers('Rate is 5.5 and growth 9 percent, in 2031', [{ text: 'rate 5.5 percent', source: 'x' }]).join() === '2031', 'invented number flagged (2031), supported 5.5 kept');
const aiAsk = async () => ({ provider: 'mock', text: 'रेपो रेट वह दर है जिस पर आरबीआई बैंकों को उधार देता है। इस बार दर 5.5 प्रतिशत पर स्थिर रही और महंगाई 7.9 रहने का अनुमान है।' });
const doc = await generateScript({ topic, type: 'explanation', length: 'short', lang: 'hi' }, { askFn: aiAsk as any });
ok(doc.sections.length === 6 && doc.sections.every((s) => s.source === 'ai'), 'explanation = 6 sections from AI');
ok(doc.sections[0].warnings.some((w) => w.includes('7.9')), 'AI-invented number 7.9 warned');
const english = async () => ({ provider: 'mock', text: 'This is an English answer even though Hindi was requested by the user.' });
const doc2 = await generateScript({ topic, type: 'documentary', length: 'long', lang: 'hi' }, { askFn: english as any });
ok(doc2.sections.every((s) => s.source === 'extractive') && doc2.engine.startsWith('extractive'), 'wrong language -> extractive fallback from real sources');
const doc3 = await generateScript({ topic, type: 'explanation', length: 'short', lang: 'en' }, { askFn: (async () => null) as any });
ok(doc3.sections.length === 6 && /RBI keeps repo rate/.test(scriptText(doc3)), 'AI offline -> script still built from sources only');

// 5. eviction
const MB = 1048576, now = Date.now();
const items = [{ id: 'r1', kind: 'render' as const, bytes: 60 * MB, at: now - 3e6 }, { id: 'r2', kind: 'render' as const, bytes: 50 * MB, at: now - 1e6 }, { id: 'a1', kind: 'asset' as const, bytes: 20 * MB, at: now - 9e6 }, { id: 'k', kind: 'render' as const, bytes: 40 * MB, at: now - 8e6, keep: true }];
const p = planEviction(items, 100 * MB);
ok(p.total === 170 * MB && p.remove.map((x) => x.id).join() === 'r1,r2' && p.fits, 'evicts oldest renders first, keeps pinned + assets -> ' + (p.after / MB) + ' MB');
ok(!planEviction([{ id: 'k', kind: 'render', bytes: 200 * MB, at: 0, keep: true }], 100 * MB).fits, 'pinned over cap reported as not fitting');
console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
