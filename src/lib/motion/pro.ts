// "Pro" motion layer: layered compositions like a motion designer (depth, rack focus, glass UI, glow, drawn-on lines, ribbons, springs).
// Every function is a pure f(time) so preview and MP4 export give identical frames. No images are downloaded: subjects are drawn procedurally.
import type { SceneSpec } from '../brain/plan';
import type { Theme, Area } from './engine';
type C = CanvasRenderingContext2D;
type Blk = (c: C, a: Area, s: SceneSpec, lt: number, dur: number, th: Theme) => void;

export const PRE = 0.35;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, d: number) => clamp((t - a) / d);
const out = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const inout = (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
/** damped spring 0 -> 1 with overshoot (pop-in) */
const spring = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(11 * x));
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; };
const FONT_W = (c: C, th: Theme, px: number, w = 700) => { c.font = `${w} ${Math.max(8, Math.round(px))}px ${th.font}`; };

interface Pal { g1: string; g2: string; line: string; glow: string; ribbon: string; stone: [string, string, string] }
const palette = (th: Theme): Pal => th.name === 'documentary'
  ? { g1: '#c08a3e', g2: '#3d2710', line: 'rgba(255,226,170,0.65)', glow: '#e0a050', ribbon: '#d9772b', stone: ['#4b4944', '#d9d4c7', '#5d5a54'] }
  : { g1: '#3f7bdc', g2: '#10285c', line: 'rgba(190,215,255,0.7)', glow: '#5aa2ff', ribbon: '#ff9a3c', stone: ['#44464d', '#d5d8df', '#5a5d66'] };

let _off: any = null, _offK = 0;
/** Cheap depth-of-field: draw the layer small on an offscreen canvas, then scale it back up (bilinear = blur). Much faster than ctx.filter on phones. */
function blurred(c: C, px: number, fn: (cc: C) => void) {
  if (px < 0.8) { fn(c); return; }
  const k = Math.max(2, Math.min(10, Math.round(px * 0.9))), cv = c.canvas as any, W = cv.width, H = cv.height, w = Math.ceil(W / k), h = Math.ceil(H / k);
  if (!_off || _off.width !== w || _off.height !== h) { _off = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h }); }
  const o = _off.getContext('2d') as C, m = c.getTransform();
  o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, w, h); o.setTransform(m.a / k, m.b / k, m.c / k, m.d / k, m.e / k, m.f / k);
  fn(o); o.setTransform(1, 0, 0, 1, 0, 0);
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = true; (c as any).imageSmoothingQuality = 'high'; c.drawImage(_off, 0, 0, w, h, 0, 0, w * k, h * k); c.restore();
}
function rrect(c: C, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath(); c.moveTo(x + rad, y); c.arcTo(x + w, y, x + w, y + h, rad); c.arcTo(x + w, y + h, x, y + h, rad); c.arcTo(x, y + h, x, y, rad); c.arcTo(x, y, x + w, y, rad); c.closePath();
}
const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');

/** time (s, relative to scene start) when the voiceover says a word of `label`; fallback when not found */
export function spokenAt(s: SceneSpec, label: string, fallback: number): number {
  const toks = label.split(/\s+/).map((x) => x.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase()).filter((x) => x.length >= 2);
  for (const tk of toks) { const w = s.words.find((x) => x.w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase().startsWith(tk.slice(0, Math.max(2, tk.length - 1)))); if (w) return Math.max(0, w.t0 - s.start - 0.05 + PRE); }
  return fallback;
}

// ---------------------------------------------------------------- materials / effects
function stoneFill(c: C, x0: number, x1: number, p: Pal): CanvasGradient {
  const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, p.stone[0]); g.addColorStop(0.45, p.stone[1]); g.addColorStop(1, p.stone[2]); return g;
}
function glassPill(c: C, th: Theme, p: Pal, cx: number, cy: number, text: string, px: number, alpha: number, scale: number, maxW = 1e9) {
  if (alpha <= 0.01 || scale <= 0.01) return;
  FONT_W(c, th, px, 600);
  let tw = c.measureText(text).width; if (tw + px * 1.7 > maxW) { px *= maxW / (tw + px * 1.7); FONT_W(c, th, px, 600); tw = c.measureText(text).width; }
  const w = tw + px * 1.7, h = px * 1.95;
  const half = (w * scale) / 2, lo = half + px * 0.3, hi = maxW < 1e8 ? (c.canvas.width / Math.max(0.01, c.getTransform().a)) - half - px * 0.3 : 1e9; cx = Math.min(Math.max(cx, lo), Math.max(lo, hi));
  c.save(); c.globalAlpha *= clamp(alpha); c.translate(cx, cy); c.scale(scale, scale);
  c.shadowColor = p.glow; c.shadowBlur = px * 0.9; c.shadowOffsetY = px * 0.15;
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, p.g1); g.addColorStop(1, p.g2);
  rrect(c, -w / 2, -h / 2, w, h, h / 2); c.fillStyle = g; c.fill(); c.shadowBlur = 0; c.shadowColor = 'transparent';
  const hl = c.createLinearGradient(0, -h / 2, 0, 0); hl.addColorStop(0, 'rgba(255,255,255,0.32)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  rrect(c, -w / 2 + 2, -h / 2 + 2, w - 4, h / 2 - 2, h / 2); c.fillStyle = hl; c.fill();
  rrect(c, -w / 2, -h / 2, w, h, h / 2); c.strokeStyle = p.line; c.lineWidth = Math.max(1, px * 0.05); c.stroke();
  c.fillStyle = th.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 0, px * 0.04);
  c.restore();
}
/** flowing translucent band (the orange ribbon in the reference) */
function ribbon(c: C, w: number, h: number, lt: number, p: Pal, alpha: number, yc: number, thick: number, tilt: number) {
  if (alpha <= 0.01) return;
  const N = 48, top: number[][] = [], bot: number[][] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N, x = -w * 0.1 + u * w * 1.2, wave = Math.sin(u * 5.2 + lt * 0.9) * thick * 0.55 + Math.sin(u * 2.3 - lt * 0.5) * thick * 0.35;
    const y = yc + (u - 0.5) * tilt + wave, th2 = thick * (0.65 + 0.35 * Math.sin(u * 3 + lt * 0.7));
    top.push([x, y - th2 / 2]); bot.push([x, y + th2 / 2]);
  }
  const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, p.ribbon + '00'); g.addColorStop(0.25, p.ribbon + 'dd'); g.addColorStop(0.7, p.ribbon + 'aa'); g.addColorStop(1, p.ribbon + '00');
  c.save(); c.globalAlpha *= alpha; c.beginPath(); top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); for (let i = N; i >= 0; i--) c.lineTo(bot[i][0], bot[i][1]); c.closePath(); c.fillStyle = g; c.fill();
  c.globalCompositeOperation = 'lighter'; c.lineWidth = Math.max(1, thick * 0.03); c.strokeStyle = 'rgba(255,230,190,0.5)'; c.beginPath(); top.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.restore();
}
function dust(c: C, w: number, h: number, lt: number, seed: number, n: number, col: string) {
  c.save(); c.fillStyle = col;
  for (let i = 0; i < n; i++) { const r1 = hash('d' + seed + i), r2 = hash('e' + seed + i), r3 = hash('f' + seed + i); const x = ((r1 * w + lt * (6 + r3 * 18)) % w), y = (r2 * h - lt * (4 + r3 * 10) + h * 2) % h; c.globalAlpha = 0.15 + 0.35 * Math.abs(Math.sin(lt * (0.8 + r3) + i)); c.beginPath(); c.arc(x, y, 0.8 + r3 * 2.2, 0, 7); c.fill(); }
  c.restore();
}
function glowOrb(c: C, x: number, y: number, r: number, col: string, a: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col + Math.round(clamp(a) * 255).toString(16).padStart(2, '0')); g.addColorStop(1, col + '00'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}

// ---------------------------------------------------------------- procedural subjects (drawn with base centre at (cx, by), height H)
export type Subject = 'robot' | 'temple' | 'coins' | 'person' | 'skyline' | 'chip';
export const SUBJECTS: Subject[] = ['robot', 'temple', 'coins', 'person', 'skyline', 'chip'];
const RULES: Array<[RegExp, Subject]> = [
  [/पैसा|पैसे|निवेश|बैंक|ब्याज|रुपय|धन|मुद्रा|कमाई|बचत|money|invest|bank|interest|coin|profit|wealth|income|saving|₹|\$/, 'coins'],
  [/इतिहास|प्राचीन|साम्राज्य|मंदिर|सभ्यता|राजा|युद्ध|history|ancient|empire|temple|roman|greek|war|civiliz|king/, 'temple'],
  [/कंपनी|बाज़ार|बाजार|व्यापार|शहर|कारोबार|उद्योग|company|market|business|city|startup|industry|economy|अर्थव्यवस्था/, 'skyline'],
  [/\bai\b|रोबोट|एआई|मशीन|robot|machine|automat|artificial/, 'robot'],
  [/तकनीक|कंप्यूटर|डेटा|इंटरनेट|सॉफ़्टवेयर|चिप|मोबाइल|tech|computer|data|internet|software|chip|digital|device|processor/, 'chip'],
  [/इंसान|लोग|मन|दिमाग|व्यवहार|भावना|मनोविज्ञान|human|people|mind|brain|behavio|emotion|psycholog|person/, 'person']
];
const POOL: Record<string, Subject[]> = { finance: ['coins', 'skyline', 'person'], business: ['skyline', 'coins', 'person'], technology: ['chip', 'robot', 'skyline'], ai: ['robot', 'chip', 'person'], history: ['temple', 'person', 'skyline'], psychology: ['person', 'robot', 'chip'], health: ['person', 'chip', 'robot'], science: ['chip', 'robot', 'person'], space: ['chip', 'robot', 'skyline'], education: ['person', 'robot', 'chip'] };
/** Subjects for a scene, best first: what the sentence is about, then what the category suggests. */
export function subjectsFor(text: string, category = 'other'): Subject[] {
  const t = text.toLowerCase(), out: Subject[] = [];
  for (const [re, k] of RULES) if (re.test(t) && !out.includes(k)) out.push(k);
  for (const k of POOL[category] ?? ['robot', 'chip', 'person']) if (!out.includes(k)) out.push(k);
  return out;
}
export const pickSubject = (text: string, category = 'other', avoid?: Subject): Subject => { const l = subjectsFor(text, category); return l.find((x) => x !== avoid) ?? l[0]; };

function drawSubject(c: C, kind: Subject, th: Theme, cx: number, by: number, H: number, lt: number) {
  const p = palette(th), W = H * 0.62;
  c.save(); c.translate(cx, by);
  switch (kind) {
    case 'robot': {
      const bw = W * 0.5;
      // legs, torso, arms (light grey stone-like material with rim light)
      c.fillStyle = stoneFill(c, -bw, bw, p);
      c.beginPath(); c.moveTo(-bw * 0.55, -H * 0.5); c.lineTo(-bw * 0.7, 0); c.lineTo(-bw * 0.25, 0); c.lineTo(-bw * 0.05, -H * 0.42); c.lineTo(bw * 0.05, -H * 0.42); c.lineTo(bw * 0.25, 0); c.lineTo(bw * 0.7, 0); c.lineTo(bw * 0.55, -H * 0.5); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(-bw * 0.62, -H * 0.8); c.lineTo(-bw, -H * 0.52); c.lineTo(-bw * 0.85, -H * 0.4); c.lineTo(-bw * 0.62, -H * 0.55); c.lineTo(-bw * 0.55, -H * 0.5); c.lineTo(bw * 0.55, -H * 0.5); c.lineTo(bw * 0.62, -H * 0.55); c.lineTo(bw * 0.85, -H * 0.4); c.lineTo(bw, -H * 0.52); c.lineTo(bw * 0.62, -H * 0.8); c.closePath(); c.fill();
      // head with glossy screen face
      const hw = W * 0.5, hh = H * 0.27, hy = -H * 0.99;
      rrect(c, -hw * 0.16 - hw * 0.8, hy + hh * 0.3, hw * 0.22, hh * 0.45, hh * 0.1); c.fillStyle = '#3a3c42'; c.fill(); rrect(c, hw * 0.58, hy + hh * 0.3, hw * 0.22, hh * 0.45, hh * 0.1); c.fill();
      rrect(c, -hw * 0.62, hy, hw * 1.24, hh, hh * 0.22); c.fillStyle = '#4a4c54'; c.fill();
      const sg = c.createLinearGradient(0, hy, 0, hy + hh); sg.addColorStop(0, '#7fc0ff'); sg.addColorStop(1, '#2f7ae0');
      rrect(c, -hw * 0.5, hy + hh * 0.1, hw, hh * 0.8, hh * 0.16); c.fillStyle = sg; c.shadowColor = '#6fb4ff'; c.shadowBlur = hh * 0.3; c.fill(); c.shadowBlur = 0;
      const blink = Math.abs((lt % 3.2) - 3.1) < 0.06 ? 0.15 : 1;
      c.fillStyle = 'rgba(225,240,255,0.75)'; for (const sx of [-1, 1]) { rrect(c, sx * hw * 0.2 - hw * 0.07, hy + hh * 0.3, hw * 0.14, hh * 0.26 * blink, hw * 0.05); c.fill(); }
      c.strokeStyle = 'rgba(225,240,255,0.6)'; c.lineWidth = hh * 0.03; c.beginPath(); c.arc(0, hy + hh * 0.56, hw * 0.13, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
      break;
    }
    case 'temple': {
      const n = 5, cw = W * 0.12, gap = W * 0.22, x0 = -((n - 1) * gap) / 2, ch = H * 0.62, base = H * 0.07;
      c.fillStyle = stoneFill(c, -W * 0.7, W * 0.7, p);
      c.fillRect(-W * 0.72, -base, W * 1.44, base); c.fillRect(-W * 0.66, -base * 2, W * 1.32, base * 0.9);
      for (let i = 0; i < n; i++) {
        const x = x0 + i * gap; c.fillStyle = stoneFill(c, x - cw / 2, x + cw / 2, p); c.fillRect(x - cw / 2, -base * 2 - ch, cw, ch);
        c.fillRect(x - cw * 0.75, -base * 2 - ch - H * 0.035, cw * 1.5, H * 0.035); c.fillRect(x - cw * 0.7, -base * 2, cw * 1.4, H * 0.03);
        c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = Math.max(1, cw * 0.05); for (let f = -1; f <= 1; f++) { c.beginPath(); c.moveTo(x + f * cw * 0.22, -base * 2 - ch); c.lineTo(x + f * cw * 0.22, -base * 2); c.stroke(); }
      }
      const ty = -base * 2 - ch - H * 0.035; c.fillStyle = stoneFill(c, -W * 0.7, W * 0.7, p); c.fillRect(-W * 0.68, ty - H * 0.05, W * 1.36, H * 0.05);
      c.beginPath(); c.moveTo(-W * 0.7, ty - H * 0.05); c.lineTo(0, ty - H * 0.22); c.lineTo(W * 0.7, ty - H * 0.05); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.moveTo(-W * 0.5, ty - H * 0.065); c.lineTo(0, ty - H * 0.185); c.lineTo(W * 0.5, ty - H * 0.065); c.closePath(); c.fill();
      break;
    }
    case 'coins': {
      const n = 7, cw = W * 0.5, ch = H * 0.07, grow = out(lt / 1.6);
      for (let i = 0; i < n; i++) {
        const vis = clamp(grow * n - i), y = -i * ch * 0.82 - (1 - vis) * H * 0.4; if (vis <= 0) continue;
        c.globalAlpha = vis; const g = c.createLinearGradient(-cw, 0, cw, 0); g.addColorStop(0, '#8a5a12'); g.addColorStop(0.4, '#ffe18a'); g.addColorStop(1, '#a8741a');
        c.fillStyle = g; c.beginPath(); c.ellipse(0, y, cw, ch * 0.9, 0, 0, Math.PI); c.lineTo(-cw, y - ch * 0.4); c.ellipse(0, y - ch * 0.4, cw, ch * 0.9, 0, Math.PI, 0, true); c.closePath(); c.fill();
        c.fillStyle = '#ffd35a'; c.beginPath(); c.ellipse(0, y - ch * 0.4, cw, ch * 0.9, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(120,70,0,0.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse(0, y - ch * 0.4, cw * 0.72, ch * 0.62, 0, 0, 7); c.stroke();
      }
      c.globalAlpha = 1; const fy = -H * 0.75 - Math.sin(lt * 1.6) * H * 0.04, sx = Math.abs(Math.cos(lt * 2.2)) * cw * 0.6 + cw * 0.08;
      const g2 = c.createLinearGradient(-sx, 0, sx, 0); g2.addColorStop(0, '#b3801f'); g2.addColorStop(0.5, '#fff0b0'); g2.addColorStop(1, '#b3801f'); c.fillStyle = g2; c.shadowColor = '#ffcf5a'; c.shadowBlur = H * 0.06; c.beginPath(); c.ellipse(0, fy, sx, cw * 0.6, 0, 0, 7); c.fill(); c.shadowBlur = 0;
      break;
    }
    case 'person': {
      c.fillStyle = stoneFill(c, -W * 0.5, W * 0.5, p);
      c.beginPath(); c.moveTo(-W * 0.62, 0); c.bezierCurveTo(-W * 0.62, -H * 0.38, -W * 0.3, -H * 0.5, -W * 0.1, -H * 0.55); c.lineTo(W * 0.1, -H * 0.55); c.bezierCurveTo(W * 0.3, -H * 0.5, W * 0.62, -H * 0.38, W * 0.62, 0); c.closePath(); c.fill();
      c.fillRect(-W * 0.09, -H * 0.66, W * 0.18, H * 0.13); c.beginPath(); c.ellipse(0, -H * 0.79, W * 0.25, H * 0.15, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(W * 0.06, -H * 0.8, W * 0.14, H * 0.15, 0, -1.2, 1.9); c.fill();
      const pulse = 0.5 + 0.5 * Math.sin(lt * 2.4); glowOrb(c, 0, -H * 0.82, H * 0.5, p.glow, 0.12 + 0.12 * pulse);
      break;
    }
    case 'skyline': {
      const bs = [[-0.5, 0.42], [-0.36, 0.62], [-0.2, 0.5], [-0.05, 0.92], [0.12, 0.66], [0.28, 0.5], [0.42, 0.7]];
      bs.forEach(([x, hh], i) => {
        const bw = W * 0.15, bh = H * hh * out(lt / 1.2 - i * 0.08 + 0.08), bx = x * W * 1.6;
        const g = c.createLinearGradient(bx, 0, bx + bw, 0); g.addColorStop(0, '#20263a'); g.addColorStop(0.5, '#4a5a86'); g.addColorStop(1, '#1b2034'); c.fillStyle = g; c.fillRect(bx, -bh, bw, bh);
        for (let wy = 0; wy < bh - 10; wy += H * 0.045) for (let wx = 5; wx < bw - 6; wx += bw * 0.28) { const on = hash('w' + i + wy + wx) > 0.45; c.fillStyle = on ? 'rgba(255,215,130,0.85)' : 'rgba(255,255,255,0.08)'; c.fillRect(bx + wx, -bh + wy + 6, bw * 0.14, H * 0.022); }
      });
      break;
    }
    case 'chip': {
      const s = W * 0.55, pulse = 0.5 + 0.5 * Math.sin(lt * 3);
      c.translate(0, -H * 0.5); glowOrb(c, 0, 0, H * 0.7, p.glow, 0.25);
      c.strokeStyle = p.line; c.lineWidth = Math.max(2, H * 0.012); for (let i = -3; i <= 3; i++) { const o = i * s * 0.28; for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { c.beginPath(); c.moveTo(dx ? dx * s * 0.5 : o, dy ? dy * s * 0.5 : o); c.lineTo(dx ? dx * s * 0.78 : o, dy ? dy * s * 0.78 : o); c.stroke(); } }
      const g = c.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2); g.addColorStop(0, '#2c3350'); g.addColorStop(1, '#0d1226'); rrect(c, -s / 2, -s / 2, s, s, s * 0.08); c.fillStyle = g; c.fill(); c.strokeStyle = p.line; c.stroke();
      c.strokeStyle = p.glow; c.lineWidth = Math.max(1.5, H * 0.008); c.globalAlpha = 0.5 + 0.5 * pulse; c.beginPath(); c.moveTo(-s * 0.3, -s * 0.1); c.lineTo(-s * 0.1, -s * 0.1); c.lineTo(0, s * 0.05); c.lineTo(s * 0.3, s * 0.05); c.moveTo(-s * 0.3, s * 0.2); c.lineTo(s * 0.05, s * 0.2); c.stroke(); c.globalAlpha = 1;
      rrect(c, -s * 0.16, -s * 0.16, s * 0.32, s * 0.32, s * 0.04); c.fillStyle = p.glow; c.globalAlpha = 0.35 + 0.4 * pulse; c.fill();
      break;
    }
  }
  c.restore();
}

// ---------------------------------------------------------------- blocks
/** Hook / chapter card: huge title + small sub line, subject sliding in with a flowing ribbon and a blurred far layer (reference 3). */
const hero: Blk = (c, a, s, lt, dur, th) => {
  const p = palette(th), W = a.cx * 2, Hh = a.y1 + a.h * 0.32, u = a.u, port = a.portrait;
  const title = String(s.params.title ?? s.params.text ?? '').trim(), sub = String(s.params.sub ?? '').trim(), kind: Subject = s.params.subject ?? 'robot';
  const sw = inout(lt / dur) - 0.5, e = out(seg(lt, 0, 0.9));
  // far layer: another subject, strongly blurred (depth of field)
  const far: Subject = kind === 'temple' ? 'skyline' : 'temple';
  c.save(); c.globalAlpha = 0.55 * e; blurred(c, 7 * u, (cc) => drawSubject(cc, far, th, port ? a.cx : W * 0.66 - sw * W * 0.03, Hh * 0.97, Hh * (port ? 0.5 : 0.78), lt + 3)); c.restore();
  ribbon(c, W, Hh, lt, p, 0.9 * seg(lt, 0.05, 0.7), Hh * (port ? 0.7 : 0.72), Hh * 0.2, -Hh * 0.12 - sw * Hh * 0.05);
  // main subject slides in from the side with a spring, then floats
  const sp = spring(seg(lt, 0.15, 0.9)), fx = (port ? a.cx : W * 0.72) + (1 - sp) * W * 0.4 + sw * W * 0.04, fy = Math.sin(lt * 1.3) * u * 5;
  glowOrb(c, fx, Hh * 0.55, Hh * 0.5, p.glow, 0.16 * e);
  drawSubject(c, kind, th, fx, Hh * 0.97 + fy + (1 - e) * 30 * u, Hh * (port ? 0.52 : 0.8), lt);
  // title: line by line, each line slides up out of a mask
  const px = u * (port ? 78 : 70) * (s.params.big ? 1.18 : 1), maxW = port ? a.w : a.w * 0.5, tx = port ? a.cx : a.x0, ty = port ? a.y0 + a.h * 0.02 : a.cy - a.h * 0.42;
  FONT_W(c, th, px, 800);
  const words = title.split(/\s+/).filter(Boolean), lines: string[] = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur);
  const L = lines.slice(0, 3), lh = px * 1.12;
  L.forEach((ln, i) => {
    const q = out(seg(lt, 0.25 + i * 0.16, 0.6)); c.save(); c.beginPath(); c.rect(tx - (port ? maxW / 2 : 0) - 10, ty + i * lh - 4, maxW + 20, lh); c.clip();
    c.fillStyle = i === 0 ? th.acc : th.ink; c.textAlign = port ? 'center' : 'left'; c.textBaseline = 'top'; c.globalAlpha = q; FONT_W(c, th, px, 800); c.fillText(ln, tx, ty + i * lh + (1 - q) * lh); c.restore();
  });
  if (sub) {
    const q = out(seg(lt, 0.55 + L.length * 0.12, 0.7)), spx = u * (port ? 30 : 26); FONT_W(c, th, spx, 600);
    c.save(); c.globalAlpha = q * 0.9; c.fillStyle = th.ink; c.textAlign = port ? 'center' : 'left'; c.textBaseline = 'top';
    const sl: string[] = []; let cu = ''; for (const w of sub.split(/\s+/)) { const t = cu ? cu + ' ' + w : w; if (c.measureText(t).width > maxW && cu) { sl.push(cu); cu = w; } else cu = t; } if (cu) sl.push(cu);
    sl.slice(0, 3).forEach((l, i) => c.fillText(l, tx, ty + L.length * lh + u * 14 + i * spx * 1.3 + (1 - q) * 14 * u)); c.restore();
    c.fillStyle = th.acc; c.globalAlpha = q; c.fillRect(port ? a.cx - u * 40 : tx, ty + L.length * lh + u * 4, u * 80 * q, u * 4); c.globalAlpha = 1;
  }
  dust(c, W, Hh, lt, s.id, 18, th.ink);
};

/** Concept scene: central subject + glass labels popping on the spoken word, a glowing path with a bead, rack focus (reference 2). */
const orbit: Blk = (c, a, s, lt, dur, th) => {
  const p = palette(th), W = a.cx * 2, u = a.u, port = a.portrait, kind: Subject = s.params.subject ?? 'robot';
  const items: string[] = (s.params.items as string[] ?? []).slice(0, 5), n = items.length;
  const cx = a.cx, cy = a.cy + a.h * 0.02, SH = a.h * (port ? 0.8 : 0.98);
  const focusPhase = ease(seg(lt, dur * 0.5, dur * 0.35)); // after half the scene the camera "racks focus" on the latest label
  const times = items.map((it, i) => spokenAt(s, it, 0.5 + i * 0.5));
  let active = -1; times.forEach((t, i) => { if (lt >= t) active = i; });
  glowOrb(c, cx, cy, Math.min(a.w, a.h) * 0.8, p.glow, 0.14);
  // glowing path passing through the scene with a travelling bead
  const bx = (t: number) => W * (-0.05 + 1.1 * t), by = (t: number) => cy + Math.sin(t * 5.2 + 0.6) * a.h * (port ? 0.3 : 0.26) - (t - 0.5) * a.h * 0.5;
  const pr = out(seg(lt, 0.1, dur * 0.8));
  c.save(); c.lineWidth = u * 3; c.strokeStyle = 'rgba(255,255,255,0.75)'; c.shadowColor = '#fff'; c.shadowBlur = u * 8; c.beginPath();
  for (let i = 0; i <= 60; i++) { const t = (i / 60) * pr; i ? c.lineTo(bx(t), by(t)) : c.moveTo(bx(t), by(t)); } c.stroke(); c.shadowBlur = 0;
  const bg = c.createRadialGradient(bx(pr), by(pr), 0, bx(pr), by(pr), u * 14); bg.addColorStop(0, '#fff'); bg.addColorStop(0.35, p.glow); bg.addColorStop(1, p.glow + '00'); c.fillStyle = bg; c.fillRect(bx(pr) - u * 14, by(pr) - u * 14, u * 28, u * 28); c.restore();
  // subject (blurs while a label is in focus)
  blurred(c, focusPhase * 5 * u, (cc) => drawSubject(cc, kind, th, cx, cy + SH * 0.5, SH, lt));
  // labels on an ellipse around the subject
  const rx = a.w * (port ? 0.36 : 0.37), ry = a.h * (port ? 0.38 : 0.36), a0 = hash(s.text) * 6.28;
  items.forEach((it, i) => {
    const ang = a0 + (i / Math.max(1, n)) * 6.2832, depth = 0.8 + 0.4 * hash(it + i), px = u * (port ? 30 : 28) * depth;
    const q = spring(seg(lt, times[i], 0.7)), fl = Math.sin(lt * 1.2 + i * 1.7) * u * 5;
    const isF = i === active, k = isF ? 1 + 0.28 * focusPhase : 1, dim = active >= 0 && !isF ? focusPhase : 0;
    const x = cx + Math.cos(ang) * rx * (1 + (isF ? 0 : 0.0)), y = cy + Math.sin(ang) * ry + fl;
    blurred(c, (1.2 - depth) * 5 * u + dim * 4 * u, (cc) => glassPill(cc, th, p, x, y, clip(it, 22), px * k, q * (1 - dim * 0.4), 0.4 + 0.6 * q, W * 0.86));
  });
  dust(c, W, cy * 2, lt, s.id, 14, th.ink);
};

/** Glowing gradient card with a line that draws itself, bouncing arrows and glass orbs (reference 1). */
const chartcard: Blk = (c, a, s, lt, dur, th) => {
  const p = palette(th), u = a.u, port = a.portrait, down = s.params.dir === 'down';
  const w = port ? a.w * 0.9 : a.w * 0.62, h = port ? a.h * 0.72 : a.h * 0.9, cx = a.cx + (port ? 0 : a.w * 0.1), cy = a.cy;
  const e = spring(seg(lt, 0, 0.85)), tilt = Math.sin(lt * 0.6) * 0.012;
  const hue = down ? ['#5a1a22', '#c40d0d', '#ff9a9a'] : ['#0d3b4a', '#12b886', '#a8ffe0'];
  // glass half-orbs behind (parallax)
  for (const [ox, oy, r, sp] of [[-0.46, 0.55, 0.42, 0.6], [-0.2, 1.15, 0.5, 0.9]] as const) {
    const x = a.cx + a.w * ox - Math.sin(lt * 0.5) * u * 8 * sp, y = a.cy + a.h * oy, R = Math.min(a.w, a.h) * r * (0.9 + 0.1 * e);
    const g = c.createRadialGradient(x + R * 0.25, y - R * 0.3, R * 0.05, x, y, R); g.addColorStop(0, '#dfe6ff'); g.addColorStop(0.35, '#7d86b8'); g.addColorStop(1, 'rgba(5,5,12,0)');
    c.save(); c.globalAlpha = 0.9 * e; c.fillStyle = g; c.beginPath(); c.arc(x, y, R, 0, 7); c.fill(); c.restore();
  }
  c.save(); c.translate(cx, cy + (1 - e) * a.h * 0.25); c.rotate(tilt); c.scale(0.92 + 0.08 * e, 0.92 + 0.08 * e); c.globalAlpha = clamp(e * 1.4);
  c.shadowColor = hue[1]; c.shadowBlur = u * 38; rrect(c, -w / 2, -h / 2, w, h, u * 26);
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#0a0506'); g.addColorStop(0.55, '#0c0506'); g.addColorStop(1, hue[1]); c.fillStyle = g; c.fill(); c.shadowBlur = 0;
  c.save(); rrect(c, -w / 2, -h / 2, w, h, u * 26); c.clip(); glowOrb(c, 0, -h / 2, w * 0.7, hue[0], 0.9); glowOrb(c, 0, h / 2, w * 0.8, hue[2], 0.28); c.restore();
  rrect(c, -w / 2, -h / 2, w, h, u * 26); c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = u * 1.5; c.stroke();
  // axes
  const ax0 = -w * 0.38, ay0 = h * 0.33, ax1 = w * 0.4, ay1 = -h * 0.34;
  c.strokeStyle = 'rgba(255,245,220,0.7)'; c.lineWidth = u * 2.2; c.beginPath(); c.moveTo(ax0, ay1); c.lineTo(ax0, ay0); c.lineTo(ax1, ay0); c.stroke();
  // data line (real values if the script has them, else an honest illustration of the direction)
  let vals: number[] = (s.params.values as number[]) ?? [];
  if (vals.length < 3) { vals = []; let v = down ? 100 : 20; const N = 14; for (let i = 0; i < N; i++) { const r = hash(s.text + i) - 0.5; v += (down ? (i < 3 ? 14 : -7) : 8) + r * 12; vals.push(v); } }
  const mn = Math.min(...vals), mx = Math.max(...vals), pts = vals.map((v, i) => [ax0 + ((ax1 - ax0) * i) / (vals.length - 1) + u * 6, ay0 - u * 8 - ((v - mn) / (mx - mn || 1)) * (ay0 - ay1 - u * 24)] as [number, number]);
  const pr = inout(seg(lt, 0.45, dur * 0.55)), tot = pts.length - 1, upto = pr * tot;
  c.save(); c.shadowColor = '#ffe27a'; c.shadowBlur = u * 10; c.strokeStyle = '#ffe9a0'; c.lineWidth = u * 3.2; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath();
  pts.forEach(([x, y], i) => { if (i > upto) return; if (i === 0) c.moveTo(x, y); else { const f = Math.min(1, upto - (i - 1)), [px2, py2] = pts[i - 1]; c.lineTo(px2 + (x - px2) * f, py2 + (y - py2) * f); } }); c.stroke(); c.restore();
  // arrows pop where the line turns, then bounce
  const turns: number[] = []; pts.forEach((pt, i) => { if (i > 0 && i < tot - 1 && ((down ? pts[i][1] > pts[i - 1][1] : pts[i][1] < pts[i - 1][1]) && i % 3 === 1)) turns.push(i); });
  turns.slice(0, 4).forEach((i, k) => {
    const q = spring(clamp(upto - i, 0, 1.4) / 1.4), [x, y] = pts[i], bob = Math.sin(lt * 3 + k) * u * 5, dirY = down ? 1 : -1, ay = y + dirY * u * 34 + bob;
    c.save(); c.globalAlpha = q; c.translate(x, ay); c.scale(q, q); c.strokeStyle = down ? '#ff8aa0' : '#7dffcf'; c.lineWidth = u * 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -dirY * u * 20); c.lineTo(0, dirY * u * 20); c.moveTo(-u * 13, dirY * u * 7); c.lineTo(0, dirY * u * 21); c.lineTo(u * 13, dirY * u * 7); c.stroke(); c.restore();
  });
  if (s.params.synthetic) { c.fillStyle = 'rgba(255,255,255,0.5)'; FONT_W(c, th, u * 15, 600); c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText('उदाहरण (illustration)', w / 2 - u * 18, h / 2 - u * 10); }
  c.restore();
  const label = String(s.params.label ?? '').trim();
  if (label) { const q = out(seg(lt, 0.2, 0.6)); c.save(); c.globalAlpha = q; FONT_W(c, th, u * (port ? 38 : 34), 700); c.fillStyle = th.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(clip(label, 26), cx, cy - h / 2 - u * 30 + (1 - q) * 16 * u); c.restore(); }
  dust(c, a.cx * 2, a.y1 + a.h * 0.3, lt, s.id, 10, th.ink);
};
const ease = (x: number) => inout(x);

/** Scenes start animating while the previous scene is still cross-fading (PRE seconds early), so a cut never shows an empty frame. */
const pre = (b: Blk): Blk => (c, a, s, lt, d, th) => b(c, a, s, lt + PRE, d + PRE, th);
export const PRO_BLOCKS: Record<string, Blk> = { hero: pre(hero), orbit: pre(orbit), chartcard: pre(chartcard) };
/** the hook scene uses the hero composition too */
export const titleAsHero: Blk = (c, a, s, lt, d, th) => pre(hero)(c, a, { ...s, params: { title: s.params.text, sub: '', big: true, subject: s.params.subject ?? 'robot' } }, lt, d, th);
