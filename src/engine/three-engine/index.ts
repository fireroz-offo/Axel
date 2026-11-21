// Bridge between the 2D motion engine and the 3D stage.
// Every 3D block: WebGL frame -> drawImage onto the normal 2D canvas, then 2D glass labels (projected from 3D points) and film grain on top.
// If WebGL is unavailable or fails, the block silently falls back to its 2D version (never a black frame).
import type { Area, Theme } from '../../lib/motion/engine';
import type { SceneSpec } from '../../lib/brain/plan';
import { spokenAt } from '../../lib/motion/pro';
import { stage, type ScreenLabel } from './stage';
import { E, seg } from './layout';
type C = CanvasRenderingContext2D;
export type Blk = (c: C, a: Area, s: SceneSpec, lt: number, dur: number, th: Theme) => void;

/** block name -> recipe name */
export const RECIPE_OF: Record<string, string> = { bars3d: 'chart3d', sphere3d: 'globe3d', coins3d: 'coins3d', city3d: 'city3d', exploded3d: 'exploded3d', atom3d: 'atom3d', helix3d: 'helix3d', planet3d: 'planet3d', network3d: 'network3d', road3d: 'road3d' };

const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');
function rr(c: C, x: number, y: number, w: number, h: number, r: number) { const k = Math.max(0, Math.min(r, w / 2, h / 2)); c.beginPath(); c.moveTo(x + k, y); c.arcTo(x + w, y, x + w, y + h, k); c.arcTo(x + w, y + h, x, y + h, k); c.arcTo(x, y + h, x, y, k); c.arcTo(x, y, x + w, y, k); c.closePath(); }

function drawLabels(c: C, W: number, H: number, a: Area, th: Theme, s: SceneSpec, lt: number, labels: ScreenLabel[]) {
  const px = a.u * 26;
  for (const l of labels) {
    const at = l.fixed ? l.at : spokenAt(s, l.sub ?? l.text, l.at), k = seg(lt, at, 0.4); if (k <= 0) continue;
    const sc = Math.max(0.01, E.back(k)), main = clip(l.text, 26), sub = l.sub ? clip(l.sub, 30) : '';
    c.save(); c.globalAlpha *= Math.min(1, k * 2);
    c.font = `700 ${Math.round(px)}px ${th.font}`; const mw = c.measureText(main).width;
    c.font = `500 ${Math.round(px * 0.72)}px ${th.font}`; const sw = sub ? c.measureText(sub).width : 0;
    const w = Math.max(mw, sw) + px * 1.4, h = px * (sub ? 2.55 : 1.8), pad = px * 0.6, x = Math.min(W - w / 2 - pad, Math.max(w / 2 + pad, l.x)), y = Math.min(H * 0.8 - h / 2, Math.max(h / 2 + pad, l.y - px * 1.5));
    c.translate(x, y); c.scale(sc, sc);
    c.shadowColor = th.acc; c.shadowBlur = px * 0.7; rr(c, -w / 2, -h / 2, w, h, h * 0.28); c.fillStyle = 'rgba(8,12,28,0.74)'; c.fill(); c.shadowBlur = 0;
    c.lineWidth = Math.max(1, px * 0.06); c.strokeStyle = th.acc + 'cc'; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = th.ink; c.font = `700 ${Math.round(px)}px ${th.font}`; c.fillText(main, 0, sub ? -px * 0.42 : 0);
    if (sub) { c.fillStyle = th.mut; c.font = `500 ${Math.round(px * 0.72)}px ${th.font}`; c.fillText(sub, 0, px * 0.62); }
    c.restore();
  }
}

let grainCv: HTMLCanvasElement | null = null;
function grain(c: C, W: number, H: number, lt: number) {
  if (typeof document === 'undefined') return;
  if (!grainCv) { grainCv = document.createElement('canvas'); grainCv.width = grainCv.height = 128; const g = grainCv.getContext('2d')!, d = g.createImageData(128, 128); let a = 12345; for (let i = 0; i < d.data.length; i += 4) { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; const v = (a >>> 24); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
  const f = Math.floor(Math.max(0, lt) * 24), pat = c.createPattern(grainCv, 'repeat'); if (!pat) return;
  c.save(); c.globalAlpha = 0.05; c.globalCompositeOperation = 'overlay'; c.translate((f * 37) % 128, (f * 91) % 128); c.fillStyle = pat; c.fillRect(-128, -128, W + 256, H + 256); c.restore();
}

/** `fallbacks`: 2D block functions (sphere3d, bars3d as before, hero for the new ones) supplied by engine.ts. */
export function makeThreeBlocks(fallbacks: Record<string, Blk>): Record<string, Blk> {
  const out: Record<string, Blk> = {};
  for (const [block, recipe] of Object.entries(RECIPE_OF)) {
    out[block] = (c, a, s, lt, dur, th) => {
      const W = c.canvas.width, H = c.canvas.height, labels = stage.draw(c, W, H, { recipe, params: s.params, theme: th, lt, dur });
      if (!labels) { // WebGL unavailable -> 2D fallback
        const fb = fallbacks[block];
        if (fb) fb(c, a, s, lt, dur, th); else fallbacks.hero(c, a, { ...s, block: 'hero', params: { title: clip(String(s.params.label ?? s.text), 34), sub: clip(s.text, 110), subject: s.params.subject } }, lt, dur, th);
        return;
      }
      drawLabels(c, W, H, a, th, s, lt, labels);
      if (s.params.synthetic) { c.save(); c.globalAlpha = 0.85; c.fillStyle = th.mut; c.font = `600 ${Math.round(a.u * 20)}px ${th.font}`; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText('उदाहरण (illustration)', a.x0, a.y0 - a.u * 4); c.restore(); }
      if (th.name === 'documentary') grain(c, W, H, lt);
    };
  }
  return out;
}
export { setExportMode, stage } from './stage';
