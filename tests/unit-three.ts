// Logic tests for the Three.js engine (pure parts only: layout maths, quality tiers, planner rules). WebGL itself needs a real browser/phone.
import { barLayout, coinCounts, syntheticGrowth, cityBlocks, explodedY, helixPoints, nucleus, fibonacci, graticule, arcPoints, networkGraph, roadPath, eventU, solveInOut, ribbonStrip, E, rng, CITIES, hashStr } from '../src/engine/three-engine/layout';
import { chooseTier, exportTier, nextLower, FpsGovernor, TIERS } from '../src/engine/three-engine/quality';
import { planScenes, IS_3D } from '../src/lib/brain/plan';
let fails = 0; const ok = (c: boolean, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const finite = (a: ArrayLike<number>) => Array.from(a as any as number[]).every((v) => Number.isFinite(v));

// layout
ok(barLayout([10, 5, 0, NaN]).every((v) => v >= 0.06 && v <= 1) && barLayout([10, 5])[0] === 1, 'barLayout range + proportional');
ok(coinCounts([100, 50, 1], 24).join() === '24,12,1', 'coinCounts proportional, min 1: ' + coinCounts([100, 50, 1], 24));
ok(syntheticGrowth(5).every((v, i, a) => i === 0 || v > a[i - 1]) && syntheticGrowth(5, 'down')[0] > syntheticGrowth(5, 'down')[4], 'synthetic growth up/down');
const c1 = cityBlocks(7, 9), c2 = cityBlocks(7, 9), c3 = cityBlocks(8, 9);
ok(JSON.stringify(c1) === JSON.stringify(c2) && JSON.stringify(c1) !== JSON.stringify(c3) && c1.length > 40 && c1.every((b) => b.h > 0 && Number.isFinite(b.x)), 'city deterministic per seed, ' + c1.length + ' blocks');
const ys0 = explodedY(4, 0), ys1 = explodedY(4, 1);
ok(ys1[3] - ys1[0] > ys0[3] - ys0[0] * 2 && Math.abs((ys1[0] + ys1[3]) / 2 - 2.4) < 1e-9, 'exploded view spreads around its centre');
const hx = helixPoints(30, 2.5, 1, 7); ok(hx.a.length === 30 && Math.abs(hx.a[5][0] + hx.b[5][0]) < 1e-9, 'helix strands are opposite');
ok(finite(fibonacci(500, 2)) && finite(nucleus(10, 0.5).flat()) && finite(graticule(2)), 'fibonacci/nucleus/graticule finite');
let arcBad = 0; for (const a of CITIES) for (const b of CITIES) if (!finite(arcPoints([a[1], a[2]], [b[1], b[2]], 32, 2, 0.35))) arcBad++; ok(arcBad === 0, 'all city arcs finite (incl. same-city and antipodal)');
const g = networkGraph(5, 60, 2); ok(g.edges.length > 50 && finite(g.pos) && g.hubs.length === 60 && g.deg[g.hubs[0]] >= g.deg[g.hubs[59]], 'network graph: ' + g.edges.length + ' edges');
ok(roadPath(4, 3).length === 6 && Math.abs(eventU(0, 4) - 0.2) < 1e-9, 'road path + event positions');
ok(Math.abs(E.inout(solveInOut(0.37)) - 0.37) < 1e-6 && Math.abs(E.inout(solveInOut(0)) - 0) < 1e-6, 'solveInOut inverts easing');
const rb = ribbonStrip([[0, 0, 0], [0, 0, -1], [1, 0, -2]], 2); ok(finite(rb.pos) && rb.idx.length === 12, 'ribbon strip');
const r1 = rng(hashStr('x')), r2 = rng(hashStr('x')); ok(r1() === r2() && r1() === r2(), 'rng deterministic');

// quality tiers
ok(chooseTier({ cores: 8, memGB: 8, gpu: 'Adreno (TM) 740' }) === 'high', 'flagship phone -> high');
ok(chooseTier({ cores: 8, memGB: 4 }) === 'medium' && chooseTier({ cores: 4, memGB: 8 }) === 'low' && chooseTier({ memGB: 2 }) === 'low', 'mid/low devices');
ok(chooseTier({ cores: 8, memGB: 8, gpu: 'Google SwiftShader' }) === 'low' && chooseTier({ cores: 8, memGB: 8, gpu: 'Mali-T720' }) === 'low', 'software / old GPU -> low');
ok(exportTier({ memGB: 8 }) === 'high' && exportTier({ memGB: 4 }) === 'medium' && exportTier({ memGB: 2 }) === 'low', 'export tier by RAM only');
ok(nextLower('high') === 'medium' && nextLower('medium') === 'low' && nextLower('low') === null, 'tier ladder');
const gov = new FpsGovernor(45, 5); let down = 0; for (const ms of [80, 80, 80, 80, 80]) if (gov.push(ms)) down++; let up = 0; for (const ms of [20, 20, 20, 20, 20]) if (gov.push(ms)) up++;
ok(down === 1 && up === 0, 'governor: slow frames step down, fast frames do not');
ok(TIERS.high.particles > TIERS.medium.particles && TIERS.medium.particles > TIERS.low.particles && !TIERS.low.bloom, 'tiers get lighter');

// planner picks the new recipes only when the script supports them
const mk = (texts: string[]) => texts.map((t, i) => ({ text: t, start: i * 4, end: i * 4 + 4, words: t.split(/\s+/).map((w, k) => ({ w, t0: i * 4 + k * 0.3, t1: i * 4 + k * 0.3 + 0.25 })) }));
const T = ['आज हम एक नए विषय की शुरुआत करते हैं।', 'समय के साथ आपका पैसा चक्रवृद्धि ब्याज से तेज़ी से बढ़ता है।', 'परमाणु के अंदर इलेक्ट्रॉन नाभिक के चारों ओर घूमते हैं।', 'सन 1947 में देश आज़ाद हुआ और 1991 में बाज़ार खुले।', 'डीएनए हमारी कोशिका में जीन की जानकारी रखता है।', 'सौरमंडल में हर ग्रह सूर्य के चारों ओर घूमता है।', 'यही सबसे बड़ा सबक है।', 'अंत में धैर्य रखिए।'];
const pick = (mode: 'explanation' | 'documentary', allow3d: boolean) => planScenes(mk(T), { mode, allow3d, category: 'finance', seed: 's' }).map((s) => s.block);
const on = pick('documentary', true), off = pick('documentary', false);
ok(on[1] === 'coins3d', 'money growth sentence -> coins3d (got ' + on[1] + ')');
ok(on[2] === 'atom3d' && on[4] === 'helix3d' && on[5] === 'planet3d', 'atom / DNA / planet sentences -> matching recipes (' + on.slice(2, 6).join(',') + ')');
ok(on[3] === 'road3d', 'documentary + 2 years -> road3d (got ' + on[3] + ')');
ok(planScenes(mk(T), { mode: 'explanation', allow3d: true, category: 'finance', seed: 's' })[3].block === 'timeline', 'explanation + 2 years keeps the 2D timeline');
ok(off.every((b) => !IS_3D[b]), '3D off -> no 3D block at all (' + off.join(',') + ')');
const sc = planScenes(mk(T), { mode: 'documentary', allow3d: true, category: 'finance', seed: 's' });
ok(sc.every((s) => !s.block.endsWith('3d') || (s.params.subject !== undefined)), 'every 3D scene carries a 2D fallback subject');
ok(sc[3].params.events.map((e: any) => e.year).join() === '1947,1991', 'road events come from the script years only');
console.log(fails ? `${fails} FAILED` : 'THREE OK'); if (fails) process.exit(1);
