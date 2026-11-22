import JSZip from 'jszip';

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif',
  woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf', mp3: 'audio/mpeg', mp4: 'video/mp4',
};
const ext = (p: string) => (p.split('.').pop() || '').toLowerCase();

function resolve(base: string, ref: string): string {
  const parts = (base.includes('/') ? base.slice(0, base.lastIndexOf('/') + 1) : '').split('/').filter(Boolean);
  for (const seg of ref.split('?')[0].split('#')[0].split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/');
}

/** Reads a zip project (index.html + css/js/images/fonts) and returns ONE self-contained html string. */
export async function importZip(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir && !n.startsWith('__MACOSX'));
  const htmlName = names.find((n) => /(^|\/)index\.html?$/i.test(n)) || names.find((n) => /\.html?$/i.test(n));
  if (!htmlName) throw new Error('Zip me koi .html file nahi mili');
  const find = (ref: string, from: string) => {
    if (/^(data:|https?:|\/\/|#|blob:)/i.test(ref)) return null;
    const p = resolve(from, decodeURIComponent(ref));
    return names.find((n) => n === p) || names.find((n) => n.toLowerCase() === p.toLowerCase()) || null;
  };
  const dataUrl = async (n: string) => `data:${MIME[ext(n)] || 'application/octet-stream'};base64,${await zip.files[n].async('base64')}`;

  const inlineCss = async (css: string, from: string): Promise<string> => {
    const re = /url\(\s*(['"]?)([^)'"]+)\1\s*\)/g;
    const jobs: Promise<[string, string]>[] = [];
    css.replace(re, (m, _q, ref: string) => {
      const n = find(ref, from);
      if (n) jobs.push(dataUrl(n).then((d): [string, string] => [m, `url("${d}")`]));
      return m;
    });
    for (const [m, r] of await Promise.all(jobs)) css = css.split(m).join(r);
    return css;
  };

  let html = await zip.files[htmlName].async('string');
  const doc = new DOMParser().parseFromString(html, 'text/html');

  for (const link of Array.from(doc.querySelectorAll('link[rel~="stylesheet"][href]'))) {
    const n = find(link.getAttribute('href') || '', htmlName);
    if (!n) continue;
    const st = doc.createElement('style');
    st.textContent = await inlineCss(await zip.files[n].async('string'), n);
    link.replaceWith(st);
  }
  for (const sc of Array.from(doc.querySelectorAll('script[src]'))) {
    const n = find(sc.getAttribute('src') || '', htmlName);
    if (!n) continue;
    const s2 = doc.createElement('script');
    s2.textContent = (await zip.files[n].async('string')).replace(/<\/script/gi, '<\\/script');
    sc.replaceWith(s2);
  }
  for (const el of Array.from(doc.querySelectorAll('[src],[poster]'))) {
    for (const attr of ['src', 'poster']) {
      const ref = el.getAttribute(attr);
      const n = ref ? find(ref, htmlName) : null;
      if (n) el.setAttribute(attr, await dataUrl(n));
    }
  }
  for (const st of Array.from(doc.querySelectorAll('style'))) st.textContent = await inlineCss(st.textContent || '', htmlName);
  for (const el of Array.from(doc.querySelectorAll('[style]'))) el.setAttribute('style', await inlineCss(el.getAttribute('style') || '', htmlName));

  html = '<!doctype html>\n' + doc.documentElement.outerHTML;
  return html;
}
