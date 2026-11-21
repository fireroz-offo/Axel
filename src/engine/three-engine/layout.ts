// Pure maths for the 3D recipes (no Three.js import => unit-testable in Node).
// Everything is deterministic: same seed/params => same layout, so preview and MP4 export match.
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t: number, a: number, d: number) => clamp((t - a) / d);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const E = {
  out: (x: number) => 1 - Math.pow(1 - clamp(x), 3),
  inout: (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  back: (x: number) => { const c1 = 1.70158, c3 = c1 + 1, t = clamp(x); return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
};
export const hashStr = (s: string): number => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const fin = (v: number) => (Number.isFinite(v) ? v : 0);

/** bar heights 0.06..1 (proportional to the real values; never zero so a bar is always visible) */
export function barLayout(values: number[]): number[] {
  const m = Math.max(1e-9, ...values.map((v) => Math.abs(fin(v))));
  return values.map((v) => clamp(Math.abs(fin(v)) / m, 0.06, 1));
}
/** coins per column, proportional to value (at least 1) */
export function coinCounts(values: number[], maxCoins: number): number[] {
  const m = Math.max(1e-9, ...values.map((v) => Math.max(0, fin(v))));
  return values.map((v) => Math.max(1, Math.round(clamp(Math.max(0, fin(v)) / m) * maxCoins)));
}
/** illustration-only growth curve (the scene is labelled "उदाहरण (illustration)"; never presented as real data) */
export function syntheticGrowth(n: number, dir: 'up' | 'down' = 'up'): number[] {
  const a = Array.from({ length: n }, (_, i) => Math.pow(1.55, i));
  return dir === 'down' ? a.reverse() : a;
}
export const fmtNum = (v: number, dec = 2) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: dec }).format(fin(v));

export interface Block3 { x: number; z: number; w: number; d: number; h: number; hue: number; dist: number }
export function cityBlocks(seed: number, grid: number): Block3[] {
  const r = rng(seed), cell = 1.9, out: Block3[] = [];
  for (let i = 0; i < grid; i++) for (let j = 0; j < grid; j++) {
    if (r() > 0.88) continue;
    const x = (i - (grid - 1) / 2) * cell, z = (j - (grid - 1) / 2) * cell, dist = Math.hypot(x, z);
    const cb = 1 - Math.min(1, dist / (grid * cell * 0.6));
    const h = (0.5 + Math.pow(r(), 2.2) * 4.2) * (0.6 + 0.9 * cb);
    out.push({ x, z, w: 0.9 + r() * 0.5, d: 0.9 + r() * 0.5, h, hue: r(), dist });
  }
  return out;
}
/** y of each slab in an exploded view; e = 0 (stacked) .. 1 (fully exploded). Centre stays at `mid`. */
export function explodedY(n: number, e: number, mid = 2.4): number[] {
  const step = 0.28 + 1.1 * clamp(e), span = (n - 1) * step;
  return Array.from({ length: n }, (_, i) => mid - span / 2 + i * step);
}
export function helixPoints(n: number, turns: number, R: number, H: number) {
  const a: number[][] = [], b: number[][] = [];
  for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 0, ang = u * turns * Math.PI * 2, y = (u - 0.5) * H; a.push([R * Math.cos(ang), y, R * Math.sin(ang)]); b.push([R * Math.cos(ang + Math.PI), y, R * Math.sin(ang + Math.PI)]); }
  return { a, b };
}
export function fibonacci(n: number, R: number): Float32Array {
  const out = new Float32Array(n * 3), g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) { const y = n > 1 ? 1 - (i / (n - 1)) * 2 : 0, r = Math.sqrt(Math.max(0, 1 - y * y)), t = g * i; out[i * 3] = Math.cos(t) * r * R; out[i * 3 + 1] = y * R; out[i * 3 + 2] = Math.sin(t) * r * R; }
  return out;
}
export function nucleus(n: number, r: number): number[][] {
  const f = fibonacci(n, 1), out: number[][] = [];
  for (let i = 0; i < n; i++) { const k = r * Math.cbrt((i + 0.5) / n); out.push([f[i * 3] * k, f[i * 3 + 1] * k, f[i * 3 + 2] * k]); }
  return out;
}
/** line-segment pairs for a lat/long grid on a sphere */
export function graticule(R: number, step = 30, sg = 48): Float32Array {
  const pts: number[] = [], P = (lat: number, lon: number) => latLon(lat, lon, R);
  for (let lat = -60; lat <= 60; lat += step) for (let i = 0; i < sg; i++) pts.push(...P(lat, (i / sg) * 360 - 180), ...P(lat, ((i + 1) / sg) * 360 - 180));
  for (let lon = -180; lon < 180; lon += step) for (let i = 0; i < sg; i++) pts.push(...P(-90 + (i / sg) * 180, lon), ...P(-90 + ((i + 1) / sg) * 180, lon));
  return new Float32Array(pts);
}
export const latLon = (lat: number, lon: number, R: number): [number, number, number] => {
  const p = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180;
  return [R * Math.cos(p) * Math.sin(l), R * Math.sin(p), R * Math.cos(p) * Math.cos(l)];
};
/** great-circle arc lifted off the surface; decorative only (no real route data) */
export function arcPoints(a: [number, number], b: [number, number], sg: number, R: number, lift: number): Float32Array {
  const v1 = latLon(a[0], a[1], 1), v2 = latLon(b[0], b[1], 1), dot = clamp(v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2], -1, 1), w = Math.acos(dot), sw = Math.sin(w);
  const out = new Float32Array((sg + 1) * 3);
  for (let i = 0; i <= sg; i++) {
    const s = i / sg, k1 = sw < 1e-4 ? 1 - s : Math.sin((1 - s) * w) / sw, k2 = sw < 1e-4 ? s : Math.sin(s * w) / sw, rr = R * (1 + lift * Math.sin(Math.PI * s) * Math.min(1, (w / Math.PI) * 1.4));
    for (let c = 0; c < 3; c++) out[i * 3 + c] = (v1[c] * k1 + v2[c] * k2) * rr;
  }
  return out;
}
export const CITIES: Array<[string, number, number]> = [['Delhi', 28.6, 77.2], ['London', 51.5, -0.1], ['New York', 40.7, -74], ['Tokyo', 35.7, 139.7], ['Sydney', -33.9, 151.2], ['São Paulo', -23.5, -46.6], ['Dubai', 25.2, 55.3], ['Singapore', 1.35, 103.8], ['Cairo', 30, 31.2], ['Johannesburg', -26.2, 28], ['Moscow', 55.8, 37.6], ['Beijing', 39.9, 116.4], ['San Francisco', 37.8, -122.4]];

export interface Graph { pos: Float32Array; edges: Array<[number, number]>; deg: number[]; hubs: number[] }
export function networkGraph(seed: number, n: number, k = 2): Graph {
  const r = rng(seed), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = r() * Math.PI * 2, c = 2 * r() - 1, s = Math.sqrt(1 - c * c), rad = 4 * Math.cbrt(r()); pos[i * 3] = Math.cos(th) * s * rad; pos[i * 3 + 1] = c * rad * 0.65; pos[i * 3 + 2] = Math.sin(th) * s * rad; }
  const seen = new Set<string>(), edges: Array<[number, number]> = [], deg = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const d: Array<[number, number]> = [];
    for (let j = 0; j < n; j++) if (j !== i) d.push([Math.hypot(pos[i * 3] - pos[j * 3], pos[i * 3 + 1] - pos[j * 3 + 1], pos[i * 3 + 2] - pos[j * 3 + 2]), j]);
    d.sort((x, y) => x[0] - y[0]);
    for (let q = 0; q < Math.min(k, d.length); q++) { const j = d[q][1], key = i < j ? `${i}-${j}` : `${j}-${i}`; if (seen.has(key)) continue; seen.add(key); edges.push([i, j]); deg[i]++; deg[j]++; }
  }
  const hubs = deg.map((v, i) => [v, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]).map((x) => x[1]);
  return { pos, edges, deg, hubs };
}
/** control points (x,z) of a gentle S-shaped road running away from the camera; n events + start/end margin */
export function roadPath(n: number, seed: number): Array<[number, number]> {
  const r = rng(seed), ph = r() * 6.28, m = Math.max(2, n) + 2;
  return Array.from({ length: m }, (_, i) => [Math.sin(i * 0.95 + ph) * 3.2, -i * 7] as [number, number]);
}
/** u (0..1 along road) of event i of n */
export const eventU = (i: number, n: number) => (i + 1) / (n + 1);
/** inverse of E.inout (bisection): the time fraction at which the eased camera reaches progress `target` */
export function solveInOut(target: number): number {
  let lo = 0, hi = 1; const t = clamp(target);
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (E.inout(mid) < t) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
/** flat ribbon (road surface) along 3D points: positions + triangle indices */
export function ribbonStrip(pts: number[][], width: number): { pos: Float32Array; idx: Uint32Array } {
  const n = pts.length, pos = new Float32Array(n * 6), idx = new Uint32Array(Math.max(0, n - 1) * 6);
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)], tx = p1[0] - p0[0], tz = p1[2] - p0[2], l = Math.hypot(tx, tz) || 1, nx = -tz / l, nz = tx / l, h = width / 2;
    pos.set([pts[i][0] + nx * h, pts[i][1], pts[i][2] + nz * h, pts[i][0] - nx * h, pts[i][1], pts[i][2] - nz * h], i * 6);
  }
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.set([a, a + 1, a + 2, a + 1, a + 3, a + 2], i * 6); }
  return { pos, idx };
}
/** circular camera path helper */
export const orbit = (u: number, r: number, a0: number, a1: number, y: number): [number, number, number] => { const a = lerp(a0, a1, E.inout(u)); return [Math.sin(a) * r, y, Math.cos(a) * r]; };
