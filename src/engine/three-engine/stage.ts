// One shared WebGL renderer for all 3D scenes. A scene is built once per (recipe, params, theme, tier, size) and then only *posed* per frame,
// so every frame is a pure function of time (preview, scene re-render and MP4 export look identical).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { Theme } from '../../lib/motion/engine';
import { TIERS, chooseTier, exportTier, nextLower, FpsGovernor, type DeviceInfo, type Tier, type TierName } from './quality';
import { hashStr } from './layout';
import { RECIPES } from './recipes';
import type { Anchor, Built, Pal } from './types';

export interface ScreenLabel { x: number; y: number; text: string; sub?: string; at: number; fixed?: boolean }
export interface DrawReq { recipe: string; params: Record<string, any>; theme: Theme; lt: number; dur: number }
interface Entry { key: string; scene: THREE.Scene; built: Built; cam: THREE.PerspectiveCamera }

const palOf = (th: Theme): Pal => ({ bg0: new THREE.Color(th.bg0), bg1: new THREE.Color(th.bg1), acc: new THREE.Color(th.acc), acc2: new THREE.Color(th.acc2), ink: new THREE.Color(th.ink), doc: th.name === 'documentary' });

function disposeScene(scene: THREE.Scene) {
  scene.traverse((o: any) => {
    o.geometry?.dispose?.();
    for (const m of Array.isArray(o.material) ? o.material : o.material ? [o.material] : []) { m.map?.dispose?.(); m.dispose?.(); }
  });
}

class Stage {
  ok: boolean | null = null; // null = not tried yet
  tier: Tier = TIERS.medium; exporting = false; device: DeviceInfo = {};
  private canvas?: HTMLCanvasElement; private renderer?: THREE.WebGLRenderer; private composer?: EffectComposer; private rp?: RenderPass; private bloom?: UnrealBloomPass;
  private env: THREE.Texture | null = null; private cache: Entry[] = []; private gov = new FpsGovernor(); private size = '';
  lastError = '';

  private init() {
    if (this.ok !== null) return;
    try {
      const nav: any = navigator;
      this.canvas = document.createElement('canvas'); this.canvas.width = 16; this.canvas.height = 16;
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;
      const gl = this.renderer.getContext() as WebGL2RenderingContext, ext = gl.getExtension('WEBGL_debug_renderer_info');
      this.device = { cores: nav.hardwareConcurrency, memGB: nav.deviceMemory, gpu: ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : undefined };
      this.tier = TIERS[this.exporting ? exportTier(this.device) : chooseTier(this.device)];
      this.env = new THREE.PMREMGenerator(this.renderer).fromScene(new RoomEnvironment(), 0.04).texture;
      this.canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.ok = false; this.lastError = 'WebGL context lost'; this.cache = []; });
      this.ok = true;
    } catch (e: any) { this.ok = false; this.lastError = String(e?.message ?? e); }
  }
  setExport(on: boolean) { this.exporting = on; if (this.ok) this.setTier(on ? exportTier(this.device) : chooseTier(this.device)); }
  setTier(n: TierName) { if (this.tier.name === n) return; this.tier = TIERS[n]; this.flush(); this.size = ''; this.gov.reset(); }
  flush() { for (const e of this.cache) disposeScene(e.scene); this.cache = []; }

  private resize(w: number, h: number) {
    const pw = Math.max(16, Math.round(w * this.tier.pixelScale)), ph = Math.max(16, Math.round(h * this.tier.pixelScale)), k = `${pw}x${ph}|${this.tier.name}`;
    if (k === this.size) return; this.size = k;
    this.renderer!.setPixelRatio(1); this.renderer!.setSize(pw, ph, false);
    if (this.tier.bloom) {
      if (!this.composer) { this.composer = new EffectComposer(this.renderer!); this.rp = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera()); this.bloom = new UnrealBloomPass(new THREE.Vector2(pw, ph), 0.8, 0.6, 0.85); this.composer.addPass(this.rp); this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass()); }
      this.composer.setPixelRatio(1); this.composer.setSize(pw, ph); this.bloom!.strength = this.tier.bloomStrength;
    }
  }

  private entry(r: DrawReq, w: number, h: number): Entry | null {
    const key = `${r.recipe}|${JSON.stringify(r.params)}|${r.theme.name}|${this.tier.name}|${w}x${h}`;
    const hit = this.cache.find((e) => e.key === key); if (hit) { this.cache = [hit, ...this.cache.filter((e) => e !== hit)]; return hit; }
    const recipe = RECIPES[r.recipe]; if (!recipe) return null;
    const pal = palOf(r.theme), scene = new THREE.Scene(), aspect = w / h, fit = Math.min(1.9, Math.max(1, 1.3 / aspect));
    scene.background = pal.bg0.clone(); scene.fog = new THREE.FogExp2(pal.bg0.clone(), 0.03);
    if (this.tier.env) scene.environment = this.env;
    scene.add(new THREE.HemisphereLight(0xbfd4ff, pal.bg1.clone(), 0.5));
    const key1 = new THREE.DirectionalLight(0xffffff, 2.2); key1.position.set(5, 8, 6); scene.add(key1);
    const rim = new THREE.PointLight(pal.acc.clone(), 90, 0, 2); rim.position.set(-6, 3, -4); scene.add(rim);
    const cam = new THREE.PerspectiveCamera(aspect < 1 ? 52 : 40, aspect, 0.1, 200);
    const built = recipe({ scene, pal, tier: this.tier, params: r.params, seed: hashStr(r.recipe + JSON.stringify(r.params)), aspect, fit, env: this.env });
    const e: Entry = { key, scene, built, cam };
    this.cache.unshift(e); while (this.cache.length > 3) disposeScene(this.cache.pop()!.scene);
    return e;
  }

  /** Renders the scene and paints it onto `c` (full frame). Returns label anchors in screen pixels, or null when WebGL is unavailable (caller falls back to a 2D block). */
  draw(c: CanvasRenderingContext2D, w: number, h: number, r: DrawReq): ScreenLabel[] | null {
    this.init(); if (!this.ok) return null;
    const t0 = performance.now();
    try {
      this.resize(w, h);
      const e = this.entry(r, w, h); if (!e) return null;
      const anchors: Anchor[] = e.built.update(r.lt, r.dur, e.cam);
      e.cam.aspect = w / h; e.cam.updateProjectionMatrix(); e.scene.updateMatrixWorld(true);
      if (this.tier.bloom && this.composer && this.rp) { this.rp.scene = e.scene; this.rp.camera = e.cam; this.composer.render(); } else this.renderer!.render(e.scene, e.cam);
      c.drawImage(this.canvas!, 0, 0, w, h);
      const out: ScreenLabel[] = [];
      for (const a of anchors) { const v = a.p.clone().project(e.cam); if (v.z > 1 || !Number.isFinite(v.x)) continue; out.push({ x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, text: a.text, sub: a.sub, at: a.at, fixed: a.fixed }); }
      if (!this.exporting && this.gov.push(performance.now() - t0) === 'down') { const lo = nextLower(this.tier.name); if (lo) this.setTier(lo); }
      return out;
    } catch (err: any) { this.lastError = String(err?.message ?? err); this.ok = false; return null; }
  }
}
export const stage = new Stage();
export const setExportMode = (on: boolean) => stage.setExport(on);
