import RUNTIME from './runtime.js?raw';

export type KF = { t: number; x: number; y: number; s: number; r: number; o: number; e: string };
export type Meta = { w: number; h: number; fps: number; dur: number };
export type Proj = { meta: Meta; kf: Record<string, KF[]> };
export type Layer = { id: string; tag: string; label: string; selector: string; text: string; kind: string };

export const DEFAULT_META: Meta = { w: 1280, h: 720, fps: 30, dur: 10 };
export const FORMATS: { name: string; w: number; h: number }[] = [
  { name: 'YouTube 16:9 · 720p', w: 1280, h: 720 },
  { name: 'YouTube 16:9 · 1080p', w: 1920, h: 1080 },
  { name: 'Reels / Shorts 9:16 · 720p', w: 720, h: 1280 },
  { name: 'Reels / Shorts 9:16 · 1080p', w: 1080, h: 1920 },
  { name: 'Square 1:1 · 1080', w: 1080, h: 1080 },
  { name: 'Instagram 4:5 · 1080', w: 1080, h: 1350 },
];
export const EASES = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'cubic-bezier(.34,1.56,.64,1)'];
export const EASE_LABEL: Record<string, string> = {
  'linear': 'Linear', 'ease': 'Smooth', 'ease-in': 'Ease In', 'ease-out': 'Ease Out', 'ease-in-out': 'Ease In-Out', 'cubic-bezier(.34,1.56,.64,1)': 'Bounce',
};
export const DEFAULT_KF: Omit<KF, 't'> = { x: 0, y: 0, s: 100, r: 0, o: 100, e: 'ease' };

export const STARTER = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}
body{margin:0;background:#080d1b;color:white;font-family:Arial,sans-serif;overflow:hidden}
.scene{height:100vh;display:grid;place-items:center;text-align:center;background:radial-gradient(circle at 50% 40%,#1d4ed8,#101a38 42%,#080d1b 78%)}
.card{padding:32px 48px;border:1px solid #ffffff35;border-radius:28px;background:#ffffff12;animation:rise 1s both}
.kicker{letter-spacing:5px;color:#93c5fd;font-size:16px}
.title{font-size:84px;font-weight:900;margin:16px 0}
.title span{color:#60a5fa}
.sub{color:#cbd5e1;font-size:24px;animation:rise 1s .8s both}
@keyframes rise{from{opacity:0;transform:translateY(50px) scale(.92)}to{opacity:1;transform:translateY(0) scale(1)}}
</style></head><body><main class="scene"><section class="card"><div class="kicker">DIVRIZ PRESENTS</div><h1 class="title">MOTION <span>STUDIO</span></h1><p class="sub">Create anything. Animate everything.</p></section></main></body></html>`;

/** Project data (size, fps, duration, editor keyframes) lives inside the HTML itself as an inert JSON block. */
export function readProj(code: string): Proj {
  try {
    const d = new DOMParser().parseFromString(code, 'text/html');
    const s = d.getElementById('divriz-project');
    if (s && s.textContent) {
      const j = JSON.parse(s.textContent);
      return { meta: { ...DEFAULT_META, ...(j.meta || {}) }, kf: j.kf || {} };
    }
  } catch {
    /* ignore broken json */
  }
  return { meta: { ...DEFAULT_META }, kf: {} };
}

export function serialize(d: Document): string {
  return '<!doctype html>\n' + d.documentElement.outerHTML;
}

export function writeProj(code: string, p: Proj): string {
  const d = new DOMParser().parseFromString(code, 'text/html');
  let s = d.getElementById('divriz-project');
  if (!s) {
    s = d.createElement('script');
    s.id = 'divriz-project';
    s.setAttribute('type', 'application/json');
    d.head.appendChild(s);
  }
  s.textContent = JSON.stringify(p);
  return serialize(d);
}

/** What the preview iframe / exporter actually loads: project html + runtime engine (never saved into the project). */
export function buildDoc(code: string): string {
  const tag = '<script id="divriz-runtime">' + RUNTIME + '</' + 'script>';
  if (/<head[^>]*>/i.test(code)) return code.replace(/<head[^>]*>/i, (m) => m + tag);
  if (/<html[^>]*>/i.test(code)) return code.replace(/<html[^>]*>/i, (m) => m + '<head>' + tag + '</head>');
  return '<!doctype html><head>' + tag + '</head>' + code;
}

export function scanLayers(code: string): { layers: Layer[]; code: string } {
  const doc = new DOMParser().parseFromString(code, 'text/html');
  const els = Array.from(doc.body.querySelectorAll('*')).filter((el) => !['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'].includes(el.tagName));
  let n = 0;
  const used = new Set<string>();
  els.forEach((el) => { const v = el.getAttribute('data-divriz-id'); if (v) used.add(v); });
  const layers: Layer[] = els.slice(0, 250).map((el, i) => {
    let id = el.getAttribute('data-divriz-id');
    if (!id) {
      do { n++; id = 'L' + n; } while (used.has(id));
      used.add(id);
      el.setAttribute('data-divriz-id', id);
    }
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 48);
    const own = Array.from(el.childNodes).some((c) => c.nodeType === 3 && (c.textContent || '').trim());
    const kind = tag === 'img' ? 'Image' : tag === 'svg' ? 'SVG' : tag === 'video' ? 'Video' : tag === 'canvas' ? 'Canvas' : own ? 'Text' : 'Shape / Container';
    return { id, tag, label: text || `${tag.toUpperCase()} ${i + 1}`, selector: `[data-divriz-id="${id}"]`, text: own ? text : '', kind };
  });
  return { layers, code: serialize(doc) };
}

export function mutate(code: string, selector: string, fn: (el: HTMLElement) => void): string {
  const doc = new DOMParser().parseFromString(code, 'text/html');
  const el = doc.querySelector(selector) as HTMLElement | null;
  if (!el) return code;
  fn(el);
  return serialize(doc);
}

export function readInline(code: string, selector: string) {
  const doc = new DOMParser().parseFromString(code, 'text/html');
  const el = doc.querySelector(selector) as HTMLElement | null;
  const get = (k: string, fb: string) => (el && el.style.getPropertyValue(k)) || fb;
  const hex = (v: string, fb: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : fb);
  return {
    color: hex(get('color', ''), '#ffffff'),
    bg: hex(get('background-color', ''), '#000000'),
    size: parseFloat(get('font-size', '')) || 48,
    opacity: Math.round((parseFloat(get('opacity', '1')) || 1) * 100),
  };
}

export const roundEven = (n: number) => Math.max(2, Math.round(n / 2) * 2);
export const fmt = (t: number) => t.toFixed(2).replace(/\.?0+$/, '') || '0';
