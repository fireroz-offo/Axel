// v1.0: 8 more "pro" 2D blocks: donut, ring, gauge, flow, funnel, versus, candles, checklist.
// Every function is a pure f(time) (same frame in preview and MP4). Numbers come only from the script; the candle scene is an
// explicitly labelled illustration. Layout adapts to landscape / portrait / square.
import type { SceneSpec } from '../brain/plan';
import type { Theme, Area } from './engine';
import { PRE, spokenAt } from './pro';
import { candleSeries, hashStr } from '../../engine/three-engine/layout';
type C = CanvasRenderingContext2D;
type Blk = (c: C, a: Area, s: SceneSpec, lt: number, dur: number, th: Theme) => void;

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, d: number) => clamp((t - a) / d);
const out = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const inout = (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const spring = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(11 * x));
const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');
const fmt = (v: number) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: Math.abs(v) < 100 && v % 1 !== 0 ? 2 : 0 }).format(v);
const PAL = (th: Theme) => [th.acc, th.acc2, '#7aa2ff', '#ff7a9c', '#b78cff', '#6ee7a8'];

function rr(c: C, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + k, y); c.arcTo(x + w, y, x + w, y + h, k); c.arcTo(x + w, y + h, x, y + h, k); c.arcTo(x, y + h, x, y, k); c.arcTo(x, y, x + w, y, k); c.closePath();
}
/** single line of text, shrunk to fit maxW */
function T(c: C, th: Theme, text: string, x: number, y: number, px: number, color: string, o: { w?: number; al?: CanvasTextAlign; bl?: CanvasTextBaseline; alpha?: number; maxW?: number } = {}) {
  const wt = o.w ?? 700; let p = Math.max(8, px); c.font = `${wt} ${Math.round(p)}px ${th.font}`;
  if (o.maxW) { const m = c.measureText(text).width; if (m > o.maxW) { p = Math.max(8, p * (o.maxW / m)); c.font = `${wt} ${Math.round(p)}px ${th.font}`; } }
  c.save(); c.globalAlpha *= o.alpha ?? 1; c.fillStyle = color; c.textAlign = o.al ?? 'center'; c.textBaseline = o.bl ?? 'middle'; c.fillText(text, x, y); c.restore();
}
/** wrapped, centred text that shrinks until it fits the box */
function box(c: C, th: Theme, text: string, cx: number, cy: number, w: number, h: number, px: number, color: string, alpha = 1, wt = 700) {
  let p = px, lines: string[] = [];
  for (let k = 0; k < 16; k++) {
    c.font = `${wt} ${Math.round(p)}px ${th.font}`; lines = []; let cur = '';
    for (const wd of text.split(/\s+/).filter(Boolean)) { const t = cur ? cur + ' ' + wd : wd; if (c.measureText(t).width > w && cur) { lines.push(cur); cur = wd; } else cur = t; }
    if (cur) lines.push(cur);
    if (lines.length * p * 1.25 <= h && lines.every((l) => c.measureText(l).width <= w * 1.02)) break; p *= 0.9;
  }
  c.save(); c.globalAlpha *= alpha; c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle';
  lines.forEach((l, i) => c.fillText(l, cx, cy + (i - (lines.length - 1) / 2) * p * 1.25)); c.restore();
}
function glass(c: C, x: number, y: number, w: number, h: number, r: number, th: Theme, glowCol: string, alpha = 1) {
  c.save(); c.globalAlpha *= alpha; c.shadowColor = glowCol; c.shadowBlur = h * 0.22; rr(c, x, y, w, h, r);
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.13)'); g.addColorStop(1, 'rgba(255,255,255,0.04)'); c.fillStyle = g; c.fill(); c.shadowBlur = 0;
  c.lineWidth = Math.max(1, h * 0.012); c.strokeStyle = glowCol + '99'; c.stroke(); c.restore();
}
function heading(c: C, a: Area, th: Theme, text: string, lt: number) {
  const t = String(text ?? '').trim(); if (!t) return; const q = out(seg(lt, 0.15, 0.6));
  T(c, th, clip(t, 34), a.cx, a.y0 - a.u * 8 + (1 - q) * a.u * 14, a.u * (a.portrait ? 38 : 34), th.ink, { alpha: q, maxW: a.w });
}
const nums = (v: any): number[] => (Array.isArray(v) ? v.map(Number).filter((x) => Number.isFinite(x) && x > 0) : []);
const items = (s: SceneSpec, max = 5): string[] => (Array.isArray(s.params.items) ? (s.params.items as string[]).map(String).filter(Boolean).slice(0, max) : []);

// ───────── donut: shares of a whole (percent of the real values)
const donut: Blk = (c, a, s, lt, dur, th) => {
  const p = s.params, vals = nums(p.values).slice(0, 6), n = vals.length, pal = PAL(th);
  if (n < 2) { box(c, th, s.text, a.cx, a.cy, a.w * 0.8, a.h * 0.5, a.u * 40, th.ink); return; }
  const tot = vals.reduce((x, y) => x + y, 0), port = a.portrait, R = port ? Math.min(a.w * 0.3, a.h * 0.26) : Math.min(a.w * 0.19, a.h * 0.4), cx = port ? a.cx : a.x0 + a.w * 0.28, cy = port ? a.y0 + a.h * 0.06 + R + a.u * 20 : a.cy + a.u * 10;
  heading(c, a, th, p.title, lt);
  const sw = out(seg(lt, 0.2, 1.5)), lw = R * 0.36; let ang = -Math.PI / 2, hi = 0; vals.forEach((v, i) => { if (v > vals[hi]) hi = i; });
  c.save(); c.lineCap = 'butt';
  c.lineWidth = lw; c.strokeStyle = 'rgba(255,255,255,0.07)'; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
  const endAng = -Math.PI / 2 + Math.PI * 2 * sw;
  vals.forEach((v, i) => { const a0 = ang, a1 = ang + (v / tot) * Math.PI * 2; ang = a1; const e = Math.min(a1 - 0.025, endAng); if (e <= a0 + 0.001) return; c.save(); c.shadowColor = pal[i % 6]; c.shadowBlur = a.u * 14; c.strokeStyle = pal[i % 6]; c.lineWidth = lw * (i === hi ? 1.12 : 1); c.beginPath(); c.arc(cx, cy, R, a0 + 0.012, e); c.stroke(); c.restore(); });
  c.restore();
  const topPct = Math.round((vals[hi] / tot) * 100), q = out(seg(lt, 0.9, 0.6));
  T(c, th, `${Math.round(topPct * sw)}%`, cx, cy - R * 0.08, R * 0.55, th.ink, { alpha: q, maxW: R * 1.2 });
  T(c, th, clip(String(p.labels?.[hi] ?? ''), 16), cx, cy + R * 0.3, R * 0.2, th.mut, { alpha: q, w: 600, maxW: R * 1.2 });
  // legend
  const lx = port ? a.x0 + a.w * 0.08 : a.x0 + a.w * 0.56, rowH = Math.min(a.u * 62, (port ? a.h * 0.42 : a.h * 0.8) / n), ly0 = port ? cy + R + lw * 0.9 + a.u * 20 : a.cy - ((n - 1) * rowH) / 2, lwid = port ? a.w * 0.84 : a.w * 0.4;
  vals.forEach((v, i) => {
    const at = spokenAt(s, String(p.labels?.[i] ?? ''), 0.7 + i * 0.3), k = spring(seg(lt, at, 0.5)), y = ly0 + i * rowH; if (k <= 0.01) return;
    c.save(); c.globalAlpha *= clamp(k); c.translate(0, (1 - k) * a.u * 14);
    c.fillStyle = pal[i % 6]; rr(c, lx, y - rowH * 0.2, rowH * 0.4, rowH * 0.4, rowH * 0.1); c.fill();
    T(c, th, clip(String(p.labels?.[i] || String.fromCharCode(65 + i)), 18), lx + rowH * 0.6, y, rowH * 0.42, th.ink, { al: 'left', maxW: lwid * 0.6 });
    T(c, th, `${p.prefix ?? ''}${fmt(v)}${p.suffix ?? ''}  ·  ${Math.round((v / tot) * 100)}%`, lx + lwid, y, rowH * 0.36, th.mut, { al: 'right', w: 600, maxW: lwid * 0.46 });
    c.restore();
  });
};

// ───────── ring: one percentage as a glowing progress ring with count-up
const ring: Blk = (c, a, s, lt, dur, th) => {
  const p = s.params, v = Number(p.value) || 0, frac = p.unit === '%' ? clamp(v / 100) : 1, R = Math.min(a.w * 0.3, a.h * 0.36), cx = a.cx, cy = a.y0 + a.h * (a.portrait ? 0.4 : 0.46);
  const pr = out(seg(lt, 0.2, 1.4)), lw = R * 0.2;
  c.save(); c.lineWidth = lw; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
  for (let i = 0; i < 60; i++) { const ag = (i / 60) * Math.PI * 2 - Math.PI / 2, big = i % 5 === 0; c.strokeStyle = big ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.14)'; c.lineWidth = a.u * (big ? 3 : 1.5); c.beginPath(); c.moveTo(cx + Math.cos(ag) * (R + lw * 0.85), cy + Math.sin(ag) * (R + lw * 0.85)); c.lineTo(cx + Math.cos(ag) * (R + lw * (big ? 1.45 : 1.2)), cy + Math.sin(ag) * (R + lw * (big ? 1.45 : 1.2))); c.stroke(); }
  const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * frac * pr, g = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, th.acc2); g.addColorStop(1, th.acc);
  if (a1 > a0 + 0.01) { c.shadowColor = th.acc; c.shadowBlur = a.u * 26; c.strokeStyle = g; c.lineWidth = lw; c.beginPath(); c.arc(cx, cy, R, a0, a1); c.stroke(); c.shadowBlur = 0; c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, lw * 0.42, 0, Math.PI * 2); c.fill(); }
  c.restore();
  T(c, th, `${p.prefix ?? ''}${fmt(v * (p.unit === '%' ? pr : 1))}${p.suffix ?? ''}`, cx, cy, R * 0.62, th.ink, { maxW: R * 1.5, w: 800 });
  const q = out(seg(lt, 0.7, 0.6)); box(c, th, clip(String(p.label ?? ''), 80), cx, cy + R + lw * 2.3 + a.u * 30, a.w * 0.86, a.u * 100, a.u * 32, th.mut, q, 600);
};

// ───────── gauge: a needle swings to a percentage
const gauge: Blk = (c, a, s, lt, dur, th) => {
  const p = s.params, v = Number(p.value) || 0, frac = clamp(p.unit === '%' ? v / 100 : 0.75), R = Math.min(a.w * 0.36, a.h * 0.6), cx = a.cx, cy = a.y0 + a.h * (a.portrait ? 0.46 : 0.62), lw = R * 0.16;
  const k = spring(seg(lt, 0.3, 1.3)), ang = Math.PI + Math.PI * frac * k;
  c.save(); c.lineWidth = lw; c.lineCap = 'butt';
  const cols = ['#ff5a6e', '#ffb454', '#ffe27a', '#6ee7a8']; cols.forEach((col, i) => { c.strokeStyle = col; c.globalAlpha = 0.9; c.beginPath(); c.arc(cx, cy, R, Math.PI + (i / 4) * Math.PI + 0.015, Math.PI + ((i + 1) / 4) * Math.PI - 0.015); c.stroke(); });
  c.globalAlpha = 1; c.lineWidth = a.u * 2; for (let i = 0; i <= 10; i++) { const ag = Math.PI + (i / 10) * Math.PI; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(cx + Math.cos(ag) * (R - lw * 0.9), cy + Math.sin(ag) * (R - lw * 0.9)); c.lineTo(cx + Math.cos(ag) * (R - lw * (i % 5 === 0 ? 1.7 : 1.35)), cy + Math.sin(ag) * (R - lw * (i % 5 === 0 ? 1.7 : 1.35))); c.stroke(); }
  c.shadowColor = th.acc; c.shadowBlur = a.u * 16; c.strokeStyle = th.ink; c.lineWidth = a.u * 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(ang) * (R * 0.82), cy + Math.sin(ang) * (R * 0.82)); c.stroke();
  c.fillStyle = th.acc; c.beginPath(); c.arc(cx, cy, a.u * 15, 0, Math.PI * 2); c.fill(); c.restore();
  T(c, th, `${p.prefix ?? ''}${fmt(v)}${p.suffix ?? ''}`, cx, cy + R * 0.34, R * 0.34, th.ink, { alpha: out(seg(lt, 0.8, 0.5)), maxW: R * 1.2, w: 800 });
  box(c, th, clip(String(p.label ?? ''), 80), cx, cy + R * 0.34 + a.u * 90, a.w * 0.86, a.u * 100, a.u * 30, th.mut, out(seg(lt, 1.0, 0.6)), 600);
};

// ───────── flow: process nodes joined by animated arrows with a travelling pulse
const flow: Blk = (c, a, s, lt, dur, th) => {
  const its = items(s), n = its.length; if (n < 2) { box(c, th, s.text, a.cx, a.cy, a.w * 0.8, a.h * 0.5, a.u * 40, th.ink); return; }
  const port = a.portrait, pal = PAL(th), nw = port ? a.w * 0.8 : Math.min(a.w / n * 0.78, a.u * 250), nh = port ? Math.min(a.h / n * 0.66, a.u * 120) : a.h * 0.42;
  const pos = its.map((_, i) => port ? { x: a.cx, y: a.y0 + ((i + 0.5) * a.h) / n } : { x: a.x0 + ((i + 0.5) * a.w) / n, y: a.cy });
  for (let i = 0; i < n - 1; i++) {
    const A = pos[i], B = pos[i + 1], k = out(seg(lt, 0.5 + i * 0.45, 0.5)); if (k <= 0) continue;
    const x0 = port ? A.x : A.x + nw / 2, y0 = port ? A.y + nh / 2 : A.y, x1 = port ? B.x : B.x - nw / 2, y1 = port ? B.y - nh / 2 : B.y;
    c.save(); c.strokeStyle = pal[i % 6]; c.lineWidth = a.u * 4; c.setLineDash([a.u * 12, a.u * 9]); c.lineDashOffset = -lt * a.u * 40; c.shadowColor = pal[i % 6]; c.shadowBlur = a.u * 10; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); c.stroke(); c.setLineDash([]);
    if (k >= 1) { const f = ((lt * 0.8 + i * 0.3) % 1 + 1) % 1; c.fillStyle = '#fff'; c.beginPath(); c.arc(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, a.u * 7, 0, Math.PI * 2); c.fill(); const ah = a.u * 12, dx = Math.sign(x1 - x0), dy = Math.sign(y1 - y0); c.fillStyle = pal[i % 6]; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - dx * ah - dy * ah * 0.6, y1 - dy * ah - dx * ah * 0.6); c.lineTo(x1 - dx * ah + dy * ah * 0.6, y1 - dy * ah + dx * ah * 0.6); c.closePath(); c.fill(); }
    c.restore();
  }
  its.forEach((t, i) => {
    const at = spokenAt(s, t, 0.3 + i * 0.45), k = spring(seg(lt, at, 0.55)); if (k <= 0.01) return; const P = pos[i], col = pal[i % 6];
    c.save(); c.translate(P.x, P.y); c.scale(k, k); glass(c, -nw / 2, -nh / 2, nw, nh, nh * 0.2, th, col);
    c.fillStyle = col; c.beginPath(); c.arc(-nw / 2 + (port ? nh * 0.4 : 0), port ? 0 : -nh / 2, a.u * 20, 0, Math.PI * 2); c.fill(); T(c, th, String(i + 1), -nw / 2 + (port ? nh * 0.4 : 0), port ? 0 : -nh / 2, a.u * 22, '#0b1020', { w: 800 });
    box(c, th, t, port ? nh * 0.3 : 0, port ? 0 : a.u * 6, nw * (port ? 0.7 : 0.84), nh * 0.7, a.u * 30, th.ink); c.restore();
  });
};

// ───────── funnel: stages narrowing down
const funnel: Blk = (c, a, s, lt, dur, th) => {
  const its = items(s), n = its.length; if (n < 2) { box(c, th, s.text, a.cx, a.cy, a.w * 0.8, a.h * 0.5, a.u * 40, th.ink); return; }
  const pal = PAL(th), W = a.portrait ? a.w * 0.92 : a.w * 0.66, H = a.h * 0.94, lh = H / n, top = a.y0 + a.h * 0.03;
  its.forEach((t, i) => {
    const at = spokenAt(s, t, 0.3 + i * 0.4), k = out(seg(lt, at, 0.6)); if (k <= 0.01) return;
    const w0 = W * (1 - (i / n) * 0.62), w1 = W * (1 - ((i + 1) / n) * 0.62), y0 = top + i * lh, y1 = y0 + lh * 0.92, col = pal[i % 6];
    c.save(); c.globalAlpha *= k; c.translate(a.cx, 0); c.scale(0.7 + 0.3 * k, 1); c.shadowColor = col; c.shadowBlur = a.u * 14;
    const g = c.createLinearGradient(-w0 / 2, 0, w0 / 2, 0); g.addColorStop(0, col + 'cc'); g.addColorStop(0.5, col); g.addColorStop(1, col + 'cc'); c.fillStyle = g;
    c.beginPath(); c.moveTo(-w0 / 2, y0); c.lineTo(w0 / 2, y0); c.lineTo(w1 / 2, y1); c.lineTo(-w1 / 2, y1); c.closePath(); c.fill(); c.shadowBlur = 0; c.restore();
    box(c, th, t, a.cx, (y0 + y1) / 2, w1 * 0.82, lh * 0.78, a.u * 34, '#0b1020', k, 800);
  });
};

// ───────── versus: two sides slide in, VS badge pops
const versus: Blk = (c, a, s, lt, dur, th) => {
  const p = s.params, port = a.portrait, gap = a.u * 28, cw = port ? a.w * 0.9 : (a.w - gap) / 2, ch = port ? (a.h - gap) / 2 : a.h * 0.78;
  const sides = [{ t: String(p.left ?? ''), col: th.acc, k: out(seg(lt, 0.2, 0.7)) }, { t: String(p.right ?? '') || '…', col: th.acc2, k: out(seg(lt, 0.5, 0.7)) }];
  sides.forEach((sd, i) => {
    const x = port ? a.cx - cw / 2 : a.x0 + i * (cw + gap), y = port ? a.y0 + i * (ch + gap) : a.cy - ch / 2, off = (1 - sd.k) * (port ? 0 : (i ? 1 : -1) * a.w * 0.5), offY = (1 - sd.k) * (port ? (i ? 1 : -1) * a.h * 0.5 : 0);
    c.save(); c.globalAlpha *= clamp(sd.k * 1.4); c.translate(off, offY); glass(c, x, y, cw, ch, a.u * 26, th, sd.col);
    c.fillStyle = sd.col; rr(c, x + cw * 0.06, y + ch * 0.07, cw * 0.18, a.u * 7, a.u * 3); c.fill();
    box(c, th, clip(sd.t, 90), x + cw / 2, y + ch * 0.54, cw * 0.84, ch * 0.7, a.u * 40, th.ink); c.restore();
  });
  const q = spring(seg(lt, 0.9, 0.6)); if (q <= 0.01) return;
  c.save(); c.translate(a.cx, port ? a.y0 + ch + gap / 2 : a.cy); c.scale(q, q); c.shadowColor = th.acc; c.shadowBlur = a.u * 26; c.fillStyle = '#0b1020'; c.beginPath(); c.arc(0, 0, a.u * 46, 0, Math.PI * 2); c.fill(); c.strokeStyle = th.acc; c.lineWidth = a.u * 4; c.stroke(); c.shadowBlur = 0; T(c, th, 'VS', 0, 0, a.u * 36, th.acc, { w: 900 }); c.restore();
};

// ───────── candles: illustrative candlestick chart (always labelled; never presented as real data)
const candles: Blk = (c, a, s, lt, dur, th) => {
  const p = s.params, N = a.portrait ? 14 : 20, ser = candleSeries(hashStr(s.text), N, p.dir === 'down' ? 'down' : 'up'), W = a.w * 0.92, H = a.h * 0.82, x0 = a.cx - W / 2, y0 = a.y0 + a.h * 0.12, cw = W / N;
  heading(c, a, th, p.label, lt);
  const mn = Math.min(...ser.map((d) => d.l)), mx = Math.max(...ser.map((d) => d.h)), Y = (v: number) => y0 + H - ((v - mn) / (mx - mn || 1)) * H * 0.92;
  c.save(); c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 1; for (let i = 0; i <= 4; i++) { const y = y0 + (H * i) / 4; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + W, y); c.stroke(); } c.restore();
  const prog = out(seg(lt, 0.2, Math.max(1.5, dur * 0.7))) * N;
  ser.forEach((d, i) => {
    const k = spring(clamp(prog - i, 0, 1)); if (k <= 0.01) return; const up = d.c >= d.o, col = up ? '#4de2a4' : '#ff6b86', cx = x0 + cw * (i + 0.5), bw = cw * 0.56, yo = Y(d.o), yc = Y(d.c), mid = (Y(d.h) + Y(d.l)) / 2;
    c.save(); c.translate(cx, mid); c.scale(1, k); c.translate(-cx, -mid); c.shadowColor = col; c.shadowBlur = a.u * 8; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(1.5, a.u * 3);
    c.beginPath(); c.moveTo(cx, Y(d.h)); c.lineTo(cx, Y(d.l)); c.stroke(); rr(c, cx - bw / 2, Math.min(yo, yc), bw, Math.max(a.u * 3, Math.abs(yc - yo)), a.u * 3); c.fill(); c.restore();
  });
  // 3-period moving average, drawn on top
  c.save(); c.strokeStyle = '#ffe9a0'; c.lineWidth = a.u * 3.5; c.lineJoin = 'round'; c.shadowColor = '#ffe27a'; c.shadowBlur = a.u * 10; c.beginPath();
  let started = false; ser.forEach((d, i) => { if (i > prog - 1) return; const m = (ser[Math.max(0, i - 2)].c + ser[Math.max(0, i - 1)].c + d.c) / 3, x = x0 + cw * (i + 0.5), y = Y(m); if (!started) { c.moveTo(x, y); started = true; } else c.lineTo(x, y); }); c.stroke(); c.restore();
  const lastI = Math.min(N - 1, Math.floor(prog)), lp = ser[lastI]; if (lp && prog > 1) { const pulse = 0.5 + 0.5 * Math.sin(lt * 5); c.save(); c.fillStyle = '#ffe9a0'; c.globalAlpha = 0.35 + 0.4 * pulse; c.beginPath(); c.arc(x0 + cw * (lastI + 0.5), Y(lp.c), a.u * (9 + 5 * pulse), 0, Math.PI * 2); c.fill(); c.restore(); }
  T(c, th, 'उदाहरण (illustration)', x0 + W, y0 + H + a.u * 18, a.u * 17, th.mut, { al: 'right', w: 600, alpha: 0.8 });
};

// ───────── checklist: rows tick off as each item is spoken
const checklist: Blk = (c, a, s, lt, dur, th) => {
  const its = items(s, 6), n = its.length; if (n < 2) { box(c, th, s.text, a.cx, a.cy, a.w * 0.8, a.h * 0.5, a.u * 40, th.ink); return; }
  const rowH = Math.min(a.u * 96, a.h / n), W = a.portrait ? a.w * 0.9 : a.w * 0.7, x0 = a.cx - W / 2, y0 = a.cy - (n * rowH) / 2;
  its.forEach((t, i) => {
    const at = spokenAt(s, t, 0.3 + i * 0.5), k = out(seg(lt, at - 0.2, 0.5)), tick = out(seg(lt, at, 0.45)), y = y0 + i * rowH; if (k <= 0.01) return;
    c.save(); c.globalAlpha *= k; c.translate((1 - k) * -a.u * 40, 0); glass(c, x0, y + rowH * 0.06, W, rowH * 0.88, rowH * 0.24, th, th.acc2, 0.9);
    const bx = x0 + rowH * 0.5, by = y + rowH / 2, r = rowH * 0.27;
    c.strokeStyle = th.acc2; c.lineWidth = a.u * 4; c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.stroke();
    if (tick > 0) { c.fillStyle = th.acc2 + '33'; c.beginPath(); c.arc(bx, by, r, 0, Math.PI * 2); c.fill(); c.strokeStyle = th.acc2; c.lineWidth = a.u * 5; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); const p1 = [bx - r * 0.5, by + r * 0.02], p2 = [bx - r * 0.1, by + r * 0.42], p3 = [bx + r * 0.55, by - r * 0.38], f = tick * 2; c.moveTo(p1[0], p1[1]); c.lineTo(p1[0] + (p2[0] - p1[0]) * Math.min(1, f), p1[1] + (p2[1] - p1[1]) * Math.min(1, f)); if (f > 1) c.lineTo(p2[0] + (p3[0] - p2[0]) * (f - 1), p2[1] + (p3[1] - p2[1]) * (f - 1)); c.stroke(); }
    box(c, th, t, x0 + rowH * 1.0 + (W - rowH * 1.2) / 2, by, W - rowH * 1.3, rowH * 0.8, a.u * 34, th.ink, 1, 600); c.restore();
  });
};

/** Scenes start animating while the previous scene is still cross-fading (PRE seconds early), exactly like the other pro blocks. */
const pre = (b: Blk): Blk => (c, a, s, lt, d, th) => b(c, a, s, lt + PRE, d + PRE, th);
export const PRO2_BLOCKS: Record<string, Blk> = { donut: pre(donut), ring: pre(ring), gauge: pre(gauge), flow: pre(flow), funnel: pre(funnel), versus: pre(versus), candles: pre(candles), checklist: pre(checklist) };
