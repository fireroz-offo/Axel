// Quality tiers for 3D scenes. Pure logic (no Three.js) so it can be unit-tested.
// Preview adapts to the phone while it plays; MP4 export is frame-by-frame, so it always uses the best tier the device can hold in memory.
export type TierName = 'high' | 'medium' | 'low';
export interface Tier { name: TierName; pixelScale: number; bloom: boolean; bloomStrength: number; env: boolean; particles: number; stars: number; segments: number; maxCoins: number; cityGrid: number; nodes: number; helix: number }
export const TIERS: Record<TierName, Tier> = {
  high: { name: 'high', pixelScale: 1, bloom: true, bloomStrength: 0.85, env: true, particles: 1400, stars: 3000, segments: 48, maxCoins: 24, cityGrid: 11, nodes: 90, helix: 44 },
  medium: { name: 'medium', pixelScale: 0.75, bloom: true, bloomStrength: 0.6, env: true, particles: 500, stars: 1200, segments: 32, maxCoins: 16, cityGrid: 8, nodes: 60, helix: 32 },
  low: { name: 'low', pixelScale: 0.5, bloom: false, bloomStrength: 0, env: false, particles: 120, stars: 400, segments: 20, maxCoins: 10, cityGrid: 6, nodes: 36, helix: 22 }
};
export interface DeviceInfo { cores?: number; memGB?: number; gpu?: string }
const WEAK_GPU = /swiftshader|llvmpipe|software|softpipe|mali-4|mali-t[0-7]|adreno \(tm\) ?[2-5]\d\d\b|powervr sgx/i;
export function chooseTier(d: DeviceInfo): TierName {
  if (d.gpu && WEAK_GPU.test(d.gpu)) return 'low';
  const mem = d.memGB ?? 4, cores = d.cores ?? 4;
  if (mem <= 3 || cores <= 4) return 'low';
  if (mem >= 6 && cores >= 8) return 'high';
  return 'medium';
}
/** export tier: frames get all the time they need, so only RAM decides */
export const exportTier = (d: DeviceInfo): TierName => ((d.memGB ?? 4) <= 3 ? 'low' : (d.memGB ?? 4) <= 4 ? 'medium' : 'high');
export const nextLower = (t: TierName): TierName | null => (t === 'high' ? 'medium' : t === 'medium' ? 'low' : null);
/** Moving average of frame times; says "down" when the preview cannot keep ~22 fps for a full window. */
export class FpsGovernor {
  private n = 0; private sum = 0; private limitMs: number; private window: number;
  constructor(limitMs = 45, window = 24) { this.limitMs = limitMs; this.window = window; }
  push(ms: number): 'down' | null { if (!Number.isFinite(ms)) return null; this.sum += ms; this.n++; if (this.n < this.window) return null; const avg = this.sum / this.n; this.reset(); return avg > this.limitMs ? 'down' : null; }
  reset() { this.n = 0; this.sum = 0; }
}
