import { renderVideo } from '../src/lib/render/renderVideo';
import { THEMES } from '../src/lib/motion/engine';
import { AssetRuntime } from '../src/lib/assets/runtime';
import { planBitrate } from '../src/lib/render/budget';
import { opfsStreaming } from '../src/lib/render/output';
(window as any).run = async () => {
  const html = `<html><head><style>html,body{margin:0;background:transparent}#b{position:absolute;top:100px;left:0;width:200px;height:200px;background:#0f0;animation:m 3s linear infinite}@keyframes m{to{left:1000px}}</style></head><body><div id=b></div></body></html>`;
  const def: any = { id: 'a1', name: 't', kind: 'html', html, tags: [], category: 'other', duration: 3, libs: [], hasSeek: false, warnings: [], size: 1, createdAt: 0, enabled: true };
  const rt = new AssetRuntime(new Map([['a1', def]]), { w: 1280, h: 720 }, () => ({ acc: '#fa0', ink: '#fff', bg: '#000' }));
  const mk = (id: number, s: number, e: number, block: string, params: any): any => ({ id, text: 'demo text', start: s, end: e, block, params, words: [], transition: 'fade', camera: { z0: 1, z1: 1.02, px: 0 }, reason: '' });
  const scenes = [mk(0, 0, 2, 'title', { text: 'Test' }), mk(1, 2, 5, 'asset', { assetId: 'a1', fallback: 'demo' }), mk(2, 5, 6, 'end', { text: 'bas' })];
  let last = 0;
  const r = await renderVideo({ scenes, theme: THEMES.explanation, aspect: '16:9', fps: 24, duration: 6, captions: false, audio: null, sampleRate: 48000, assets: rt, quality: 'balanced', maxMB: 100, onProgress: (p) => { last = p; } });
  const stats = (window as any).__stats;
  const out = { frames: r.frames, ms: Math.round(r.ms), streaming: r.streaming, opfs: opfsStreaming(), videoBps: r.videoBps, capped: r.capped, failed: [...rt.failed.entries()], vChunks: stats.v, vBytes: stats.vBytes, last,
    budget: { tenMinBalanced: planBitrate({ width: 1280, height: 720, fps: 30, duration: 600, quality: 'balanced', maxMB: 100, hasAudio: true }), tenMinHigh60: planBitrate({ width: 1280, height: 720, fps: 30, duration: 600, quality: 'high', maxMB: 200, hasAudio: true }), oneHourHigh: planBitrate({ width: 1280, height: 720, fps: 30, duration: 3600, quality: 'high', maxMB: 200, hasAudio: true }) } };
  rt.dispose(); return out;
};
