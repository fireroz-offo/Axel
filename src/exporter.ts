import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export type ExportOpts = {
  w: number;
  h: number;
  fps: number;
  dur: number;
  bpp: number; // bits per pixel per frame: 0.12 normal, 0.2 high, 0.3 max
  frame: (t: number) => Promise<string>; // returns SVG(foreignObject) string of the page at time t
  onProgress: (done: number, total: number) => void;
  signal: { cancelled: boolean };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function drawSvg(ctx: CanvasRenderingContext2D, svg: string, w: number, h: number) {
  // NOTE: must be a data: URL — a blob: URL taints the canvas in Chromium and VideoFrame creation then fails.
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
}

export async function exportMp4(o: ExportOpts): Promise<Uint8Array> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
    throw new Error('Is WebView/browser me WebCodecs (VideoEncoder) nahi hai. "Android System WebView" aur Chrome ko Play Store se update karo.');
  }
  const w = o.w - (o.w % 2), h = o.h - (o.h % 2);
  const total = Math.max(1, Math.round(o.dur * o.fps));
  const base = { width: w, height: h, bitrate: Math.round(w * h * o.fps * o.bpp), framerate: o.fps };

  let codec = '';
  for (const c of ['avc1.64002A', 'avc1.4D002A', 'avc1.42002A']) {
    try {
      const r = await VideoEncoder.isConfigSupported({ codec: c, ...base });
      if (r.supported) { codec = c; break; }
    } catch {
      /* try next */
    }
  }
  if (!codec) throw new Error(`Is device pe ${w}x${h} H.264 encoder supported nahi hai. Chhota resolution (720p) ya kam FPS try karo.`);

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({ target, video: { codec: 'avc', width: w, height: h }, fastStart: 'in-memory' });
  const st: { err: Error | null } = { err: null };
  const enc = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { st.err = e instanceof Error ? e : new Error(String(e)); },
  });
  enc.configure({ codec, ...base });

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas available nahi hai');

  try {
    for (let i = 0; i < total; i++) {
      if (o.signal.cancelled) throw new Error('Export cancel kiya');
      if (st.err) throw st.err;
      const svg = await o.frame(i / o.fps);
      await drawSvg(ctx, svg, w, h);
      const vf = new VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / o.fps), duration: Math.round(1e6 / o.fps) });
      enc.encode(vf, { keyFrame: i % Math.max(1, o.fps * 2) === 0 });
      vf.close();
      while (enc.encodeQueueSize > 6) await sleep(4);
      o.onProgress(i + 1, total);
    }
    await enc.flush();
    if (st.err) throw st.err;
    muxer.finalize();
    return new Uint8Array(target.buffer);
  } finally {
    try { if (enc.state !== 'closed') enc.close(); } catch { /* already closed */ }
  }
}
