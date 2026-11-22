// v1.0 logic tests: new layout maths + planner picks the new 2D/3D blocks only when the script supports them.
import { donutArcs, terrainH, neuralNet, gearOutline, gearRadius, gearRot, heartOutline, heartbeat, ecgY, candleSeries } from '../src/engine/three-engine/layout';
import { planScenes, canBuild, changeBlock, IS_3D, BLOCKS } from '../src/lib/brain/plan';
let fails = 0; const ok = (c: boolean, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const fin = (a: ArrayLike<number>) => Array.from(a as any as number[]).every(Number.isFinite);

// layout maths
const da = donutArcs([50, 30, 20]); ok(Math.abs(da[0].frac - 0.5) < 1e-9 && da.every((a, i) => a.a1 > a.a0 && (i === 0 || a.a0 >= da[i - 1].a1)) && da[2].a1 <= Math.PI * 2, 'donutArcs: shares + ordered, non-overlapping arcs');
ok(fin(donutArcs([0, 0]).flatMap((a) => [a.a0, a.a1])) && fin(donutArcs([NaN, 5]).flatMap((a) => [a.a0, a.a1])), 'donutArcs safe for zero / NaN');
let tb = 0; for (let x = -8; x <= 8; x += 0.5) for (let z = -8; z <= 8; z += 0.5) for (const t of [0, 3, 9]) if (!Number.isFinite(terrainH(x, z, t)) || Math.abs(terrainH(x, z, t)) > 2.2) tb++; ok(tb === 0, 'terrainH finite and bounded (|h|<=2.2)');
const nn = neuralNet(3, [4, 7, 7, 4]); ok(nn.edges.length === 4 * 7 + 7 * 7 + 7 * 4 && fin(nn.pos) && nn.layer.length === 22 && JSON.stringify(neuralNet(3, [4, 7, 7, 4]).edges) === JSON.stringify(nn.edges), 'neuralNet: ' + nn.edges.length + ' edges, deterministic');
const go = gearOutline(12, 1.2, 1.6); ok(go.length === 60 && fin(go.flat()) && Math.max(...go.map((p) => Math.hypot(p[0], p[1]))) <= 1.6 + 1e-9, 'gearOutline');
// meshing: tooth of one gear must sit in the gap of the other for ANY rotation
const T = [12, 18, 10]; let mesh = 0;
for (let k = 0; k < 200; k++) {
  const r0 = k * 0.173, r1 = gearRot(r0, T[0], T[1], 0), r2 = gearRot(r1, T[1], T[2], Math.PI / 2);
  const chk = (rp: number, tp: number, rc: number, tc: number, phi: number) => { const s1 = ((phi - rp) * tp) / (2 * Math.PI), s2 = ((phi + Math.PI - rc) * tc) / (2 * Math.PI), d = (((s1 + s2 - 0.5) % 1) + 1) % 1; return Math.min(d, 1 - d) < 1e-9; };
  if (!chk(r0, T[0], r1, T[1], 0) || !chk(r1, T[1], r2, T[2], Math.PI / 2)) mesh++;
}
ok(mesh === 0, 'gears mesh (tooth meets gap) at 200 rotations');
ok(gearRadius(18) > gearRadius(12), 'gear radius grows with teeth');
const hp = heartOutline(72, 2.8), ys = hp.map((p) => p[1]); ok(hp.length === 72 && Math.abs(Math.max(...ys) - Math.min(...ys) - 2.8) < 1e-9 && Math.abs(Math.max(...ys) + Math.min(...ys)) < 1e-9, 'heart outline height 2.8, centred');
ok(heartbeat(0.08 / 1.1) > 0.95 && heartbeat(0.6) < 0.1 && heartbeat(1 / 1.1 + 0.08 / 1.1) > 0.95, 'heartbeat peaks at lub, quiet between, periodic');
ok(ecgY(0.31) > 0.9 && Math.abs(ecgY(0.9)) < 0.01, 'ecg R-spike and flat baseline');
const cs = candleSeries(5, 20, 'up'), cs2 = candleSeries(5, 20, 'up'), cd = candleSeries(5, 20, 'down');
ok(JSON.stringify(cs) === JSON.stringify(cs2) && cs.every((c) => c.h >= Math.max(c.o, c.c) && c.l <= Math.min(c.o, c.c)) && cs[19].c > cs[0].o && cd[19].c < cd[0].o, 'candleSeries deterministic, valid OHLC, direction follows script');

// planner: each new block is chosen when (and only when) the sentence supports it
const mk = (texts: string[]) => texts.map((t, i) => ({ text: t, start: i * 4, end: i * 4 + 4, words: t.split(/\s+/).map((w, k) => ({ w, t0: i * 4 + k * 0.3, t1: i * 4 + k * 0.3 + 0.25 })) }));
const intro = 'आज हम एक नए विषय की शुरुआत करते हैं।', outro = 'यही सबसे बड़ा सबक है।', last = 'अंत में धैर्य रखिए।';
const solo = (s: string, allow3d = true, mode: 'explanation' | 'documentary' = 'explanation', cat = 'finance') => planScenes(mk([intro, s, outro, last]), { mode, allow3d, category: cat, seed: 'v1' })[1].block;
const CASES: Array<[string, string, string]> = [
  ['पोर्टफोलियो में 50% शेयर, 30% बॉन्ड और 20% सोना होता है।', 'donut3d', 'donut3d: percent shares'],
  ['स्टार्टअप ने रॉकेट की तरह लॉन्च किया और बाज़ार जीता।', 'rocket3d', 'rocket3d: launch/startup'],
  ['बीमा आपके परिवार को जोखिम से सुरक्षा देता है।', 'shield3d', 'shield3d: insurance/protection'],
  ['हमारा दिमाग आदतें कैसे बनाता है, यह मनोविज्ञान बताता है।', 'brain3d', 'brain3d: mind/habit'],
  ['रिज़र्व बैंक की नीति पूरी अर्थव्यवस्था को दिशा देती है।', 'bank3d', 'bank3d: bank/policy'],
  ['यह मशीन का तंत्र है और इंजन ऐसे काम करता है।', 'gears3d', 'gears3d: mechanism'],
  ['फायदे और नुकसान के बीच संतुलन बनाना ज़रूरी है।', 'scale3d', 'scale3d: balance'],
  ['दिल की सेहत के लिए रोज़ व्यायाम और नींद ज़रूरी है।', 'heart3d', 'heart3d: heart/health'],
  ['हमारी आकाशगंगा में करोड़ों तारे हैं।', 'galaxy3d', 'galaxy3d: galaxy/universe'],
  ['भविष्य की ऊर्जा और कल्पना नई दुनिया बनाएगी।', 'orb3d', 'orb3d: future/energy'],
  ['डिजिटल क्रिप्टो नेटवर्क पूरी दुनिया में फैला है।', 'holo3d', 'holo3d: digital/global'],
  ['यह सफर तेज़ बदलाव और क्रांति का है।', 'tunnel3d', 'tunnel3d: journey/revolution'],
  ['बाज़ार में उतार-चढ़ाव हमेशा रहता है, यह एक चक्र है।', 'terrain3d', 'terrain3d: volatility/cycle'],
];
for (const [text, want, name] of CASES) { const picks = new Set<string>(); for (const seed of ['a', 'b', 'c', 'd']) picks.add(planScenes(mk([intro, text, outro, last]), { mode: 'explanation', allow3d: true, category: 'finance', seed })[1].block); ok(picks.has(want), `${name} -> ${[...picks].join('/')}`); }
const noThree = planScenes(mk([intro, ...CASES.map((c) => c[0]), outro, last]), { mode: 'explanation', allow3d: false, category: 'finance', seed: 'x' }).map((s) => s.block);
ok(noThree.every((b) => !IS_3D[b]), '3D off -> no 3D block at all: ' + noThree.join(','));
// 2D
const w2 = (text: string) => { const s = new Set<string>(); for (const seed of ['a', 'b', 'c', 'd', 'e']) s.add(planScenes(mk([intro, text, outro, last]), { mode: 'explanation', allow3d: false, category: 'finance', seed })[1].block); return [...s]; };
ok(w2('पोर्टफोलियो में 50% शेयर, 30% बॉन्ड और 20% सोना होता है।').includes('donut'), 'donut: percent shares -> ' + w2('पोर्टफोलियो में 50% शेयर, 30% बॉन्ड और 20% सोना होता है।'));
ok(w2('इस साल बैंक का जोखिम स्तर 72% तक पहुँचा।').some((b) => b === 'gauge' || b === 'ring'), 'ring/gauge: single % -> ' + w2('इस साल बैंक का जोखिम स्तर 72% तक पहुँचा।'));
ok(w2('शेयर बाज़ार में ट्रेडिंग करते समय सेंसेक्स पर नज़र रखें।').includes('candles'), 'candles: stock/trading');
ok(w2('सबसे पहले बजट बनाएं, फिर बचत करें, उसके बाद निवेश करें और अंत में समीक्षा करें।').some((b) => b === 'flow' || b === 'steps'), 'flow/steps: ordered steps -> ' + w2('सबसे पहले बजट बनाएं, फिर बचत करें, उसके बाद निवेश करें और अंत में समीक्षा करें।'));
// no fake data: blocks that need data refuse when the sentence has none
ok(!canBuild('donut', 'आज मौसम अच्छा है') && !canBuild('ring', 'आज मौसम अच्छा है') && !canBuild('gauge', 'दाम 500 रुपये है') && canBuild('ring', 'वृद्धि 12% रही') && canBuild('donut', '40% और 60% लोग'), 'canBuild: donut/ring/gauge need real numbers');
ok(changeBlock({ id: 1, text: 'आज मौसम अच्छा है', start: 0, end: 4, block: 'callout', params: {}, words: [], transition: 'fade', camera: { z0: 1, z1: 1, px: 0 }, reason: '' }, 'donut') === null, 'changeBlock refuses donut without data');
ok(BLOCKS.length >= 44 && new Set(BLOCKS).size === BLOCKS.length, 'block catalogue: ' + BLOCKS.length + ' unique blocks (was 24)');
console.log(fails ? 'V1 FAIL' : 'V1 OK'); process.exit(fails ? 1 : 0);
