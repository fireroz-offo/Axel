import { readZip } from '../src/lib/assets/zip';
import { bundleHtml } from '../src/lib/assets/bundle';
import { inspectHtml } from '../src/lib/assets/inspect';
import { AssetRuntime } from '../src/lib/assets/runtime';
import { applyAssets } from '../src/lib/assets/match';
(window as any).run = async (zipB64: string) => {
  const bin = Uint8Array.from(atob(zipB64), (c) => c.charCodeAt(0));
  const files = await readZip(bin.buffer);
  const b = bundleHtml(files); const info = inspectHtml(b.html, [], b.external);
  const def: any = { id: 'a1', name: 'growth', kind: 'html', html: b.html, tags: info.tags, category: info.category, duration: info.duration, libs: info.libs, hasSeek: info.hasSeek, warnings: info.warnings, size: b.html.length, createdAt: 0, enabled: true };
  const evil: any = { ...def, id: 'a2', name: 'evil', html: `<html><body style="margin:0;background:#000"><p id=p style="color:#fff;font:30px sans-serif">x</p><script>
    var r=[];try{parent.document.title;r.push('PARENT-ACCESS')}catch(e){r.push('parent-blocked')}
    try{localStorage.setItem('a','1');r.push('LS-ACCESS')}catch(e){r.push('ls-blocked')}
    fetch('https://example.com').then(function(){r.push('NET-OK')},function(){r.push('net-blocked')});
    window.divrizSeek=function(t){document.getElementById('p').textContent=r.join(',')+'|t='+t.toFixed(2)};</script></body></html>`, tags: [], libs: [], duration: 3 };
  const rt = new AssetRuntime(new Map([['a1', def], ['a2', evil]]), { w: 640, h: 360 }, () => ({ acc: '#ffb454', ink: '#fff', bg: '#000' }));
  const px = async (bm: ImageBitmap, x: number, y: number) => { const c = new OffscreenCanvas(bm.width, bm.height), g = c.getContext('2d')!; g.drawImage(bm, 0, 0); const d = g.getImageData(x, y, 1, 1).data; return [d[0], d[1], d[2], d[3]]; };
  const t0 = Date.now();
  const f0 = await rt.capture(def, 0, { text: 'हेलो DIVRIZ', ...{ acc: '#fff' } });
  const f1 = await rt.capture(def, 1, { text: 'हेलो DIVRIZ' });
  const f1b = await rt.capture(def, 1, { text: 'हेलो DIVRIZ' });
  const ev = await rt.capture(evil, 1.5, {});
  // box is 100x100 at left = 800*t/2 : t=0 -> x 0..100 ; t=1 -> x 400..500 (in 640-wide frame the layout width is 640)
  const out: any = { ms: Date.now() - t0, bundle: { entry: b.entry, external: b.external, missing: b.missing, hasImgData: /data:image\/svg/.test(b.html), hasLink: /<link/.test(b.html) }, info,
    t0_boxPixel_x50: await px(f0, 50, 150), t0_x450: await px(f0, 450, 150), t1_x450: await px(f1, 450, 150), t1_x50: await px(f1, 50, 150),
    deterministic: JSON.stringify(await px(f1, 450, 150)) === JSON.stringify(await px(f1b, 450, 150)), iconPixel: await px(f0, 50, 430), size: [f0.width, f0.height] };
  // draw evil frame to a visible canvas for a human check + read its text through a screenshot
  const cv = document.createElement('canvas'); cv.id = 'evil'; cv.width = 640; cv.height = 360; cv.getContext('2d')!.drawImage(ev, 0, 0); document.body.appendChild(cv);
  const cv2 = document.createElement('canvas'); cv2.id = 'good'; cv2.width = 640; cv2.height = 360; cv2.getContext('2d')!.drawImage(f1, 0, 0); document.body.appendChild(cv2);
  // matcher
  const scenes: any[] = [{ id: 0, text: 'intro', start: 0, end: 3, block: 'title', params: {} }, { id: 1, text: 'growth chart of money 100 200 300', start: 3, end: 8, block: 'bars', params: {} }, { id: 2, text: 'ek saadha vaakya', start: 8, end: 12, block: 'callout', params: {} }];
  out.match = applyAssets(scenes, [def], 'finance').map((s) => s.block);
  rt.dispose(); return out;
};
