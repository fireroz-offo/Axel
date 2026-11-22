// Template curator: for every scene it gathers 8-10 candidate templates from the original 171K catalogue, renders each one
// in the real HTML runtime (with THIS scene's headline, numbers and duration), measures how well it fits, and keeps the best.
// Pure scoring + a thin async driver, so the logic is unit-tested in Node with a fake inspector.
import type { SceneSpec } from '../brain/plan';
import type { AudioInfo } from '../audio/analyze';
import { candidateMotions, familyOf, rangeOf } from './selector';

/** What MotionProRuntime.inspect() returns for one rendered template. */
export interface TemplateMetrics {
  id: number; tn: string; cat: string;
  titleSlot: boolean; subSlot: boolean; counter: number; bars: number; items: number; labels: number;
  animCount: number; entranceEnd: number; ambient: number; spanning: number;
  latinLeak: number; otherDeva: number; otherDigits: number; otherSymbols: number; textNodes: number;
  titleOverflow: boolean; subOverflow: boolean; titleFont: number; titleH: number; clipped: number; overlap: number;
  error?: string;
}
export interface InspectOptions {
  id: number; seed: number; width: number; height: number; duration: number; title: string; subtitle: string; category?: string;
  data?: Record<string, unknown>; accent?: string; accent2?: string; bg0?: string; bg1?: string; ink?: string;
}
export interface PixelMetrics { detail: number; coverage: number; error?: string }
export interface Inspector { inspect(o: InspectOptions): Promise<TemplateMetrics>; inspectPixels?(o: InspectOptions): Promise<PixelMetrics> }

export type Tempo = 'fast' | 'normal' | 'slow';
export interface SceneNeeds { currency: boolean; valueDigits: number; dur: number; hindi: boolean; wantsSub: boolean; counter: boolean; bars: number; items: number; tempo: Tempo }

const DEVA = /[ऀ-ॿ]/g, LATIN = /[A-Za-z]/g;
export const isHindi = (text: string) => { const d = (text.match(DEVA) ?? []).length, l = (text.match(LATIN) ?? []).length; return d > 0 && d >= l; };

/** Speech pace + loudness of a scene -> how busy / fast the motion graphic should be. */
export function sceneTempo(s: Pick<SceneSpec, 'start' | 'end' | 'text' | 'words'>, info: AudioInfo | null): { tempo: Tempo; wps: number; energy: number } {
  const dur = Math.max(0.5, s.end - s.start), words = s.words?.length || s.text.trim().split(/\s+/).filter(Boolean).length, wps = words / dur;
  let energy = 1;
  if (info && info.env.length) {
    const a = Math.max(0, Math.floor(s.start / info.hop)), b = Math.min(info.env.length, Math.ceil(s.end / info.hop));
    let sum = 0, n = 0; for (let i = a; i < b; i++) { sum += info.env[i]; n++; }
    let all = 0, m = 0; for (let i = 0; i < info.env.length; i += 3) { if (info.env[i] >= info.threshold) { all += info.env[i]; m++; } }
    if (n && m && all > 0) energy = (sum / n) / (all / m);
  }
  const tempo: Tempo = wps >= 3.2 || energy >= 1.3 ? 'fast' : wps <= 1.8 && energy <= 1.05 ? 'slow' : 'normal';
  return { tempo, wps, energy };
}

// ---------- headline ----------
const LEAD = /^(क्या आप जानते हैं कि|क्या आपको पता है कि|क्या आप जानते हैं|क्या आपको पता है|do you know that|did you know that|और फिर|और|लेकिन|मगर|तो|फिर|पर|कि|यानी|इसलिए|क्योंकि|जबकि|अब|but|and|so|then|because)\s+/i;
const TRAIL = new Set(['का', 'की', 'के', 'में', 'से', 'को', 'ने', 'है', 'हैं', 'था', 'थे', 'थी', 'पर', 'और', 'कि', 'तो', 'तक', 'भी', 'ही', 'सबसे', 'बहुत', 'एक', 'यह', 'वह', 'इस', 'उस', 'a', 'an', 'the', 'of', 'to', 'in', 'is', 'are', 'and']);
const SPLIT_WORDS = /\s+(?:कि|और|लेकिन|मगर|जबकि|अगर|यदि|जब|तब|क्योंकि|but|because|while|if|when)\s+/i;
const isYear = (w: string) => { const d = w.replace(/\D/g, ''); return d.length === 4 && /^(19|20)/.test(d); };
/** A short, punchy on-screen headline: a real clause of the sentence (number window for data sentences), no dangling particles. */
export function smartHeadline(text: string, maxWords = 7): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const trim = (w: string[]) => { while (w.length > 2 && TRAIL.has(w[w.length - 1].toLowerCase())) w.pop(); return w; };
  const finish = (w: string[]) => { w = trim(w); while (w.length > 2 && w.join(' ').length > 44) w = trim(w.slice(0, -1)); const t = w.join(' '); return t.length >= 2 ? t : clean.split(' ').slice(0, 4).join(' '); }; // cut at a word boundary, never mid-word
  const clauses = clean.split(/\s*[,;:।.!?—–|]\s+|\s*[,;:।!?—–|]\s*$/).map((c) => c.trim().replace(LEAD, '')).filter((c) => c.length > 1);
  // 1) data sentence -> window around the most meaningful number (a year is less interesting than "3.9 trillion" / "7%")
  const numClause = clauses.find((c) => /\d/.test(c));
  if (numClause) {
    const w = numClause.split(' '), k = w.findIndex((x) => /\d/.test(x) && !isYear(x)), at = k >= 0 ? k : w.findIndex((x) => /\d/.test(x));
    if (w.length > maxWords + 1) { const a = Math.max(0, Math.min(at - 3, w.length - maxWords)); const win = w.slice(a, a + maxWords); while (win.length > 2 && TRAIL.has(win[0].toLowerCase())) win.shift(); return finish(win); }
    return finish(w);
  }
  // 2) first clause; if it is long, split at a conjunction and take the first part that is short enough
  const pick = clauses[0] ?? clean;
  let w = pick.split(' ').filter(Boolean);
  if (w.length > maxWords + 2) {
    const parts = pick.split(SPLIT_WORDS).map((x) => x.trim().replace(LEAD, '')).filter((x) => x.split(' ').length >= 2);
    const fit = parts.find((x) => x.split(' ').length <= maxWords);
    w = (fit ?? parts[0] ?? pick).split(' ').filter(Boolean);
    if (w.length > maxWords) w = w.slice(0, maxWords);
  }
  return finish(w);
}

// ---------- scoring ----------
export function needsOf(s: SceneSpec, tempo: Tempo, captions: boolean): SceneNeeds {
  const p = s.params ?? {};
  const vals = Array.isArray(p.values) ? p.values.filter((x: unknown) => Number.isFinite(Number(x))).length : 0;
  const items = Array.isArray(p.items) ? p.items.length : Array.isArray(p.events) ? p.events.length : 0;
  return {
    currency: /[₹$€£]|रुपय|डॉलर|dollar|rupee|euro|यूरो/i.test(s.text), valueDigits: String(p.value ?? '').replace(/\D/g, '').length,
    dur: Math.max(1, s.end - s.start), hindi: isHindi(s.text), wantsSub: !captions,
    counter: s.block === 'stat' && Number.isFinite(Number(p.value)), bars: ['bars', 'bars3d', 'coins3d', 'chartcard'].includes(s.block) ? vals : 0, items, tempo
  };
}

export function scoreTemplate(m: TemplateMetrics, n: SceneNeeds): { score: number; why: string[] } {
  const why: string[] = []; let sc = 100; const add = (v: number, w: string) => { sc += v; if (v) why.push(`${v > 0 ? '+' : ''}${Math.round(v)} ${w}`); };
  if (m.error) return { score: -999, why: ['inspect error: ' + m.error] };
  add(m.titleSlot ? 12 : -12, m.titleSlot ? 'real title slot' : 'no title slot (overlay)');
  if (n.wantsSub) add(m.subSlot ? 4 : 0, 'subtitle slot');
  if (m.titleOverflow) add(-30, 'title overflows');
  if (m.subOverflow) add(-12, 'subtitle overflows');
  if (m.overlap) add(-Math.min(36, m.overlap * 18), 'text overlaps title/subtitle');
  if (m.clipped) add(-Math.min(15, m.clipped * 5), 'text outside frame');
  if (m.titleFont && m.titleFont < 14) add(-10, 'title font too small');
  if (m.titleH > 0.34) add(-8, 'title too tall');
  add(-Math.min(n.hindi ? 30 : 8, m.latinLeak * (n.hindi ? 0.9 : 0.25)), 'English placeholder text');
  if (!n.counter && n.bars < 2) add(-Math.min(20, (m.otherDigits ?? 0) * 0.6), 'unrelated demo numbers');
  else if (n.counter) add(-Math.min(14, Math.max(0, (m.otherDigits ?? 0) - n.valueDigits - 1) * 0.6), 'extra demo numbers');
  if (!n.currency && m.otherSymbols) add(-Math.min(36, m.otherSymbols * 18), 'fake currency amounts');
  if (!(n.bars >= 2 || n.items >= 2)) add(-Math.min(12, (m.otherDeva ?? 0) * 0.4), 'unrelated placeholder words');
  if (n.counter) add(m.counter > 0 ? 18 : -22, m.counter > 0 ? 'number slot' : 'no number slot for a stat scene');
  if (n.bars >= 2) add(m.bars >= Math.min(n.bars, 3) ? 14 : -14, m.bars >= Math.min(n.bars, 3) ? 'bar slots' : 'no bar slots');
  if (n.items >= 2) add(m.items >= Math.min(n.items, 3) ? 12 : -8, m.items >= Math.min(n.items, 3) ? 'list slots' : 'no list slots');
  // does the entrance finish while the scene is still on screen?
  const r = m.entranceEnd / n.dur;
  add(r <= 0.6 ? 10 : r <= 0.9 ? 4 : r <= 1.1 ? -6 : -Math.min(25, (r - 1.1) * 30), r <= 0.9 ? 'animation fits scene length' : 'animation too slow for scene length');
  if (n.dur > 6) add(m.ambient > 0 ? 5 : -3, 'keeps moving in a long scene');
  add(Math.min(8, m.animCount / 4), 'richness');
  if (n.tempo === 'fast') { if (r <= 0.4) add(6, 'fast voice -> quick entrance'); else if (r > 0.7) add(-6, 'fast voice but slow entrance'); if (m.animCount >= 25) add(3, 'energetic'); }
  if (n.tempo === 'slow') { if (r >= 0.3 && r <= 0.7) add(4, 'slow voice -> calm entrance'); if (m.animCount > 45) add(-4, 'too busy for slow voice'); }
  return { score: sc, why };
}

/** Visual richness from the rendered pixels: a template that is "mostly an empty gradient" at the 80% mark is a bad pick. */
export function pixelBonus(px: PixelMetrics | undefined): { v: number; why: string } {
  if (!px || px.error) return { v: 0, why: '' };
  const v = (Math.max(4, Math.min(20, px.detail)) - 12) * 1.5; // detail 6 -> -9, 12 -> 0, 20 -> +12
  return { v, why: v < -4 ? 'looks nearly empty on screen' : v > 4 ? 'visually rich on screen' : '' };
}

export interface CurateOptions {
  inspector: Inspector; width: number; height: number; theme: { acc: string; acc2: string; bg0: string; bg1: string; ink: string };
  info?: AudioInfo | null; captions: boolean; candidates?: number; pixelTop?: number; category?: string; seed?: string;
  onProgress?: (done: number, total: number, msg: string) => void; signal?: AbortSignal;
}
interface Scored { id: number; score: number; why: string[]; tn: string; m: TemplateMetrics }

const yieldUi = () => new Promise<void>((r) => setTimeout(r, 0));

/**
 * Picks the best template for every scene. Returns new scenes whose params carry:
 * motionId (chosen), candidates (ranked ids, best first), headline, sub, curation {score, why, tempo}.
 */
export async function curateScenes(scenes: SceneSpec[], o: CurateOptions): Promise<SceneSpec[]> {
  const out: SceneSpec[] = [], usedIds = new Set<number>(), recentTn: string[] = [], tnCount = new Map<string, number>();
  const n = Math.max(3, Math.min(12, o.candidates ?? 10));
  for (let si = 0; si < scenes.length; si++) {
    if (o.signal?.aborted) throw new Error('Curation cancel ho gaya.');
    const s = scenes[si], p = s.params ?? {};
    o.onProgress?.(si, scenes.length, `Scene ${si + 1}/${scenes.length}: templates test ho rahe hain`);
    const t = sceneTempo(s, o.info ?? null), need = needsOf(s, t.tempo, o.captions);
    const pt = typeof p.text === 'string' ? p.text.trim() : '';
    const projectTitle = s.block === 'title' && pt && !s.text.startsWith(pt.replace(/…$/, '')) ? pt : ''; // a real project title, not just the sentence again
    const headline = String(projectTitle || smartHeadline(s.text)); // always a real clause of the sentence (planner `title` can be a bare keyword pair)
    const sub = String(p.sub || s.text).slice(0, 180);
    const seed = `${o.seed ?? ''}:${s.id}`;
    const dataScene = need.counter || need.bars >= 2 || need.items >= 3; // data scenes need a template with real number/bar/list slots: search wider
    const ids = candidateMotions(s.text, s.block, o.category ?? 'other', seed, dataScene ? n * 2 : n);
    if (typeof p.motionId === 'number' && !ids.includes(p.motionId)) ids.push(p.motionId); // keep the planner's pick in the race
    const run = async (id: number, title: string): Promise<Scored> => {
      const m = await o.inspector.inspect({
        id, seed: Math.abs((id * 2654435761 + s.id * 2246822519) | 0) % 999999, width: o.width, height: o.height, duration: need.dur,
        title, subtitle: o.captions ? '' : sub, category: String(p.motionFilter || familyOf(s.text, s.block)), data: p,
        accent: o.theme.acc, accent2: o.theme.acc2, bg0: o.theme.bg0, bg1: o.theme.bg1, ink: o.theme.ink
      });
      const r = scoreTemplate(m, need); return { id, score: r.score, why: r.why, tn: m.tn, m };
    };
    const scored: Scored[] = [];
    for (const id of ids) { try { scored.push(await run(id, headline)); } catch (e) { /* template that cannot be inspected is simply skipped */ } if (scored.length % 4 === 0) await yieldUi(); }
    if (!scored.length) { out.push(s); continue; }
    // diversity across the video: never repeat a template, avoid the same style back-to-back
    const adj = (c: Scored) => c.score - (usedIds.has(c.id) ? 50 : 0) - (recentTn[recentTn.length - 1] === c.tn ? 10 : 0) - 5 * recentTn.slice(-4).filter((x) => x === c.tn).length - 2 * (tnCount.get(c.tn) ?? 0);
    scored.sort((a, b) => adj(b) - adj(a));
    let best = scored[0], title = headline;
    // second pass on the few leaders: render real pixels and reject "empty" templates
    if (o.inspector.inspectPixels) {
      const top = scored.slice(0, Math.max(0, o.pixelTop ?? 3));
      for (const c of top) {
        try {
          const px = await o.inspector.inspectPixels({ id: c.id, seed: Math.abs((c.id * 2654435761 + s.id * 2246822519) | 0) % 999999, width: o.width, height: o.height, duration: need.dur, title: headline, subtitle: o.captions ? '' : sub, category: String(p.motionFilter || ''), data: p, accent: o.theme.acc, accent2: o.theme.acc2, bg0: o.theme.bg0, bg1: o.theme.bg1, ink: o.theme.ink });
          const b = pixelBonus(px); c.score += b.v; if (b.why) c.why.push(`${b.v > 0 ? '+' : ''}${Math.round(b.v)} ${b.why}`);
        } catch { /* keep DOM score */ }
      }
      scored.sort((a, b) => adj(b) - adj(a));
      best = scored[0];
    }
    if (best.m.titleOverflow && headline.split(' ').length > 3) { // shorten the headline once if it did not fit this template
      const short = smartHeadline(headline, 3);
      try { const again = await run(best.id, short); if (!again.m.titleOverflow && again.score > best.score) { best = again; title = short; } } catch { /* keep long title */ }
    }
    usedIds.add(best.id); recentTn.push(best.tn); tnCount.set(best.tn, (tnCount.get(best.tn) ?? 0) + 1);
    out.push({
      ...s,
      params: {
        ...p, motionId: best.id, motionFilter: best.tn || rangeOf(best.id), headline: title, sub,
        candidates: scored.map((c) => c.id), candidateScores: scored.map((c) => Math.round(c.score)),
        curation: { score: Math.round(best.score), why: best.why, tempo: t.tempo, wps: +t.wps.toFixed(2), energy: +t.energy.toFixed(2), tested: scored.length }
      }
    });
  }
  o.onProgress?.(scenes.length, scenes.length, 'Best templates chun liye');
  return out;
}
