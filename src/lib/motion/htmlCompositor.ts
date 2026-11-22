import type { SceneSpec, Transition } from '../brain/plan';
import type { Theme } from './theme';
import type { InspectOptions, Inspector, PixelMetrics, TemplateMetrics } from './curator';

export interface MotionProRuntimeApi {
  createStage(options: Record<string, unknown>): HTMLElement;
  setTime(stage: HTMLElement, seconds: number): void;
  capture(stage: HTMLElement, seconds: number, width: number, height: number): Promise<HTMLCanvasElement>;
  removeStage(stage: HTMLElement): void;
  inspect(options: InspectOptions): TemplateMetrics;
  inspectPixels(options: InspectOptions): Promise<PixelMetrics>;
}

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const transitionDuration = 0.42;
const titleFor = (text: string) => {
  const words = text.trim().split(/\s+/);
  let title = words.slice(0, 7).join(' ');
  if (title.length > 58) title = title.slice(0, 57).trimEnd() + '…';
  return title || 'DIVRIZ AI';
};

/** Renders the supplied Motion Pro HTML/CSS animations by sampling their computed browser frames. */
export class MotionProCompositor implements Inspector {
  private iframe: HTMLIFrameElement;
  private api: MotionProRuntimeApi | null = null;
  private ready: Promise<void>;
  private stages = new Map<string, HTMLElement>();
  private width: number;
  private height: number;
  private disposed = false;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.iframe = document.createElement('iframe');
    this.iframe.title = 'DIVRIZ Motion Pro HTML renderer';
    this.iframe.setAttribute('aria-hidden', 'true');
    this.iframe.style.cssText = `position:fixed;left:-12000px;top:0;width:${width}px;height:${height}px;border:0;opacity:.01;pointer-events:none;z-index:-1`;
    this.iframe.src = new URL('motion-pro/index.html?runtime=1', document.baseURI).toString();
    document.body.appendChild(this.iframe);
    this.ready = new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Motion Pro HTML runtime load timeout.')), 20000);
      this.iframe.addEventListener('load', () => {
        window.clearTimeout(timer);
        try {
          const api = (this.iframe.contentWindow as any)?.MotionProRuntime as MotionProRuntimeApi | undefined;
          if (!api) throw new Error('Motion Pro runtime API missing.');
          this.api = api;
          resolve();
        } catch (e) { reject(e); }
      }, { once: true });
      this.iframe.addEventListener('error', () => { window.clearTimeout(timer); reject(new Error('Motion Pro HTML runtime could not load.')); }, { once: true });
    });
  }

  private async stageFor(scene: SceneSpec, theme: Theme, captions: boolean): Promise<HTMLElement> {
    await this.ready;
    if (this.disposed || !this.api) throw new Error('Motion Pro renderer is closed.');
    const p = scene.params ?? {};
    const id = Math.max(1, Math.min(171000, Math.round(Number(p.motionId) || 71001)));
    const key = `${scene.id}:${id}:${captions ? 1 : 0}`; // motionId in the key: swapping a scene's template must never reuse the old stage
    const cached = this.stages.get(key);
    if (cached) { this.stages.delete(key); this.stages.set(key, cached); return cached; }
    const title = String(p.headline || p.title || titleFor(scene.text));
    // With burned-in captions on, the template's own subtitle would duplicate the caption line, so leave it empty (runtime hides the placeholder).
    const subtitle = captions ? '' : String(p.sub || scene.text).slice(0, 180);
    const seed = Math.abs((id * 2654435761 + scene.id * 2246822519) | 0) % 999999;
    const stage = this.api.createStage({
      id, seed, width: this.width, height: this.height,
      duration: Math.max(1, scene.end - scene.start), title, subtitle,
      category: String(p.motionFilter || p.motionFamily || 'DIVRIZ AI'), data: p,
      accent: theme.acc, accent2: theme.acc2, bg0: theme.bg0, bg1: theme.bg1, ink: theme.ink
    });
    stage.style.display = 'none';
    this.stages.set(key, stage);
    while (this.stages.size > 4) { const oldest = this.stages.keys().next().value as string | undefined; if (oldest === undefined) break; const stale = this.stages.get(oldest); this.stages.delete(oldest); this.api.removeStage(stale!); }
    return stage;
  }

  private async sceneCanvas(scene: SceneSpec, localTime: number, theme: Theme, captions: boolean): Promise<HTMLCanvasElement> {
    const stage = await this.stageFor(scene, theme, captions);
    for (const el of this.stages.values()) el.style.display = el === stage ? 'block' : 'none';
    if (!this.api) throw new Error('Motion Pro runtime API unavailable.');
    return this.api.capture(stage, Math.max(0, localTime), this.width, this.height);
  }

  async renderFrame(scenes: SceneSpec[], time: number, theme: Theme, captions = true): Promise<HTMLCanvasElement> {
    if (!scenes.length) throw new Error('No scenes available for HTML motion render.');
    let index = scenes.length - 1;
    for (let i = 0; i < scenes.length; i++) if (time < scenes[i].end) { index = i; break; }
    const scene = scenes[index], next = scenes[index + 1];
    const local = Math.max(0, time - scene.start);
    const current = await this.sceneCanvas(scene, local, theme, captions);
    const output = document.createElement('canvas'); output.width = this.width; output.height = this.height;
    const ctx = output.getContext('2d', { alpha: false })!;
    ctx.fillStyle = theme.bg0; ctx.fillRect(0, 0, this.width, this.height); ctx.drawImage(current, 0, 0, this.width, this.height);

    if (next && time > scene.end - transitionDuration) {
      const progress = clamp((time - (scene.end - transitionDuration)) / transitionDuration);
      const nextFrame = await this.sceneCanvas(next, Math.max(0, time - next.start), theme, captions);
      ctx.save();
      switch (next.transition as Transition) {
        case 'slide': ctx.translate((1 - progress) * this.width, 0); break;
        case 'zoom': ctx.globalAlpha = progress; ctx.translate(this.width / 2, this.height / 2); ctx.scale(1.12 - 0.12 * progress, 1.12 - 0.12 * progress); ctx.translate(-this.width / 2, -this.height / 2); break;
        case 'wipe': ctx.beginPath(); ctx.rect(0, 0, this.width * progress, this.height); ctx.clip(); break;
        default: ctx.globalAlpha = progress;
      }
      ctx.drawImage(nextFrame, 0, 0, this.width, this.height);
      ctx.restore();
    }
    if (captions) this.drawCaption(ctx, scene, next, time);
    if (theme.vignette > 0) {
      const g = ctx.createRadialGradient(this.width / 2, this.height / 2, Math.min(this.width, this.height) * .34, this.width / 2, this.height / 2, Math.max(this.width, this.height) * .72);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${theme.vignette * .65})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, this.width, this.height);
    }
    if (theme.letterbox) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.width, this.height * .055); ctx.fillRect(0, this.height * .945, this.width, this.height * .055); }
    return output;
  }

  private drawCaption(ctx: CanvasRenderingContext2D, scene: SceneSpec, next: SceneSpec | undefined, time: number) {
    const s = next && time > scene.end - transitionDuration / 2 ? next : scene;
    const text = s.text.trim(); if (!text) return;
    const w = this.width, h = this.height, pad = Math.round(Math.min(w, h) * .045);
    const fontSize = Math.max(18, Math.round(Math.min(w, h) * .034));
    ctx.save(); ctx.font = `700 ${fontSize}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const words = text.split(/\s+/); const lines: string[] = []; let line = '';
    for (const word of words) { const trial = line ? `${line} ${word}` : word; if (ctx.measureText(trial).width > w * .84 && line) { lines.push(line); line = word; } else line = trial; }
    if (line) lines.push(line);
    const visible = lines.slice(0, 2), lineH = fontSize * 1.28, boxH = visible.length * lineH + pad * .8, y = h - Math.max(h * .105, boxH + h * .045);
    ctx.fillStyle = 'rgba(0,0,0,.58)'; const boxW = Math.min(w * .92, Math.max(...visible.map(x => ctx.measureText(x).width)) + pad * 1.8);
    ctx.beginPath(); ctx.roundRect((w - boxW) / 2, y - boxH / 2, boxW, boxH, Math.round(fontSize * .38)); ctx.fill();
    ctx.fillStyle = '#fff'; visible.forEach((l, i) => ctx.fillText(l, w / 2, y - ((visible.length - 1) * lineH) / 2 + i * lineH));
    ctx.restore();
  }

  /** Render one template invisibly and measure it (used by the curator to rank candidates). */
  async inspect(o: InspectOptions): Promise<TemplateMetrics> {
    await this.ready;
    if (this.disposed || !this.api) throw new Error('Motion Pro renderer is closed.');
    return this.api.inspect(o);
  }

  async inspectPixels(o: InspectOptions): Promise<PixelMetrics> {
    await this.ready;
    if (this.disposed || !this.api) throw new Error('Motion Pro renderer is closed.');
    return this.api.inspectPixels(o);
  }

  async dispose() {
    this.disposed = true;
    try { await this.ready; } catch { /* runtime may have failed to load */ }
    for (const stage of this.stages.values()) this.api?.removeStage(stage);
    this.stages.clear(); this.iframe.remove(); this.api = null;
  }
}
