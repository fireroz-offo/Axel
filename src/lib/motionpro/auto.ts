// The "AI edits Motion Pro" layer: for a scene, pick a fitting template from the 171K library and rewrite ALL of its visible text
// (headline, labels, steps, years, quote, stat) from the script. Rules (same honesty rules as the rest of the app):
//  * only templates whose text the AI can fully replace are used (checked by an automated leak scan, see docs/MOTION_PRO.md);
//  * templates that print random chart numbers / fixed years / SaaS demo copy are never auto-picked;
//  * a number appears only if the script has it (Stat template); everything else is decorative motion.
import type { Mode, SceneSpec } from '../brain/plan';
import { cleanWord, extractFacts, tokenize } from '../brain/script';
import { catalogue, mpId, type MpCopy, type MpParams, type Pal6 } from './index';

export type MpMix = 'off' | 'mix' | 'max';
export interface MpTheme { bg0: string; bg1: string; acc: string; acc2: string; ink: string }
export interface MpAutoOpts { mix: MpMix; mode: Mode; category: string; theme: MpTheme; palette: 'theme' | 'template'; seed: string; title: string }

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
const short = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');
const CAT_LABEL: Record<string, string> = { finance: 'Finance', business: 'Business', technology: 'Technology', science: 'Science', psychology: 'Psychology', history: 'History', education: 'Education', health: 'Health', space: 'Space', ai: 'AI', other: 'DIVRIZ' };

/** template names whose text the AI fully controls (or that have no text at all) */
export const GROUPS: Record<string, string[]> = {
  stat: ['Stat'],
  steps: ['Steps', 'Auto Bullet Explainer'],
  time: ['Timeline'],
  quote: ['Quote', 'Paper Unfold Card'],
  typo: ['Headline', 'Sliced Text', 'Neon Flicker', 'RGB Glitch', 'Water Fill Text', 'Auto Typing Explainer', 'Lower third', 'Logo Line Draw', 'Logo Shine Reveal', 'Polaroid Drop', 'Opening Doors', 'Page Peel Transition', 'Geometric'],
  depth: ['3D Perspective Spin', '3D Tilt Shine', '3D Carousel', 'Gyroscope', 'DNA Helix', 'Kaleidoscope', 'Spiral Galaxy', 'Warp Tunnel', 'Tile Flip Wall', 'Honeycomb Pulse', 'Newton Cradle', 'Pendulum Wave', 'Magnet Grid', 'Parallax Depth', 'Float Reflection', 'Paper Fold Reveal', 'Mosaic Build', 'Mosaic Tile Build'],
  fluid: ['Radial Burst', 'Shape Burst', 'Shape Morph', 'Liquid Blob Morph', 'Gooey Blobs', 'Ribbon Wave', 'Liquid Waveform', 'Audio Spectrum', 'Equalizer Bounce', 'Lissajous Draw', 'Laser Light Trail', 'Gradient Flow', 'Glow Pulse', 'Hue Cycle', 'Heartbeat Frame'],
  net: ['Network Connection', 'Honeycomb Pulse', 'Animated Route Map'],
  lines: ['Signature Line Draw', 'Continuous Stroke Reveal', 'Blueprint Path Draw'],
  reveal: ['Slice Reveal', 'Wipe Reveal', 'Zoom Burst', 'Duotone Sweep', 'Shine Sweep', 'Blur Focus', 'Ken Burns', 'CRT Scanlines', 'Film Strip', 'RGB Glitch Photo']
};
/** native block -> which Motion Pro groups can replace it (first = best) */
export const GROUP_OF: Record<string, string[]> = {
  stat: ['stat'], ring: ['stat'], gauge: ['stat'], steps: ['steps'], flow: ['steps'], checklist: ['steps'], funnel: ['steps'], pipeline3d: ['steps'],
  timeline: ['time'], road3d: ['time'], quote: ['quote', 'typo'], words: ['typo', 'reveal'], callout: ['typo', 'lines'], hero: ['typo', 'reveal', 'fluid'], title: ['typo'],
  orbit: ['net', 'fluid'], network3d: ['net', 'depth'], brain3d: ['net', 'fluid'], sphere3d: ['net', 'lines'],
  atom3d: ['depth', 'fluid'], helix3d: ['depth'], exploded3d: ['depth'], crystal3d: ['depth', 'fluid'], planet3d: ['depth', 'fluid'], clock3d: ['lines', 'fluid'], gears3d: ['depth'],
  city3d: ['reveal', 'depth'], heart3d: ['fluid'], galaxy3d: ['depth', 'fluid'], orb3d: ['fluid', 'depth'], holo3d: ['net', 'lines'], tunnel3d: ['depth', 'reveal'], shield3d: ['depth', 'fluid'], rocket3d: ['fluid', 'depth'], bank3d: ['reveal', 'typo'], terrain3d: ['fluid', 'lines']
};

const GREEDY = (words: string[], max: number, maxLines: number): string[] => {
  const lines: string[] = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (t.length > max && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines.slice(0, maxLines);
};
/** first clause of the sentence as the headline (<= 3 short lines) + the rest as a sub line */
export function headline(text: string): { lines: string[]; rest: string } {
  const clauses = text.split(/(?<=[,;।.!?:—–])\s+/).map((x) => x.trim()).filter(Boolean);
  let head = clauses[0] ?? text, used = 1; while (head.length < 14 && clauses[used]) head += ' ' + clauses[used++];
  const words = head.replace(/[,;।.!?:—–]+$/g, '').split(/\s+/); let take = words, n = 0, cut = 0;
  for (const w of words) { n += w.length + 1; if (n > 38) break; cut++; } take = words.slice(0, Math.max(2, cut));
  const rest = text.slice(text.indexOf(take[take.length - 1]) + take[take.length - 1].length).replace(/^[\s,;।.!?:—–]+/, '');
  return { lines: GREEDY(take, 16, 3), rest: short(rest, 64) };
}

/** every text the Motion Pro templates may show, rewritten from this scene (the "AI edit") */
export function copyFor(s: SceneSpec, category: string, title: string): MpCopy {
  const f = extractFacts(s.text), { lines, rest } = headline(s.text), cat = CAT_LABEL[category] ?? 'DIVRIZ';
  const kws = (f.keywords.length ? f.keywords : tokenize(s.text).map(cleanWord).filter((w) => w.length >= 3)).map((k) => short(k, 16)).slice(0, 8);
  const own: string[] = Array.isArray(s.params.items) ? s.params.items : [], list = own.length >= 2 ? own : f.list.length >= 2 ? f.list : s.text.split(/[,;।.]/).map((x) => x.trim()).filter((x) => x.length > 2);
  const num = f.numbers.find((n) => n.unit === '%') ?? f.numbers[0], years = [...f.years].sort((a, b) => a.year - b.year).slice(0, 4);
  const c: MpCopy = {
    head: lines.length ? lines : [short(s.text, 16)], eye: cat, sub: rest || kws.slice(0, 3).join(' · ') || cat, steps: list.slice(0, 5).map((x) => short(x, 30)), quote: short(f.quotes[0] ?? s.text, 110),
    title: short(kws[0] ?? title ?? cat, 24), labels: kws.length ? kws.slice(0, 6) : [cat], words: kws.slice(0, 8).map((k) => (/^[\x00-\x7f]+$/.test(k) ? k.toUpperCase() : k)), lower: [short(kws[0] ?? title ?? cat, 22), cat], brand: short(title || cat, 14)
  };
  if (num) c.stat = { label: short(num.label || kws[0] || cat, 24), prefix: num.prefix ?? '', value: num.value, suffix: num.suffix ?? '' };
  if (years.length >= 2) { c.years = years.map((y) => String(y.year)); c.steps = years.map((y) => short(y.label.replace(/^(में|को|से|तक|in|on|by|of)\s+/i, '') || String(y.year), 26)); }
  const m = s.text.split(/\s*(?:बनाम|\bvs\.?\b|versus|जबकि|\bbut\b)\s*/i); if (m.length >= 2) c.versus = [short(m[0], 18), short(m.slice(1).join(' '), 18)];
  return c;
}

const PICKABLE = (names: string[]): number[] => { const cat = catalogue(); const out: number[] = []; for (const n of names) { const a = cat.get(n); if (a) out.push(...a.filter((_, i) => i % 7 === 0)); } return out; };
const _pool = new Map<string, number[]>();
const pool = (g: string) => { let p = _pool.get(g); if (!p) _pool.set(g, (p = PICKABLE(GROUPS[g] ?? []))); return p; };
const nameOf = (i: number) => { for (const [n, a] of catalogue()) if (a.length && i >= a[0] && i <= a[a.length - 1] && a.includes(i)) return n; return ''; };

export function themePal(t: MpTheme): Pal6 { return [t.bg0, t.bg1, t.acc, t.acc2, t.ink, 1]; }
const TPL_PALS: Pal6[] = [['#070b14', '#0f1b33', '#4f8cff', '#7be0ff', '#ffffff', 1], ['#0b0805', '#24120a', '#ff7a1a', '#ffc24d', '#ffffff', 1], ['#04100c', '#0a2a1f', '#2ee59d', '#b6ffd9', '#ffffff', 1], ['#0d0716', '#25104a', '#9b6bff', '#ff7ad9', '#ffffff', 1]];

/** can this scene supply the data the group needs? (no fake numbers / years / steps) */
function feasible(group: string, s: SceneSpec): boolean {
  const f = extractFacts(s.text);
  if (group === 'stat') return f.numbers.length >= 1;
  if (group === 'steps') return Math.max(f.list.length, (s.params.items?.length ?? 0), s.text.split(/[,;।.]/).filter((x) => x.trim().length > 2).length) >= 3;
  if (group === 'time') return f.years.length >= 2;
  return true;
}

/** MpParams for one scene (used by auto mode and by the "AI: naya template" button). `avoid` = recently used template numbers */
export function mpFor(s: SceneSpec, o: Pick<MpAutoOpts, 'category' | 'theme' | 'palette' | 'seed' | 'title'>, avoid: number[] = [], salt = 0): MpParams | null {
  const groups = (GROUP_OF[s.params?.orig?.block ?? s.block] ?? ['typo', 'fluid']).filter((g) => feasible(g, s));
  for (const g of groups) {
    const p = pool(g).filter((i) => !avoid.includes(i)); if (!p.length) continue;
    const idx = p[Math.floor(hash(`${o.seed}|${s.id}|${s.text}|${g}|${salt}`) * p.length)];
    const pal = o.palette === 'theme' ? themePal(o.theme) : TPL_PALS[Math.floor(hash(`${o.seed}${idx}`) * TPL_PALS.length)];
    return { idx, copy: copyFor(s, o.category, o.title), pal, name: nameOf(idx), synthetic: false };
  }
  return null;
}

/** swap some scenes' native block for an AI-edited Motion Pro template (scene keeps `orig`, so the user can switch back) */
export function applyMotionPro(scenes: SceneSpec[], o: MpAutoOpts): SceneSpec[] {
  if (o.mix === 'off') return scenes;
  const rate = o.mix === 'max' ? 0.85 : 0.4, used: number[] = [];
  return scenes.map((s, i) => {
    if (s.block === 'asset' || s.block === 'end' || s.end - s.start < 2.4) return s;
    if (s.block === 'title' && o.mix !== 'max') return s;
    // data scenes keep the app's own charts: they show the script's real numbers
    if (['bars', 'bars3d', 'donut', 'donut3d', 'coins3d', 'chartcard', 'line', 'candles'].includes(s.block)) return s;
    if (hash(`${o.seed}|mix|${i}|${s.text}`) >= rate) return s;
    const mp = mpFor(s, o, used.slice(-6)); if (!mp) return s; used.push(mp.idx);
    return { ...s, block: 'asset', params: { assetId: mpId(mp), name: `Motion Pro #${mp.idx} · ${mp.name}`, fallback: s.text, mp, orig: { block: s.block, params: s.params } }, reason: `Motion Pro library: #${mp.idx} ${mp.name} (AI ne text edit kiya)` };
  });
}
