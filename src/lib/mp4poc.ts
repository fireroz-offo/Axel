// Phase 2 proof-of-concept: animate a canvas deterministically (frame = f(time)), encode H.264 (+AAC tone) with
// WebCodecs, mux to a real MP4 with mp4-muxer. No server, no FFmpeg needed when the device supports WebCodecs.
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface PocOptions { width: number; height: number; fps: number; seconds: number; withAudio: boolean }
export interface PocResult { blob: Blob; ms: number; frames: number; audio: boolean; note: string }

const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);

/** Scene as a pure function of time t (seconds) - same idea as seek-based renderers. */
export function drawScene(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, total: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#0b0f1a'); g.addColorStop(1, '#1b2550');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const vals = [12, 19, 31, 48, 70];
  const bw = w * 0.1, gap = w * 0.04, baseY = h * 0.78, maxH = h * 0.5;
  const startX = (w - (vals.length * bw + (vals.length - 1) * gap)) / 2;
  vals.forEach((v, i) => {
    const p = easeOutCubic(Math.min(1, Math.max(0, (t - 0.2 - i * 0.25) / 0.8)));
    const bh = (v / 70) * maxH * p;
    ctx.fillStyle = i === vals.length - 1 ? '#ffb454' : '#7c9cff';
    ctx.fillRect(startX + i * (bw + gap), baseY - bh, bw, bh);
  });
  ctx.fillStyle = '#fff';
  ctx.font = `700 ${Math.round(h * 0.075)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.globalAlpha = Math.min(1, t / 0.6);
  ctx.fillText('DIVRIZ AI - Render Test', w / 2, h * 0.16 + (1 - easeOutCubic(Math.min(1, t / 0.6))) * 20);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#334';
  ctx.fillRect(0, h - 6, w, 6);
  ctx.fillStyle = '#ffb454';
  ctx.fillRect(0, h - 6, (t / total) * w, 6);
}

export async function renderTestMp4(opt: PocOptions, onProgress: (p: number) => void): Promise<PocResult> {
  const W = (window as any);
  if (!W.VideoEncoder) throw new Error('WebCodecs VideoEncoder not available in this browser');
  const t0 = performance.now();
  const { width, height, fps, seconds } = opt;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  let audio = false;
  let note = 'video only';
  if (opt.withAudio && W.AudioEncoder) {
    const s = await W.AudioEncoder.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 44100, numberOfChannels: 1, bitrate: 96000 });
    audio = !!s.supported;
    if (!audio) note = 'AAC encoder unsupported on this device: video only';
  }

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height },
    ...(audio ? { audio: { codec: 'aac' as const, numberOfChannels: 1, sampleRate: 44100 } } : {}),
    fastStart: 'in-memory'
  });

  let encErr: Error | null = null;
  const venc = new W.VideoEncoder({
    output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
    error: (e: Error) => { encErr = e; }
  });
  const codec = width * height > 1280 * 720 ? 'avc1.640028' : 'avc1.42001f';
  venc.configure({ codec, width, height, bitrate: Math.round(width * height * fps * 0.07), framerate: fps });

  const total = Math.round(seconds * fps);
  for (let i = 0; i < total; i++) {
    if (encErr) throw encErr;
    drawScene(ctx, width, height, i / fps, seconds);
    const frame = new W.VideoFrame(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
    venc.encode(frame, { keyFrame: i % (fps * 2) === 0 });
    frame.close();
    while (venc.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 4)); // backpressure keeps RAM flat on phones
    if (i % 5 === 0) { onProgress(i / total); await new Promise((r) => setTimeout(r)); }
  }
  await venc.flush();
  venc.close();

  if (audio) {
    const aenc = new W.AudioEncoder({
      output: (chunk: any, meta: any) => muxer.addAudioChunk(chunk, meta),
      error: (e: Error) => { encErr = e; }
    });
    aenc.configure({ codec: 'mp4a.40.2', sampleRate: 44100, numberOfChannels: 1, bitrate: 96000 });
    const sr = 44100, chunkFrames = 4096, totalSamples = sr * seconds;
    for (let off = 0; off < totalSamples; off += chunkFrames) {
      const n = Math.min(chunkFrames, totalSamples - off);
      const buf = new Float32Array(n);
      for (let k = 0; k < n; k++) buf[k] = 0.15 * Math.sin((2 * Math.PI * 440 * (off + k)) / sr);
      const ad = new W.AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: 1, timestamp: Math.round((off / sr) * 1e6), data: buf });
      aenc.encode(ad);
      ad.close();
    }
    await aenc.flush();
    aenc.close();
    note = 'H.264 + AAC (440Hz tone)';
  }
  if (encErr) throw encErr;
  muxer.finalize();
  onProgress(1);
  return { blob: new Blob([target.buffer], { type: 'video/mp4' }), ms: performance.now() - t0, frames: total, audio, note };
}
