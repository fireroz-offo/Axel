// Motion Pro library (171,000 templates) as an *editable* motion-graphics source for the AI director.
//  * spec(i)  -> template i (deterministic)           * copy  -> the AI swaps every visible text/number for the script's own
//  * palette  -> the app theme colours (consistent look) * buildDef -> a normal AssetDef, so the sandboxed asset runtime renders it (frame = f(time)).
import { makeMotionPro } from './gen';
import MOTION_CSS from './motionpro.css?raw';
import type { AssetDef } from '../assets/store';

export const MP_TOTAL = 171000;
export type Pal6 = [string, string, string, string, string, 0 | 1];
export interface MpCopy {
  head?: string[]; eye?: string; sub?: string; stat?: { label: string; prefix: string; value: number; suffix: string };
  steps?: string[]; versus?: [string, string]; quote?: string; title?: string; labels?: string[]; years?: string[];
  lower?: [string, string]; words?: string[]; brand?: string;
}
/** what is stored inside a scene (params.mp): enough to rebuild the exact same template + edits at any time */
export interface MpParams { idx: number; copy: MpCopy; pal?: Pal6; synthetic?: boolean; name?: string }

let _mp: ReturnType<typeof makeMotionPro> | null = null;
const mp = () => (_mp ??= makeMotionPro());
export const typeName = (i: number): string => { const s = mp().spec(i); return s.tn || mp().TYPES[s.t]; };

/** name -> template numbers (built once, ~0.2 s) */
let _cat: Map<string, number[]> | null = null;
export function catalogue(): Map<string, number[]> {
  if (_cat) return _cat; const m = mp(), by = new Map<string, number[]>();
  for (let i = 1; i <= MP_TOTAL; i++) { const s = m.spec(i), k = s.tn || m.TYPES[s.t]; let a = by.get(k); if (!a) by.set(k, (a = [])); a.push(i); }
  return (_cat = by);
}

const cyc = <T,>(a: T[], n: number): T[] => { if (!a.length) return a; const o: T[] = []; for (let i = 0; i < Math.max(n, a.length); i++) o.push(a[i % a.length]); return o; };
/** run fn with the template's copy arrays temporarily replaced by the AI's text (restored afterwards: the generator stays untouched) */
function withCopy<T>(c: MpCopy, fn: () => T): T {
  const k = mp().copy, saved: Record<string, any[]> = {};
  const set = (name: string, vals: any[] | undefined) => { if (!vals || !vals.length) return; saved[name] = (k as any)[name].slice(); (k as any)[name].splice(0, (k as any)[name].length, ...vals); };
  const steps = c.steps && c.steps.length ? cyc(c.steps, 6) : undefined, labels = c.labels && c.labels.length ? cyc(c.labels, 8) : undefined;
  set('HEAD', c.head && c.head.length ? [c.head] : undefined); set('EYE', c.eye ? [c.eye] : undefined); set('SUBS', c.sub ? [c.sub] : undefined);
  set('STATS', c.stat ? [[c.stat.label, c.stat.prefix, c.stat.value, c.stat.suffix]] : undefined); set('STEPS', c.years && c.years.length >= 2 && c.steps ? c.steps.slice(0, 4) : steps); set('VSP', c.versus ? [c.versus] : undefined);
  set('QUO', c.quote ? [c.quote] : undefined); set('TITLES', c.title ? [c.title] : undefined); set('BN', labels); set('WD', c.words && c.words.length ? c.words : labels);
  set('YEARS', c.years && c.years.length >= 2 ? cyc(c.years, 7) : undefined); set('TLYEARS', c.years && c.years.length >= 2 ? c.years.slice(0, 4) : undefined); set('LTS', c.lower ? [c.lower] : undefined);
  set('C3_WORDS', c.words && c.words.length ? c.words : labels); set('C3_SUBS', c.sub ? [c.sub] : undefined);
  set('TOP', c.head && c.head.length ? [{ t: c.head.join(' '), l: cyc(steps ?? [c.sub || c.head.join(' ')], 4).slice(0, 4) }] : undefined); set('BR', c.brand ? [c.brand] : undefined);
  try { return fn(); } finally { for (const [n, v] of Object.entries(saved)) (k as any)[n].splice(0, (k as any)[n].length, ...v); }
}

/** the stage markup + duration for template `p.idx` with the AI's edits applied */
export function buildStage(p: MpParams): { html: string; T: number; name: string } {
  const m = mp(); m.setSeed(0);
  return withCopy(p.copy, () => {
    const s = { ...m.spec(Math.max(1, Math.min(MP_TOTAL, Math.round(p.idx)))) };
    if (p.pal) s.pal = p.pal; s.fxs = false; // never print the original "Fireroz Media" slate on the user's video
    return { html: m.stage(s).replace('<div class=stg ', '<div class=stg data-nopill=1 '), T: s.T, name: s.tn || m.TYPES[s.t] };
  });
}
// the original adds a template-name tag and a brand slate; the scene's own exit is replaced by the app's transitions
const OVERRIDE = '.tm,.sl,.stg[data-nopill] .pill{display:none!important}.play .scene{animation:none!important}html,body{margin:0;height:100%;background:#000;overflow:hidden}.stg{position:fixed;inset:0}';
export function buildDoc(p: MpParams): { html: string; T: number; name: string } {
  const st = buildStage(p);
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="divriz-duration" content="${st.T}"><title>Motion Pro ${p.idx}</title><style>${MOTION_CSS}${OVERRIDE}</style></head><body>${st.html}<script>document.querySelector('.stg').classList.add('play')<\/script></body></html>`;
  return { html, T: st.T, name: st.name };
}
const fnv = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
export const mpId = (p: MpParams) => `mp_${p.idx}_${fnv(JSON.stringify([p.copy, p.pal]))}`;
const _defs = new Map<string, AssetDef>();
/** a normal AssetDef (duration 0 = never loops: the template plays once and holds its last frame) */
export function mpDef(p: MpParams): AssetDef {
  const id = mpId(p), hit = _defs.get(id); if (hit) return hit;
  const d = buildDoc(p), def: AssetDef = { id, name: `Motion Pro #${p.idx} · ${d.name}`, kind: 'html', html: d.html, tags: [], category: 'other', duration: 0, libs: [], hasSeek: false, warnings: [], size: d.html.length, createdAt: 0, enabled: true };
  if (_defs.size > 40) _defs.delete(_defs.keys().next().value as string); _defs.set(id, def); return def;
}
export const mpInfo = (i: number) => { const s = mp().spec(i); return { i, name: s.tn || mp().TYPES[s.t], cat: s.cat as string, T: s.T as number }; };
export const mpCats = () => (mp().CATS as string[]).slice();
