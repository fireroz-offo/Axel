// Turns a ZIP of HTML/CSS/JS/images into ONE self-contained HTML string (everything inlined). Network references are removed and reported.
const MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf', mp3: 'audio/mpeg', json: 'application/json' };
const ext = (p: string) => p.split('.').pop()?.toLowerCase() ?? '';
const dirOf = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '');
const isRemote = (u: string) => /^(https?:)?\/\//i.test(u.trim());
const isData = (u: string) => /^(data|blob|#|about:)/i.test(u.trim());
function resolve(base: string, ref: string): string {
  const parts = (base + ref.split(/[?#]/)[0]).split('/'), out: string[] = [];
  for (const p of parts) { if (p === '..') out.pop(); else if (p && p !== '.') out.push(p); }
  return out.join('/');
}
function toData(bytes: Uint8Array, path: string): string {
  let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${MIME[ext(path)] ?? 'application/octet-stream'};base64,${btoa(bin)}`;
}
export interface Bundled { html: string; entry: string; external: string[]; missing: string[]; files: number }

export function bundleHtml(files: Map<string, Uint8Array>, entry?: string): Bundled {
  const names = [...files.keys()];
  const ent = entry ?? names.find((n) => /(^|\/)index\.html?$/i.test(n)) ?? names.find((n) => /\.html?$/i.test(n));
  if (!ent) throw new Error('ZIP mein koi .html file nahi mili.');
  const dec = new TextDecoder(), external = new Set<string>(), missing: string[] = [];
  const get = (base: string, ref: string) => { const p = resolve(base, ref), f = files.get(p) ?? files.get(decodeURIComponent(p)); if (!f) missing.push(ref); return f ? { f, p } : null; };
  const cssInline = (css: string, base: string): string =>
    css.replace(/@import\s+(?:url\()?['"]?([^'")]+)['"]?\)?[^;]*;/g, (_m, u: string) => { if (isRemote(u)) { external.add(u); return ''; } const g = get(base, u); return g ? cssInline(dec.decode(g.f), dirOf(g.p)) : ''; })
      .replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, _q, u: string) => { if (isData(u)) return m; if (isRemote(u)) { external.add(u); return 'none'; } const g = get(base, u); return g ? `url("${toData(g.f, g.p)}")` : 'none'; });
  const doc = new DOMParser().parseFromString(dec.decode(files.get(ent)!), 'text/html'), base = dirOf(ent);
  doc.querySelectorAll('link[rel~="stylesheet"]').forEach((l) => {
    const href = l.getAttribute('href') ?? '';
    if (isRemote(href)) { external.add(href); l.remove(); return; }
    const g = get(base, href); if (!g) { l.remove(); return; }
    const st = doc.createElement('style'); st.textContent = cssInline(dec.decode(g.f), dirOf(g.p)); l.replaceWith(st);
  });
  doc.querySelectorAll('link:not([rel~="stylesheet"])').forEach((l) => l.remove());
  doc.querySelectorAll('style').forEach((st) => { st.textContent = cssInline(st.textContent ?? '', base); });
  doc.querySelectorAll('script[src]').forEach((sc) => {
    const src = sc.getAttribute('src') ?? '';
    if (isRemote(src)) { external.add(src); sc.remove(); return; }
    const g = get(base, src); if (!g) { sc.remove(); return; }
    const n = doc.createElement('script'); n.textContent = dec.decode(g.f).replace(/<\/script/gi, '<\\/script'); sc.replaceWith(n);
  });
  doc.querySelectorAll('[src],[href],[poster]').forEach((el) => {
    for (const attr of ['src', 'href', 'poster']) {
      const v = el.getAttribute(attr); if (!v || isData(v)) continue;
      if (el.tagName === 'A') continue;
      if (isRemote(v)) { external.add(v); el.removeAttribute(attr); continue; }
      const g = get(base, v); if (g) el.setAttribute(attr, toData(g.f, g.p)); else el.removeAttribute(attr);
    }
  });
  doc.querySelectorAll('[style]').forEach((el) => el.setAttribute('style', cssInline(el.getAttribute('style') ?? '', base)));
  return { html: '<!DOCTYPE html>' + doc.documentElement.outerHTML, entry: ent, external: [...external], missing: [...new Set(missing)], files: files.size };
}
