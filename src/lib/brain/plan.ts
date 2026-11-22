// Motion Design Brain: turns aligned sentences into a validated scene plan.
// Deterministic rule engine (always works offline). An optional in-browser LLM (llm.ts) may propose a plan;
// it is validated here and the rule plan is the fallback, so a bad LLM answer can never break a video.
import { cleanWord, extractFacts, tokenize, type Facts } from './script';
import { pickSubject } from '../motion/pro';

export type BlockType = 'title' | 'stat' | 'bars' | 'bars3d' | 'line' | 'timeline' | 'steps' | 'compare' | 'quote' | 'words' | 'callout' | 'sphere3d' | 'end' | 'hero' | 'orbit' | 'chartcard' | 'asset' | 'coins3d' | 'city3d' | 'exploded3d' | 'atom3d' | 'helix3d' | 'planet3d' | 'network3d' | 'road3d' | 'donut3d' | 'rocket3d' | 'shield3d' | 'pipeline3d' | 'terrain3d' | 'brain3d' | 'bank3d' | 'gears3d' | 'scale3d' | 'clock3d' | 'heart3d' | 'crystal3d' | 'galaxy3d' | 'orb3d' | 'holo3d' | 'tunnel3d' | 'donut' | 'ring' | 'gauge' | 'flow' | 'funnel' | 'versus' | 'candles' | 'checklist';
export const BLOCKS: BlockType[] = ['title', 'stat', 'bars', 'bars3d', 'line', 'timeline', 'steps', 'compare', 'quote', 'words', 'callout', 'sphere3d', 'hero', 'orbit', 'chartcard', 'coins3d', 'city3d', 'exploded3d', 'atom3d', 'helix3d', 'planet3d', 'network3d', 'road3d', 'donut3d', 'rocket3d', 'shield3d', 'pipeline3d', 'terrain3d', 'brain3d', 'bank3d', 'gears3d', 'scale3d', 'clock3d', 'heart3d', 'crystal3d', 'galaxy3d', 'orb3d', 'holo3d', 'tunnel3d', 'donut', 'ring', 'gauge', 'flow', 'funnel', 'versus', 'candles', 'checklist', 'end'];
export const IS_3D: Partial<Record<BlockType, true>> = { bars3d: true, sphere3d: true, coins3d: true, city3d: true, exploded3d: true, atom3d: true, helix3d: true, planet3d: true, network3d: true, road3d: true, donut3d: true, rocket3d: true, shield3d: true, pipeline3d: true, terrain3d: true, brain3d: true, bank3d: true, gears3d: true, scale3d: true, clock3d: true, heart3d: true, crystal3d: true, galaxy3d: true, orb3d: true, holo3d: true, tunnel3d: true };
// topic cues for the Three.js recipes (Hindi + English)
const RX = {
  money: /पैसा|पैसे|निवेश|ब्याज|बचत|कमाई|रुपय|धन|money|invest|compound|interest|profit|wealth|saving|income|₹|\$/i,
  city: /शहर|इमारत|बाज़ार|बाजार|कारोबार|अर्थव्यवस्था|उद्योग|city|building|market|economy|business|industry|urban|skyline/i,
  layers: /परत|हिस्से|संरचना|आर्किटेक्चर|components?|layers?|structure|architecture|inside|अंदर कैसे|कैसे काम/i,
  atom: /परमाणु|अणु|इलेक्ट्रॉन|रसायन|atom|molecul|electron|chemi|proton|nucle/i,
  bio: /डीएनए|जीन|कोशिका|जीव|dna\b|gene|genetic|cell\b|cells\b|biolog|protein/i,
  space: /ग्रह|अंतरिक्ष|तारा|आकाशगंगा|चाँद|चांद|सूर्य|planet|space|galaxy|star\b|stars\b|moon|orbit|solar|cosmos/i,
  rocket: /रॉकेट|लॉन्च|स्टार्टअप|उड़ान|उड़ान भर|गति पकड़|rocket|launch|startup|take-?off|skyrocket|moonshot|breakout/i,
  shield: /सुरक्षा|सुरक्षित|बीमा|धोखा|धोखाधड़ी|हैक|insurance|secur|protect|safe|hedge|fraud|scam|defen[cs]e/i,
  terrain: /उतार-?चढ़ाव|अस्थिर|चक्र|volatil|fluctuat|boom|bust|cycle|ups and downs/i,
  stock: /शेयर|स्टॉक|सेंसेक्स|निफ्टी|ट्रेडिंग|शेयर बाज़ार|stock|share price|sensex|nifty|trading|candle|equity/i,
  mind: /दिमाग|मस्तिष्क|सोच|मनोविज्ञान|भावना|आदत|याददाश्त|brain|mind|psycholog|cognit|neural|habit|bias|memory|learning/i,
  bank: /बैंक|सरकार|नीति|आरबीआई|कानून|संस्था|अदालत|bank|government|policy|\brbi\b|regulat|institution|treasury|court|law\b/i,
  gears: /तंत्र|मशीन|इंजन|उत्पादन|मैकेनिज़्म|ऑटोमेशन|कारखाना|mechanism|machine|engine|gear|automation|factory|manufactur|काम करता|काम करती/i,
  balance: /न्याय|तराज़ू|संतुलन|फायदे और नुकसान|balance|justice|trade-?off|pros and cons/i,
  time: /समय|घड़ी|घंटा|दशक|धैर्य|इंतज़ार|लंबे समय|clock|time\b|hours?\b|decade|patience|waiting|long-?term/i,
  heart: /दिल|हृदय|स्वास्थ्य|सेहत|धड़कन|नींद|व्यायाम|heart|health|cardio|blood|fitness|exercise|sleep/i,
  share: /हिस्सा|हिस्से|प्रतिशत|अनुपात|बंटवारा|share of|portion|split|allocation|breakdown|ratio/i,
  funnel: /फ़नल|फनल|छँटनी|चरणों|conversion|funnel|filter|stages/i,
  todo: /सूची|चेकलिस्ट|ज़रूरी|जरूरी|आदतें|नियम|फायदे|checklist|must|should|tips|habits|rules|benefits|करें/i,
  gaugeCue: /स्तर|जोखिम|इंडेक्स|स्कोर|रेटिंग|level|risk|index|score|rating|meter|speed/i,
  galaxy: /आकाशगंगा|ब्रह्मांड|अनंत|करोड़ों|जनसंख्या|galaxy|universe|cosmos|infinite|millions|billions|population|crowd/i,
  future: /भविष्य|नवाचार|आइडिया|ऊर्जा|कल्पना|एआई|future|innovat|idea|energy|\bai\b|intelligen|creativ|imagin/i,
  digital: /डिजिटल|क्रिप्टो|ब्लॉकचेन|वैश्विक|इंटरनेट|डेटा|साइबर|digital|crypto|blockchain|global|internet|cyber/i,
  journey: /सफर|यात्रा|आगे बढ़|तेज़|गति|क्रांति|बदलाव|journey|speed|revolution|transform|accelerat|forward|breakthrough/i,
  net: /नेटवर्क|इंटरनेट|डेटा|ब्लॉकचेन|क्रिप्टो|network|internet|connect|blockchain|crypto|data\b|\bai\b|server|cloud/i
};
export type Mode = 'explanation' | 'documentary';
export type Transition = 'fade' | 'slide' | 'zoom' | 'wipe';
export interface Word { w: string; t0: number; t1: number }
export interface SceneSpec {
  id: number; text: string; start: number; end: number; block: BlockType; params: Record<string, any>;
  words: Word[]; transition: Transition; camera: { z0: number; z1: number; px: number }; reason: string;
}
export interface Timed { text: string; start: number; end: number; words: Word[] }

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
const short = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');

/** numbers that can honestly share one chart: same unit, largest group first */
function sameUnit(f: Facts): Facts['numbers'] {
  const g = new Map<string, Facts['numbers']>();
  for (const n of f.numbers) { const k = n.unit + '|' + n.suffix; g.set(k, [...(g.get(k) ?? []), n]); }
  return [...g.values()].sort((a, b) => b.length - a.length)[0] ?? [];
}
const GROW = /बढ़|बढ|वृद्धि|grow|increase|rise|compound|ब्याज|multiply|गुना|तेज़ी|तेजी/g, DEC = /गिर|घट|कमी|decline|decrease|drop|fall|नुकसान|loss|crash/g;
/** direction of a trend sentence: whichever cue comes LAST wins ("तेज़ी से गिरा" = fell) */
const trendDir = (t: string): 'up' | 'down' => { const l = t.toLowerCase(); const last = (re: RegExp) => { let i = -1, m: RegExpExecArray | null; re.lastIndex = 0; while ((m = re.exec(l))) i = m.index; return i; }; return last(DEC) > last(GROW) ? 'down' : 'up'; };
const goodLabel = (w: string) => w.length >= 2 && !/^\d/.test(w) && !/^(और|का|की|के|में|से|तक|to|and|the|of)$/i.test(w);
function statNum(f: Facts) { return f.numbers.find((n) => n.unit === '%') ?? f.numbers.find((n) => n.unit === 'money') ?? f.numbers[0]; }

function score(b: BlockType, f: Facts, text: string, nWords: number, mode: Mode, allow3d: boolean, cat = 'other'): number {
  const nums = sameUnit(f).length, any = f.numbers.length;
  switch (b) {
    case 'coins3d': return allow3d && RX.money.test(text) && f.growth && !f.decline ? 9 : 0; // growth only: a falling market is a chart, not a rising coin stack
    case 'city3d': return allow3d && RX.city.test(text) && !f.growth && !f.decline && nums < 2 ? 5.6 + (mode === 'documentary' ? 0.6 : 0) : 0; // data scenes (chart/bars) win when the sentence has numbers or a trend
    case 'exploded3d': return !allow3d ? 0 : RX.layers.test(text) ? 6.8 : f.list.length >= 3 && (cat === 'technology' || cat === 'science') ? 5.8 : 0;
    case 'atom3d': return allow3d && RX.atom.test(text) ? 7.4 : 0;
    case 'helix3d': return allow3d && RX.bio.test(text) ? 7.4 : 0;
    case 'planet3d': return allow3d && RX.space.test(text) ? 7.2 : 0;
    case 'network3d': return allow3d && RX.net.test(text) ? 5.8 : 0;
    case 'road3d': return allow3d && f.years.length >= 2 ? (mode === 'documentary' ? 10.2 : 4.5) : 0;
    case 'donut3d': return allow3d && nums >= 2 && sameUnit(f)[0].unit === '%' ? 7.5 : allow3d && nums >= 2 && RX.share.test(text) ? 5.6 : 0;
    case 'rocket3d': return allow3d && RX.rocket.test(text) ? 7.0 : 0;
    case 'shield3d': return allow3d && RX.shield.test(text) ? 6.9 : 0;
    case 'pipeline3d': return allow3d ? (f.steps ? 7.2 : f.list.length >= 3 ? 4.6 : 0) : 0;
    case 'terrain3d': return allow3d && RX.terrain.test(text) && nums < 3 ? 6.4 : allow3d && RX.stock.test(text) && nums < 3 ? 5.9 : 0;
    case 'brain3d': return allow3d && RX.mind.test(text) ? 7.0 : 0;
    case 'bank3d': return allow3d && RX.bank.test(text) ? 6.9 : 0;
    case 'gears3d': return allow3d && RX.gears.test(text) ? 6.6 : 0;
    case 'scale3d': return allow3d ? (RX.balance.test(text) ? 7.0 : f.compare && nums < 2 ? 5.9 : 0) : 0;
    case 'clock3d': return allow3d && RX.time.test(text) && !f.growth && !f.decline && nums < 2 ? 5.6 : 0;
    case 'heart3d': return allow3d && RX.heart.test(text) ? 7.0 : 0;
    case 'galaxy3d': return allow3d && RX.galaxy.test(text) ? 7.3 : 0;
    case 'orb3d': return allow3d && RX.future.test(text) && any === 0 ? 6.6 : 0;
    case 'holo3d': return allow3d && RX.digital.test(text) && nums < 2 ? 6.7 : 0;
    case 'tunnel3d': return allow3d && RX.journey.test(text) && nums < 2 ? 6.8 : 0;
    case 'crystal3d': return allow3d && f.keywords.length >= 1 && any === 0 && nWords >= 5 ? 3.9 + (mode === 'documentary' ? 0.6 : 0.2) : 0;
    case 'donut': return nums >= 2 && sameUnit(f)[0].unit === '%' ? 7.4 : nums >= 2 && RX.share.test(text) ? 6.4 : 0;
    case 'ring': return nums < 2 && f.numbers.some((n) => n.unit === '%') ? 6.5 : 0;
    case 'gauge': return nums < 2 && f.numbers.some((n) => n.unit === '%') && RX.gaugeCue.test(text) ? 7.2 : 0;
    case 'flow': return f.steps ? 7.4 : f.list.length >= 3 ? 4.4 : 0;
    case 'funnel': return f.list.length >= 3 && RX.funnel.test(text) ? 7.2 : f.list.length >= 3 && cat === 'business' ? 4.8 : 0;
    case 'versus': return f.compare && nums < 2 ? 5.9 : 0;
    case 'candles': return RX.stock.test(text) && nums < 3 ? 7.0 : 0;
    case 'checklist': return f.list.length >= 3 && RX.todo.test(text) ? 6.8 : 0;
    case 'stat': return any >= 1 ? 5 + (statNum(f).unit === '%' ? 1 : 0) - (nums > 2 ? 3 : 0) : 0;
    case 'bars': return nums >= 3 ? 6 : nums === 2 ? (f.compare ? 8 : 3.5) : 0;
    case 'bars3d': return allow3d ? (nums >= 3 ? 5.6 : nums === 2 ? 3.2 : 0) : 0;
    case 'line': return (f.growth || f.decline) ? 5 + (nums >= 3 ? 1.5 : 0) : 0;
    case 'timeline': return f.years.length >= 2 ? 7 + (mode === 'documentary' ? 1.5 : 0) : 0;
    case 'steps': return f.steps ? 6 : f.list.length >= 3 ? 4 : 0;
    case 'compare': return f.compare ? 5.5 : 0;
    case 'quote': return f.quotes.length ? 8 : 0;
    case 'sphere3d': return allow3d && f.world ? 4.2 + (mode === 'documentary' ? 1 : 0) : 0;
    case 'callout': return f.question ? 2.2 : 0.9;
    case 'hero': return (f.question ? 5 : f.definition ? 5.2 : 3.4) + (mode === 'documentary' ? 1.2 : 0) + (nWords >= 6 ? 0.4 : 0);
    case 'orbit': return (f.list.length >= 3 ? 6.4 : f.keywords.length >= 2 ? 4.4 : 2.6) + (mode === 'explanation' ? 0.8 : 0);
    case 'chartcard': return (f.growth || f.decline) ? 7 + (nums >= 3 ? 1 : 0) : 0;
    case 'words': return nWords <= 3 ? 3.0 : 0.8;
    default: return 0;
  }
}

function params(b: BlockType, f: Facts, text: string, projectTitle: string, category = 'other', avoid?: string): Record<string, any> {
  const nums = sameUnit(f);
  const subject = pickSubject(b === 'title' ? text + ' ' + projectTitle : text, category, avoid as any); // scene text decides; never the same subject twice in a row
  switch (b) {
    case 'title': return { text: projectTitle || short(text, 70), subject };
    case 'hero': { const kw = f.keywords.slice(0, 2).join(' '); return { title: short(kw || text, 34), sub: short(text, 110), subject }; }
    case 'orbit': {
      const parts = f.list.length >= 3 ? f.list : [...new Set([...f.keywords, ...tokenize(text).map(cleanWord).filter((w) => w.length >= 4 && goodLabel(w))])];
      return { items: parts.slice(0, 5).map((x) => short(x, 22)), subject };
    }
    case 'chartcard': { const n = nums.slice(0, 8); return { values: n.length >= 3 ? n.map((x) => x.value) : [], synthetic: n.length < 3, dir: trendDir(text), label: short(f.keywords[0] ?? '', 24) }; }
    case 'end': return { text: short(text, 90) };
    case 'stat': { const n = statNum(f); return { value: n.value, prefix: n.prefix, suffix: n.suffix, unit: n.unit, label: short(text, 80) }; }
    case 'bars': case 'bars3d': {
      const n = nums.slice(0, 6);
      return { values: n.map((x) => x.value), labels: n.map((x, i) => short(goodLabel(x.label) ? x.label : String.fromCharCode(65 + i), 12)), prefix: n[0]?.prefix ?? '', suffix: n[0]?.suffix ?? '', title: short(f.keywords[0] ?? '', 24) };
    }
    case 'line': {
      const n = nums.slice(0, 8);
      return n.length >= 3 ? { values: n.map((x) => x.value), synthetic: false, dir: trendDir(text), label: short(f.keywords[0] ?? '', 24) }
        : { values: [], synthetic: true, dir: trendDir(text), label: short(f.keywords[0] ?? '', 24) };
    }
    case 'timeline': return { events: [...f.years].sort((a, b) => a.year - b.year).slice(0, 5).map((y) => ({ year: y.year, label: short(y.label.replace(/^(में|को|से|तक|में|in|on|by|of)\s+/i, '').replace(/^(में|को|से)\s+/i, ''), 26) })) };
    case 'steps': return { items: (f.list.length >= 3 ? f.list : text.split(/[,;।.]/).map((x) => x.trim()).filter((x) => x.length > 2)).slice(0, 5).map((x) => short(x, 34)) };
    case 'compare': {
      const m = text.split(/\s*(?:बनाम|\bvs\.?\b|versus|जबकि|मगर|\bbut\b|compared to|के मुकाबले)\s*/i);
      const l = m[0] ?? text, r = m.slice(1).join(' ') || '';
      return { left: short(l, 70), right: short(r || '…', 70) };
    }
    case 'quote': return { text: short(f.quotes[0] ?? text, 120) };
    case 'callout': return { text: short(text, 110), icon: f.question ? '?' : f.definition ? 'i' : '!' };
    case 'sphere3d': return { label: short(f.keywords[0] ?? '', 26), text: short(text, 90) };
    case 'coins3d': { const n = nums.slice(0, 7); return n.length >= 2 ? { values: n.map((x) => x.value), labels: n.map((x, i) => short(goodLabel(x.label) ? x.label : '', 12)), prefix: n[0]?.prefix ?? '', suffix: n[0]?.suffix ?? '', synthetic: false, dir: trendDir(text), subject, title: short(f.keywords[0] ?? '', 34) } : { values: [], synthetic: true, dir: trendDir(text), subject, title: short(f.keywords[0] ?? '', 34) }; }
    case 'city3d': case 'planet3d': case 'helix3d': return { label: short(f.keywords[0] ?? '', 26), subject, title: short(f.keywords[0] ?? text, 34) };
    case 'exploded3d': case 'atom3d': case 'network3d': { const parts = f.list.length >= 2 ? f.list : [...new Set([...f.keywords, ...tokenize(text).map(cleanWord).filter((w) => w.length >= 4 && goodLabel(w))])]; return { items: parts.slice(0, b === 'atom3d' ? 3 : 5).map((x) => short(x, 22)), subject, title: short(f.keywords[0] ?? text, 34) }; }
    case 'road3d': return { events: [...f.years].sort((a, b2) => a.year - b2.year).slice(0, 5).map((y) => ({ year: y.year, label: short(y.label.replace(/^(में|को|से|तक|in|on|by|of)\s+/i, ''), 26) })), subject, title: short(f.keywords[0] ?? text, 34) };
    case 'donut': case 'donut3d': { const n = nums.slice(0, 6); return { values: n.map((x) => x.value), labels: n.map((x, i) => short(goodLabel(x.label) ? x.label : String.fromCharCode(65 + i), 12)), prefix: n[0]?.prefix ?? '', suffix: n[0]?.suffix ?? '', title: short(f.keywords[0] ?? '', 24) }; }
    case 'ring': case 'gauge': { const n = f.numbers.find((q) => q.unit === '%') ?? statNum(f); return { value: n?.value ?? 0, prefix: n?.prefix ?? '', suffix: n?.suffix ?? '', unit: n?.unit ?? '', label: short(text, 80) }; }
    case 'flow': case 'funnel': case 'checklist': case 'pipeline3d': return { items: (f.list.length >= 3 ? f.list : text.split(/[,;।.]/).map((x) => x.trim()).filter((x) => x.length > 2)).slice(0, b === 'checklist' ? 6 : 5).map((x) => short(x, 34)), title: short(f.keywords[0] ?? '', 24), subject };
    case 'versus': case 'scale3d': {
      const m = text.split(/\s*(?:बनाम|\bvs\.?\b|versus|जबकि|मगर|\bbut\b|compared to|के मुकाबले)\s*/i);
      if (m.length >= 2) return { left: short(m[0], 70), right: short(m.slice(1).join(' '), 70) };
      const parts = text.split(/\s*(?:[,;،]|\bऔर\b|\band\b|\bor\b|या)\s*/i).filter((x) => x.trim().length > 1), h = Math.ceil(parts.length / 2);
      if (parts.length >= 2) return { left: short(parts.slice(0, h).join(', '), 70), right: short(parts.slice(h).join(', '), 70) };
      const w = text.split(/\s+/), k = Math.ceil(w.length / 2); return { left: short(w.slice(0, k).join(' '), 70), right: short(w.slice(k).join(' ') || '…', 70) };
    }
    case 'candles': return { dir: trendDir(text), label: short(f.keywords[0] ?? '', 24), synthetic: true };
    case 'rocket3d': case 'shield3d': case 'terrain3d': case 'brain3d': case 'bank3d': case 'gears3d': case 'clock3d': case 'heart3d': case 'crystal3d': case 'galaxy3d': case 'orb3d': case 'holo3d': case 'tunnel3d': { const parts = [...new Set([...f.keywords, ...tokenize(text).map(cleanWord).filter((w) => w.length >= 4 && goodLabel(w))])]; return { label: short(f.keywords[0] ?? '', 26), title: short(f.keywords[0] ?? text, 34), items: (f.list.length >= 2 ? f.list : parts).slice(0, 3).map((x) => short(x, 22)), subject }; }
    case 'words': return {};
    case 'asset': return {};
  }
}

export interface PlanOptions { mode: Mode; allow3d: boolean; title?: string; seed?: string; category?: string }

/** Build the scene plan. Same input => same plan (deterministic). */
export function planScenes(timed: Timed[], opt: PlanOptions): SceneSpec[] {
  const out: SceneSpec[] = [];
  const hist: BlockType[] = []; let lastSubject: string | undefined;
  const TR: Transition[] = opt.mode === 'documentary' ? ['fade', 'fade', 'zoom', 'wipe'] : ['slide', 'fade', 'zoom', 'wipe'];
  timed.forEach((t, i) => {
    const f = extractFacts(t.text);
    const nW = tokenize(t.text).length;
    let block: BlockType, reason: string;
    if (i === 0) { block = 'title'; reason = 'हुक: पहला scene बड़ा title'; }
    else if (i === timed.length - 1 && timed.length > 2) { block = 'end'; reason = 'conclusion: closing card'; }
    else {
      let best: BlockType = 'callout', bs = -1e9;
      for (const b of BLOCKS) {
        if (b === 'title' || b === 'end') continue;
        let s = score(b, f, t.text, nW, opt.mode, opt.allow3d, opt.category);
        if (s <= 0 && b !== 'callout' && b !== 'words') continue;
        if (hist[hist.length - 1] === b) s -= 4;
        s -= 1.5 * hist.slice(-3).filter((h) => h === b).length;
        s += hash(`${opt.seed ?? ''}${i}${b}${t.text}`) * 0.6; // deterministic variety
        if (s > bs) { bs = s; best = b; }
      }
      block = best;
      reason = block === 'hero' || block === 'orbit' ? `concept scene (${block}) + subject` : block === 'chartcard' ? 'growth/decline → glow chart card' : `script में मिला: ${block}`;
    }
    // a block that cannot be built from the facts falls back safely
    let p = params(block, f, t.text, opt.title ?? '', opt.category, lastSubject);
    if (block === 'steps' && (p.items as string[]).length < 2) { block = 'orbit'; p = params(block, f, t.text, '', opt.category); reason += ' → fallback callout'; }
    if (block === 'orbit' && (p.items as string[]).length < 2) { block = 'hero'; p = params(block, f, t.text, '', opt.category, lastSubject); }
    if (p.subject) lastSubject = p.subject;
    hist.push(block);
    const z = opt.mode === 'documentary' ? 0.045 : 0.03;
    const dir = i % 2 ? -1 : 1;
    out.push({
      id: i, text: t.text, start: t.start, end: t.end, block, params: p, words: t.words,
      transition: TR[Math.floor(hash(`${opt.seed ?? ''}tr${i}`) * TR.length)],
      camera: { z0: dir > 0 ? 1 : 1 + z, z1: dir > 0 ? 1 + z : 1, px: dir * (opt.mode === 'documentary' ? 0.012 : 0.006) },
      reason
    });
  });
  return out;
}

/** Re-build one scene with a different block chosen by the user (scene editing). */
export function canBuild(block: BlockType, text: string): boolean {
  const f = extractFacts(text), u = sameUnit(f).length;
  switch (block) {
    case 'stat': return f.numbers.length >= 1;
    case 'bars': case 'bars3d': return u >= 2;
    case 'timeline': case 'road3d': return f.years.length >= 2;
    case 'steps': return Math.max(f.list.length, text.split(/[,;।.]/).filter((x) => x.trim().length > 2).length) >= 2;
    case 'donut': case 'donut3d': return u >= 2;
    case 'ring': case 'gauge': return f.numbers.some((n) => n.unit === '%');
    case 'flow': case 'funnel': case 'checklist': case 'pipeline3d': return Math.max(f.list.length, text.split(/[,;।.]/).filter((x) => x.trim().length > 2).length) >= 2;
    case 'line': return u >= 3 || true; // without 3 numbers it is drawn as a labelled illustration
    default: return true;
  }
}
/** Switch a scene to another block. Returns null when the script has nothing to build it from (no fake data). */
export function changeBlock(s: SceneSpec, block: BlockType, title = ''): SceneSpec | null {
  if (!canBuild(block, s.text)) return null;
  return { ...s, block, params: params(block, extractFacts(s.text), s.text, title), reason: 'user ne badla' };
}

// ---------- optional LLM plan: prompt + strict validation ----------
export function buildLLMPrompt(sentences: string[], mode: Mode): string {
  return `You are a motion-graphics director for a ${mode} video. For each numbered sentence choose ONE block from: ${BLOCKS.filter((b) => b !== 'title' && b !== 'end').join(', ')}.
Rules: use "stat" only if the sentence has a number; "timeline" only if it has 2+ years; never invent numbers; avoid repeating the same block twice in a row.
Reply with ONLY a JSON array: [{"i":0,"block":"stat"}, ...] — one item per sentence.
Sentences:
${sentences.map((s, i) => `${i}. ${s}`).join('\n')}`;
}

/** Parse + validate an LLM reply. Returns a map sentenceIndex -> block. Invalid items are dropped (rule plan is used). */
export function parseLLMPlan(reply: string, count: number): Map<number, BlockType> {
  const m = new Map<number, BlockType>();
  const j = reply.match(/\[[\s\S]*\]/);
  if (!j) return m;
  try {
    const arr = JSON.parse(j[0]);
    if (!Array.isArray(arr)) return m;
    for (const it of arr) if (it && Number.isInteger(it.i) && it.i >= 0 && it.i < count && BLOCKS.includes(it.block) && it.block !== 'title' && it.block !== 'end') m.set(it.i, it.block);
  } catch { /* ignore: fall back to rules */ }
  return m;
}

/** Apply LLM suggestions only where the facts can actually support the block. */
export function applyLLM(scenes: SceneSpec[], llm: Map<number, BlockType>, allow3d: boolean, title = ''): SceneSpec[] {
  return scenes.map((s) => {
    const b = llm.get(s.id);
    if (!b || b === s.block || s.block === 'title' || s.block === 'end') return s;
    if (!allow3d && IS_3D[b]) return s;
    const f = extractFacts(s.text);
    const ok = (b === 'compare' ? f.compare : b === 'quote' ? f.quotes.length > 0 : true) && canBuild(b, s.text);
    const n = ok ? changeBlock(s, b, title) : null;
    return n ? { ...n, reason: 'LLM ne chuna' } : s;
  });
}
export { cleanWord };
