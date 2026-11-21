// Canvas motion engine. Every frame is a pure function of time: renderFrame(ctx, w, h, scenes, t, theme).
// Same idea as givemotion's seek-based runtime (MIT): preview, render and scene re-render always match.
// 3D blocks use a small software perspective projection (no WebGL needed => works on every phone).
import type { SceneSpec, Mode } from '../brain/plan';

type C = CanvasRenderingContext2D;
export interface Theme { name: Mode; bg0: string; bg1: string; ink: string; mut: string; acc: string; acc2: string; letterbox: boolean; vignette: number; font: string }
const FONT = '"Noto Sans Devanagari","Hind","Mukta",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
export const THEMES: Record<Mode, Theme> = {
  explanation: { name: 'explanation', bg0: '#0b1020', bg1: '#1a2559', ink: '#ffffff', mut: '#aab4d8', acc: '#ffb454', acc2: '#5ee0c0', letterbox: false, vignette: 0.25, font: FONT },
  documentary: { name: 'documentary', bg0: '#0a0a0c', bg1: '#1c2428', ink: '#f2ece0', mut: '#a39b8b', acc: '#d9a441', acc2: '#6fa8a0', letterbox: true, vignette: 0.55, font: FONT }
};

// ---------- helpers ----------
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ease = {
  out: (x: number) => 1 - Math.pow(1 - clamp(x), 3),
  expo: (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x))),
  back: (x: number) => { const c1 = 1.70158, c3 = c1 + 1, t = clamp(x); return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inout: (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
};
const seg = (t: number, a: number, d: number) => clamp((t - a) / d);
const fmtNum = (v: number, dec: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: dec, minimumFractionDigits: dec }).format(v);

function font(c: C, th: Theme, px: number, weight = 700) { c.font = `${weight} ${Math.max(8, Math.round(px))}px ${th.font}`; }
function wrap(c: C, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean), lines: string[] = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
/** Draw wrapped text, shrinking the font until it fits maxLines. Returns block height. */
function para(c: C, th: Theme, text: string, cx: number, y: number, maxW: number, size: number, maxLines: number, color: string, alpha = 1, weight = 700, align: CanvasTextAlign = 'center'): number {
  let px = size, lines: string[] = [];
  for (let k = 0; k < 14; k++) { font(c, th, px, weight); lines = wrap(c, text, maxW); if (lines.length <= maxLines) break; px *= 0.9; }
  const lh = px * 1.28;
  c.save(); c.globalAlpha *= alpha; c.fillStyle = color; c.textAlign = align; c.textBaseline = 'top';
  lines.forEach((l, i) => c.fillText(l, cx, y + i * lh));
  c.restore();
  return lines.length * lh;
}
function rr(c: C, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  c.beginPath(); c.moveTo(x + rad, y); c.arcTo(x + w, y, x + w, y + h, rad); c.arcTo(x + w, y + h, x, y + h, rad); c.arcTo(x, y + h, x, y, rad); c.arcTo(x, y, x + w, y, rad); c.closePath();
}
interface Area { x0: number; y0: number; x1: number; y1: number; w: number; h: number; cx: number; cy: number; u: number; portrait: boolean }
function areaOf(w: number, h: number, th: Theme): Area {
  const lb = th.letterbox ? h * 0.07 : 0;
  const y0 = h * 0.07 + lb, y1 = h * 0.74 - (th.letterbox ? 0 : 0);
  return { x0: w * 0.07, y0, x1: w * 0.93, y1, w: w * 0.86, h: y1 - y0, cx: w / 2, cy: (y0 + y1) / 2, u: Math.min(w, h) / 720, portrait: h > w * 1.1 };
}

// ---------- background ----------
function drawBg(c: C, w: number, h: number, th: Theme, s: SceneSpec, lt: number) {
  const g = c.createLinearGradient(0, 0, w * 0.6, h);
  g.addColorStop(0, th.bg0); g.addColorStop(1, th.bg1);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  // slow parallax glow blobs (two depths)
  const hue = s.id % 2 ? th.acc2 : th.acc;
  for (let i = 0; i < 3; i++) {
    const sp = 0.015 * (i + 1), x = w * (0.2 + 0.3 * i) + Math.sin(lt * sp * 8 + i * 2 + s.id) * w * 0.05 * (i + 1), y = h * (0.25 + 0.25 * i) + Math.cos(lt * sp * 7 + i) * h * 0.04;
    const r = Math.min(w, h) * (0.5 - i * 0.08), rg = c.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, hue + (i === 0 ? '30' : '18')); rg.addColorStop(1, hue + '00');
    c.fillStyle = rg; c.fillRect(0, 0, w, h);
  }
  // faint grid for the explanation look
  if (th.name === 'explanation') { c.strokeStyle = 'rgba(255,255,255,0.035)'; c.lineWidth = 1; const gs = Math.min(w, h) / 12; c.beginPath(); for (let x = (lt * 4) % gs; x < w; x += gs) { c.moveTo(x, 0); c.lineTo(x, h); } for (let y = 0; y < h; y += gs) { c.moveTo(0, y); c.lineTo(w, y); } c.stroke(); }
}

// ---------- blocks ----------
type Block = (c: C, a: Area, s: SceneSpec, lt: number, dur: number, th: Theme) => void;
const P = (s: SceneSpec) => s.params;

const title: Block = (c, a, s, lt, _d, th) => {
  const words = String(P(s).text).split(/\s+/);
  const size = a.u * (a.portrait ? 74 : 70);
  font(c, th, size, 800);
  let px = size; let lines: string[] = [];
  for (let k = 0; k < 12; k++) { font(c, th, px, 800); lines = wrap(c, words.join(' '), a.w * 0.92); if (lines.length <= 4) break; px *= 0.9; }
  const lh = px * 1.25, top = a.cy - (lines.length * lh) / 2;
  let wi = 0;
  c.textBaseline = 'top'; c.textAlign = 'center';
  lines.forEach((ln, li) => {
    const ws = ln.split(' '); let total = c.measureText(ln).width; let x = a.cx - total / 2;
    c.textAlign = 'left';
    ws.forEach((wd) => {
      const p = ease.out(seg(lt, 0.1 + wi * 0.09, 0.5)); wi++;
      c.save(); c.globalAlpha = p; c.fillStyle = li === 0 && wi <= 2 ? th.acc : th.ink; c.fillText(wd, x, top + li * lh + (1 - p) * px * 0.35); c.restore();
      x += c.measureText(wd + ' ').width;
    });
  });
  const bw = a.w * 0.28 * ease.expo(seg(lt, 0.5 + wi * 0.04, 0.8));
  c.fillStyle = th.acc; rr(c, a.cx - bw / 2, top + lines.length * lh + px * 0.3, bw, Math.max(4, a.u * 6), 4);
  c.fill();
};

const end: Block = (c, a, s, lt, d, th) => {
  const e = ease.out(seg(lt, 0, 0.7));
  const r = a.u * (60 + 6 * Math.sin(lt * 3));
  c.save(); c.globalAlpha = 0.9 * e; c.strokeStyle = th.acc; c.lineWidth = a.u * 5; c.beginPath(); c.arc(a.cx, a.cy - a.h * 0.22, r * e, 0, Math.PI * 2); c.stroke(); c.restore();
  para(c, th, String(P(s).text), a.cx, a.cy - a.h * 0.02, a.w * 0.9, a.u * 52, 4, th.ink, e);
};

const stat: Block = (c, a, s, lt, _d, th) => {
  const p = P(s), e = ease.expo(seg(lt, 0.15, 1.5));
  const dec = Number.isInteger(p.value) ? 0 : 1;
  const txt = `${p.prefix || ''}${fmtNum(p.value * e, dec)}${p.suffix || ''}`;
  const size = a.u * (a.portrait ? 120 : 150);
  if (p.unit === '%') {
    const r = Math.min(a.w * 0.45, a.h * 0.3), cy = a.y0 + r + a.u * 8;
    c.lineWidth = a.u * 22; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.arc(a.cx, cy, r, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = th.acc; c.beginPath(); c.arc(a.cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp((p.value / 100) * e)); c.stroke();
    font(c, th, size * 0.62, 800); c.fillStyle = th.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, a.cx, cy);
    para(c, th, p.label, a.cx, cy + r + a.u * 26, a.w * 0.92, a.u * 32, 2, th.mut, ease.out(seg(lt, 0.9, 0.6)), 600);
  } else {
    font(c, th, size, 800); c.fillStyle = th.acc; c.textAlign = 'center'; c.textBaseline = 'middle';
    let px = size; while (c.measureText(txt).width > a.w * 0.95 && px > 20) { px *= 0.92; font(c, th, px, 800); }
    c.fillText(txt, a.cx, a.cy - a.h * 0.1);
    para(c, th, p.label, a.cx, a.cy + a.h * 0.08, a.w * 0.92, a.u * 40, 3, th.ink, ease.out(seg(lt, 0.9, 0.6)), 600);
  }
};

function barsGeom(a: Area, n: number) { const gap = a.w * 0.03, bw = Math.min(a.w * 0.16, (a.w - gap * (n - 1)) / n); const tot = n * bw + (n - 1) * gap; return { bw, gap, x0: a.cx - tot / 2 }; }
const bars: Block = (c, a, s, lt, _d, th) => {
  const p = P(s), v: number[] = p.values, n = v.length, mx = Math.max(...v, 1e-9) * 1.1;
  const { bw, gap, x0 } = barsGeom(a, n), base = a.y1 - a.h * 0.12, H = a.h * 0.68;
  if (p.title) para(c, th, p.title, a.cx, a.y0, a.w, a.u * 34, 1, th.mut, ease.out(seg(lt, 0, 0.5)), 600);
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(a.x0, base, a.w, a.u * 2);
  v.forEach((val, i) => {
    const e = ease.back(seg(lt, 0.25 + i * 0.16, 0.8)), bh = (val / mx) * H * clamp(e, 0, 1.06), x = x0 + i * (bw + gap), top = i === v.indexOf(Math.max(...v));
    const g = c.createLinearGradient(0, base - bh, 0, base); g.addColorStop(0, top ? th.acc : th.acc2); g.addColorStop(1, (top ? th.acc : th.acc2) + '99');
    c.fillStyle = g; rr(c, x, base - bh, bw, bh, a.u * 10); c.fill();
    font(c, th, a.u * 30, 700); c.fillStyle = th.ink; c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.fillText(`${p.prefix || ''}${fmtNum(val * ease.out(seg(lt, 0.3 + i * 0.16, 1)), Number.isInteger(val) ? 0 : 1)}${p.suffix || ''}`, x + bw / 2, base - bh - a.u * 8);
    font(c, th, a.u * 26, 600); c.fillStyle = th.mut; c.textBaseline = 'top'; c.fillText(String(p.labels[i] ?? ''), x + bw / 2, base + a.u * 12);
  });
};

const bars3d: Block = (c, a, s, lt, _d, th) => {
  const p = P(s), v: number[] = p.values, n = v.length, mx = Math.max(...v, 1e-9) * 1.1;
  const { bw, gap, x0 } = barsGeom(a, n), base = a.y1 - a.h * 0.16, H = a.h * 0.6, d = bw * 0.45;
  const rot = Math.sin(lt * 0.8) * 0.12; // gentle camera sway
  for (let i = n - 1; i >= 0; i--) {
    const e = ease.back(seg(lt, 0.25 + i * 0.16, 0.8)), bh = (v[i] / mx) * H * clamp(e, 0, 1.06), x = x0 + i * (bw + gap) + rot * (i - n / 2) * bw * 0.4, y = base - bh;
    const top = i === v.indexOf(Math.max(...v)), col = top ? th.acc : th.acc2;
    c.fillStyle = col; c.fillRect(x, y, bw, bh);                                           // front
    c.fillStyle = 'rgba(0,0,0,0.38)'; c.beginPath(); c.moveTo(x + bw, y); c.lineTo(x + bw + d, y - d); c.lineTo(x + bw + d, base - d); c.lineTo(x + bw, base); c.closePath(); c.fill(); // side
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + d, y - d); c.lineTo(x + bw + d, y - d); c.lineTo(x + bw, y); c.closePath(); c.fill(); // top
    font(c, th, a.u * 28, 700); c.fillStyle = th.ink; c.textAlign = 'center'; c.textBaseline = 'bottom';
    c.fillText(`${p.prefix || ''}${fmtNum(v[i] * ease.out(seg(lt, 0.3 + i * 0.16, 1)), Number.isInteger(v[i]) ? 0 : 1)}${p.suffix || ''}`, x + bw / 2 + d / 2, y - d - a.u * 6);
    font(c, th, a.u * 24, 600); c.fillStyle = th.mut; c.textBaseline = 'top'; c.fillText(String(p.labels[i] ?? ''), x + bw / 2, base + a.u * 14);
  }
  c.fillStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.moveTo(a.x0, base); c.lineTo(a.x1, base); c.lineTo(a.x1 + d, base - d); c.lineTo(a.x0 + d, base - d); c.closePath(); c.fill();
};

const line: Block = (c, a, s, lt, _d, th) => {
  const p = P(s), x0 = a.x0 + a.w * 0.04, x1 = a.x1 - a.w * 0.04, y0 = a.y0 + a.h * 0.08, y1 = a.y1 - a.h * 0.1;
  let vals: number[] = p.values;
  if (p.synthetic) { vals = Array.from({ length: 24 }, (_, i) => (p.dir === 'down' ? Math.exp(-i / 9) : Math.exp(i / 7))); }
  const mn = Math.min(...vals), mx = Math.max(...vals), rng = mx - mn || 1;
  c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = a.u * 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x1, y1); c.stroke();
  const prog = ease.inout(seg(lt, 0.2, 2.0)), n = vals.length;
  const pt = (i: number) => [x0 + (i / (n - 1)) * (x1 - x0), y1 - ((vals[i] - mn) / rng) * (y1 - y0)] as const;
  const upto = prog * (n - 1);
  c.beginPath(); let last: readonly [number, number] = pt(0); c.moveTo(last[0], last[1]);
  for (let i = 1; i <= Math.floor(upto); i++) { last = pt(i); c.lineTo(last[0], last[1]); }
  const fi = Math.floor(upto);
  if (fi < n - 1) { const [ax, ay] = pt(fi), [bx, by] = pt(fi + 1), f = upto - fi; last = [ax + (bx - ax) * f, ay + (by - ay) * f]; c.lineTo(last[0], last[1]); }
  c.lineWidth = a.u * 7; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = th.acc; c.stroke();
  c.lineTo(last[0], y1); c.lineTo(x0, y1); c.closePath();
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, th.acc + '55'); g.addColorStop(1, th.acc + '00'); c.fillStyle = g; c.fill();
  c.fillStyle = th.ink; c.beginPath(); c.arc(last[0], last[1], a.u * (9 + 2 * Math.sin(lt * 6)), 0, Math.PI * 2); c.fill();
  if (p.label) para(c, th, p.label, a.cx, a.y0 - a.h * 0.02, a.w, a.u * 32, 1, th.mut, 1, 600);
  if (p.synthetic) { font(c, th, a.u * 22, 600); c.fillStyle = th.mut; c.textAlign = 'right'; c.textBaseline = 'top'; c.fillText('उदाहरण (illustration)', x1, y1 + a.u * 14); }
};

const timeline: Block = (c, a, s, lt, _d, th) => {
  const ev = P(s).events as Array<{ year: number; label: string }>, n = ev.length;
  const pr = a.portrait;
  const ax = pr ? a.x0 + a.w * 0.25 : a.x0, bx = pr ? ax : a.x1, ay = pr ? a.y0 + a.h * 0.05 : a.cy, by = pr ? a.y1 - a.h * 0.05 : ay;
  const grow = ease.inout(seg(lt, 0, 0.8 + n * 0.3));
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = a.u * 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + (bx - ax) * grow, ay + (by - ay) * grow); c.stroke();
  ev.forEach((e, i) => {
    const f = n === 1 ? 0.5 : i / (n - 1), x = ax + (bx - ax) * (pr ? 0 : 0.06 + f * 0.88), y = pr ? ay + (by - ay) * (0.06 + f * 0.88) : ay;
    const p = ease.back(seg(lt, 0.5 + i * 0.45, 0.6)), r = a.u * 16 * clamp(p, 0, 1.2);
    c.fillStyle = th.acc; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.save(); c.globalAlpha = clamp(p);
    if (pr) { font(c, th, a.u * 44, 800); c.fillStyle = th.acc; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(String(e.year), x + a.u * 34, y - a.u * 14); para(c, th, e.label, x + a.u * 34, y + a.u * 10, a.w * 0.62, a.u * 30, 2, th.ink, 1, 600, 'left'); }
    else { const up = i % 2 === 0; font(c, th, a.u * 46, 800); c.fillStyle = th.acc; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(e.year), x, y + (up ? -a.u * 62 : a.u * 62)); para(c, th, e.label, x, y + (up ? -a.u * 140 : a.u * 92), a.w / Math.max(2, n) * 1.15, a.u * 30, 2, th.ink, 1, 600); }
    c.restore();
  });
};

const steps: Block = (c, a, s, lt, _d, th) => {
  const it = P(s).items as string[], n = it.length, rh = Math.min(a.h / n, a.u * 110), top = a.cy - (n * rh) / 2;
  it.forEach((t, i) => {
    const p = ease.out(seg(lt, 0.2 + i * 0.3, 0.55)), y = top + i * rh, x = a.x0 + (1 - p) * -a.w * 0.3;
    c.save(); c.globalAlpha = p;
    c.fillStyle = 'rgba(255,255,255,0.07)'; rr(c, x, y + rh * 0.06, a.w, rh * 0.88, a.u * 16); c.fill();
    c.fillStyle = i % 2 ? th.acc2 : th.acc; c.beginPath(); c.arc(x + rh * 0.5, y + rh / 2, rh * 0.3, 0, Math.PI * 2); c.fill();
    font(c, th, rh * 0.32, 800); c.fillStyle = th.bg0; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), x + rh * 0.5, y + rh / 2 + 1);
    para(c, th, t, x + rh * 1.0, y + rh * 0.5 - rh * 0.2, a.w - rh * 1.2, rh * 0.34, 2, th.ink, 1, 600, 'left');
    c.restore();
  });
};

const compare: Block = (c, a, s, lt, _d, th) => {
  const p = P(s), pr = a.portrait, gap = a.u * 28;
  const cw = pr ? a.w : (a.w - gap) / 2, ch = pr ? (a.h - gap) / 2 : a.h * 0.8, y = pr ? a.y0 : a.cy - ch / 2;
  [p.left, p.right].forEach((t: string, i) => {
    const e = ease.out(seg(lt, 0.15 + i * 0.25, 0.7)), x = pr ? a.x0 : a.x0 + i * (cw + gap), yy = pr ? a.y0 + i * (ch + gap) : y;
    const dx = pr ? 0 : (i ? 1 : -1) * (1 - e) * a.w * 0.4, dy = pr ? (i ? 1 : -1) * (1 - e) * a.h * 0.3 : 0;
    c.save(); c.globalAlpha = e; c.translate(dx, dy);
    c.fillStyle = 'rgba(255,255,255,0.07)'; rr(c, x, yy, cw, ch, a.u * 22); c.fill();
    c.fillStyle = i ? th.acc2 : th.acc; rr(c, x, yy, cw, a.u * 10, a.u * 5); c.fill();
    para(c, th, t, x + cw / 2, yy + ch * 0.18, cw * 0.86, a.u * 40, 5, th.ink, 1, 700);
    c.restore();
  });
  const pe = ease.back(seg(lt, 0.7, 0.5)), r = a.u * 34 * clamp(pe, 0, 1.2);
  c.fillStyle = th.bg0; c.strokeStyle = th.ink; c.lineWidth = a.u * 4; c.beginPath(); c.arc(a.cx, a.cy, r, 0, Math.PI * 2); c.fill(); c.stroke();
  font(c, th, r * 0.8, 800); c.fillStyle = th.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VS', a.cx, a.cy + 1);
};

const quote: Block = (c, a, s, lt, _d, th) => {
  const words = String(P(s).text).split(/\s+/), n = words.length;
  font(c, th, a.u * 160, 800); c.fillStyle = th.acc; c.globalAlpha = 0.9 * ease.out(seg(lt, 0, 0.5)); c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('“', a.x0, a.y0 - a.u * 10); c.globalAlpha = 1;
  const shown = Math.floor(n * clamp(lt / Math.max(0.8, Math.min(2.5, n * 0.18))));
  para(c, th, words.slice(0, Math.max(1, shown)).join(' '), a.cx, a.cy - a.h * 0.1, a.w * 0.86, a.u * 46, 6, th.ink, 1, 600);
};

const words: Block = (c, a, s, lt, _d, th) => {
  const ws = s.words; if (!ws.length) return;
  const t = s.start + lt, G = 2;
  let gi = 0; for (let i = 0; i < ws.length; i += G) if (t >= ws[i].t0 - 0.02) gi = i;
  const grp = ws.slice(gi, gi + G), t0 = grp[0].t0, txt = grp.map((w) => w.w).join(' ');
  const e = ease.back(seg(t - t0, 0, 0.28)), sc = 0.6 + 0.4 * clamp(e, 0, 1.15);
  c.save(); c.translate(a.cx, a.cy); c.scale(sc, sc);
  font(c, th, a.u * 96, 800); c.fillStyle = grp.some((w) => /\d/.test(w.w)) ? th.acc : th.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
  let px = a.u * 96; while (c.measureText(txt).width > a.w * 0.9 && px > 20) { px *= 0.9; font(c, th, px, 800); }
  c.fillText(txt, 0, 0); c.restore();
  c.fillStyle = th.acc; const bw = a.w * 0.5 * clamp((t - t0) / Math.max(0.1, grp[grp.length - 1].t1 - t0)); c.fillRect(a.cx - a.w * 0.25, a.cy + a.h * 0.2, bw, a.u * 6);
};

const callout: Block = (c, a, s, lt, _d, th) => {
  const p = P(s), e = ease.out(seg(lt, 0.1, 0.7)), r = a.u * 54;
  const cx = a.portrait ? a.cx : a.x0 + r, cy = a.portrait ? a.cy - a.h * 0.22 : a.cy;
  c.save(); c.globalAlpha = e; c.fillStyle = th.acc; c.beginPath(); c.arc(cx, cy, r * (0.6 + 0.4 * e), 0, Math.PI * 2); c.fill();
  font(c, th, r * 1.2, 800); c.fillStyle = th.bg0; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(p.icon, cx, cy + 2); c.restore();
  if (a.portrait) para(c, th, p.text, a.cx, cy + r * 1.5, a.w * 0.92, a.u * 48, 6, th.ink, e);
  else para(c, th, p.text, a.x0 + r * 2.5, a.cy - a.u * 70, a.w - r * 2.6, a.u * 50, 4, th.ink, e, 700, 'left');
};

// 3D: software perspective globe made of fibonacci points
const SPH = (() => { const pts: number[][] = [], n = 360, g = Math.PI * (3 - Math.sqrt(5)); for (let i = 0; i < n; i++) { const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), t = g * i; pts.push([Math.cos(t) * r, y, Math.sin(t) * r]); } return pts; })();
const sphere3d: Block = (c, a, s, lt, _d, th) => {
  const R = Math.min(a.w, a.h) * 0.33, e = ease.back(seg(lt, 0, 0.9)), cx = a.cx, cy = a.cy - a.h * 0.06, ang = lt * 0.7, tilt = 0.35;
  const ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(tilt), st = Math.sin(tilt), cam = 3.2;
  const glow = c.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.5); glow.addColorStop(0, th.acc2 + '30'); glow.addColorStop(1, th.acc2 + '00'); c.fillStyle = glow; c.fillRect(0, 0, a.x1 + a.x0, a.y1 + a.h);
  const proj = SPH.map(([x, y, z]) => { const x1 = x * ca + z * sa, z1 = -x * sa + z * ca, y1 = y * ct - z1 * st, z2 = y * st + z1 * ct, k = cam / (cam - z2); return [cx + x1 * R * k * clamp(e, 0, 1.1), cy + y1 * R * k * clamp(e, 0, 1.1), z2] as const; }).sort((p, q) => p[2] - q[2]);
  for (const [x, y, z] of proj) { c.globalAlpha = 0.25 + 0.75 * ((z + 1) / 2); c.fillStyle = z > 0.2 ? th.acc2 : th.mut; c.beginPath(); c.arc(x, y, a.u * (2 + 2.2 * ((z + 1) / 2)), 0, Math.PI * 2); c.fill(); }
  c.globalAlpha = 1;
  c.strokeStyle = th.acc + 'aa'; c.lineWidth = a.u * 3; c.beginPath(); c.ellipse(cx, cy, R * 1.35, R * 0.38, -0.35, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 3; i++) { const th2 = lt * 1.2 + (i * Math.PI * 2) / 3, ox = Math.cos(th2) * R * 1.35, oy = Math.sin(th2) * R * 0.38, rx = ox * Math.cos(-0.35) - oy * Math.sin(-0.35), ry = ox * Math.sin(-0.35) + oy * Math.cos(-0.35); c.fillStyle = th.acc; c.beginPath(); c.arc(cx + rx, cy + ry, a.u * 8, 0, Math.PI * 2); c.fill(); }
  const p = P(s); if (p.label) para(c, th, p.label, a.cx, cy + R * 1.45, a.w, a.u * 40, 1, th.acc, ease.out(seg(lt, 0.6, 0.6)), 800);
};

const BLOCK_FN: Record<string, Block> = { title, end, stat, bars, bars3d, line, timeline, steps, compare, quote, words, callout, sphere3d };

// ---------- captions (word-level highlight) ----------
function captions(c: C, w: number, h: number, th: Theme, s: SceneSpec, t: number) {
  const ws = s.words; if (!ws.length) return;
  let ai = 0; for (let i = 0; i < ws.length; i++) if (t >= ws[i].t0) ai = i;
  const GRP = 7, g0 = Math.floor(ai / GRP) * GRP, grp = ws.slice(g0, g0 + GRP);
  const u = Math.min(w, h) / 720, px = u * 34, y = h * (th.letterbox ? 0.8 : 0.84);
  font(c, th, px, 700);
  const total = grp.reduce((acc, wd) => acc + c.measureText(wd.w + ' ').width, 0);
  const bw = Math.min(w * 0.94, total + u * 40);
  c.fillStyle = 'rgba(0,0,0,0.45)'; rr(c, w / 2 - bw / 2, y - px * 0.4, bw, px * 1.9, u * 16); c.fill();
  let x = w / 2 - total / 2; c.textAlign = 'left'; c.textBaseline = 'top';
  grp.forEach((wd, i) => { c.fillStyle = g0 + i === ai ? th.acc : th.ink; c.fillText(wd.w, x, y); x += c.measureText(wd.w + ' ').width; });
}

// ---------- scene + transitions ----------
function drawScene(c: C, w: number, h: number, th: Theme, s: SceneSpec, lt: number) {
  const dur = Math.max(0.1, s.end - s.start), a = areaOf(w, h, th);
  drawBg(c, w, h, th, s, lt);
  const z = s.camera.z0 + (s.camera.z1 - s.camera.z0) * ease.inout(lt / dur);
  c.save(); c.translate(w / 2 + s.camera.px * w * (lt / dur), h * 0.45); c.scale(z, z); c.translate(-w / 2, -h * 0.45);
  (BLOCK_FN[s.block] ?? callout)(c, a, s, Math.max(0, lt), dur, th);
  c.restore();
}

export const TRANSITION_SEC = 0.4;
export interface RenderOpts { captions: boolean }
export function renderFrame(c: C, w: number, h: number, scenes: SceneSpec[], t: number, th: Theme, opts: RenderOpts = { captions: true }) {
  if (!scenes.length) { c.fillStyle = th.bg0; c.fillRect(0, 0, w, h); return; }
  let idx = scenes.length - 1; for (let i = 0; i < scenes.length; i++) if (t < scenes[i].end) { idx = i; break; }
  const s = scenes[idx], next = scenes[idx + 1], lt = t - s.start;
  c.save(); c.clearRect(0, 0, w, h);
  drawScene(c, w, h, th, s, lt);
  if (next && t > s.end - TRANSITION_SEC) {
    const p = ease.inout((t - (s.end - TRANSITION_SEC)) / TRANSITION_SEC), nl = t - next.start;
    c.save();
    switch (next.transition) {
      case 'slide': c.translate((1 - p) * w, 0); break;
      case 'zoom': c.globalAlpha = p; c.translate(w / 2, h / 2); c.scale(1.12 - 0.12 * p, 1.12 - 0.12 * p); c.translate(-w / 2, -h / 2); break;
      case 'wipe': c.beginPath(); c.rect(0, 0, w * p, h); c.clip(); break;
      default: c.globalAlpha = p;
    }
    drawScene(c, w, h, th, next, nl);
    c.restore();
  }
  if (opts.captions) captions(c, w, h, th, t > s.end - TRANSITION_SEC / 2 && next ? next : s, t);
  if (th.vignette > 0) { const g = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${th.vignette})`); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  if (th.letterbox) { c.fillStyle = '#000'; c.fillRect(0, 0, w, h * 0.07); c.fillRect(0, h * 0.93, w, h * 0.07); }
  c.restore();
}
