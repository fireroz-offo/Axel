// Original Motion Pro HTML/CSS frames -> browser compositor -> WebCodecs H.264 + voiceover -> AAC -> MP4.
// Frame-by-frame capture keeps peak memory bounded; HTML/CSS effects are sampled at the requested timestamp.
import { Muxer } from 'mp4-muxer';
import { planBitrate, AUDIO_BPS, type Quality } from './budget';
import { openOutput } from './output';
import { type Theme } from '../motion/theme';
import { MotionProCompositor } from '../motion/htmlCompositor';
import type { SceneSpec } from '../brain/plan';

export type Aspect = '16:9' | '9:16' | '1:1';
export const SIZES: Record<Aspect, [number, number]> = { '16:9': [1280, 720], '9:16': [720, 1280], '1:1': [720, 720] };
export interface RenderJob {
  scenes: SceneSpec[]; theme: Theme; aspect: Aspect; fps: 24 | 30; duration: number; captions: boolean; quality?: Quality; maxMB?: number; compositor?: MotionProCompositor;
  audio: Float32Array | null; sampleRate: number; signal?: AbortSignal; onProgress: (p: number, stage: string) => void;
}
export interface RenderOut { streaming: boolean; videoBps: number; capped: boolean; blob: Blob; ms: number; frames: number; audio: boolean; note: string; width: number; height: number }

export function supportsEncoding(): boolean { return typeof (window as any).VideoEncoder !== 'undefined' && typeof (window as any).VideoFrame !== 'undefined'; }

export async function decodeAudioFile(file: Blob, sr = 48000): Promise<{ samples: Float32Array; sampleRate: number; duration: number }> {
  const buf = await file.arrayBuffer();
  const ctx = new OfflineAudioContext(1, 1, sr);
  const ab = await ctx.decodeAudioData(buf); // resamples to sr
  const ch = ab.numberOfChannels, n = ab.length, out = new Float32Array(n);
  for (let c = 0; c < ch; c++) { const d = ab.getChannelData(c); for (let i = 0; i < n; i++) out[i] += d[i] / ch; }
  return { samples: out, sampleRate: ab.sampleRate, duration: ab.duration };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

/** Render the original Motion Pro HTML templates frame-by-frame through the browser compositor. */
export async function renderVideo(job: RenderJob): Promise<RenderOut> { return renderVideoInner(job); }
async function renderVideoInner(job: RenderJob): Promise<RenderOut> {
  const W = window as any;
  if (!supportsEncoding()) throw new Error('Is browser mein WebCodecs (VideoEncoder) nahi hai. Android Chrome (latest) use karein.');
  const t0 = performance.now(), [width, height] = SIZES[job.aspect], fps = job.fps;

  const bud = planBitrate({ width, height, fps, duration: job.duration, quality: job.quality ?? 'balanced', maxMB: job.maxMB ?? 200, hasAudio: !!job.audio });
  const vcfg = { codec: width * height > 1280 * 720 ? 'avc1.640028' : 'avc1.4d001f', width, height, bitrate: bud.videoBps, framerate: fps, latencyMode: 'quality' as const, bitrateMode: 'variable' as const };
  const vs = await W.VideoEncoder.isConfigSupported(vcfg);
  if (!vs.supported) throw new Error('H.264 encoder is device par supported nahi hai.');

  // AAC first (plays everywhere). If the device has no AAC encoder, fall back to Opus-in-MP4 instead of a silent video.
  let audioOn = false, note = 'H.264', acodec: 'aac' | 'opus' = 'aac';
  let acfg: any = { codec: 'mp4a.40.2', sampleRate: job.sampleRate, numberOfChannels: 1, bitrate: AUDIO_BPS };
  if (job.audio && W.AudioEncoder) {
    audioOn = !!(await W.AudioEncoder.isConfigSupported(acfg)).supported;
    if (!audioOn) {
      const oc = { codec: 'opus', sampleRate: 48000, numberOfChannels: 1, bitrate: AUDIO_BPS };
      if (job.sampleRate === 48000 && (await W.AudioEncoder.isConfigSupported(oc)).supported) { acfg = oc; acodec = 'opus'; audioOn = true; }
    }
  }
  if (job.audio && !audioOn) note = 'Is device par AAC/Opus audio encoder nahi mila: video bina audio ke bana.';
  else if (audioOn) note = acodec === 'aac' ? 'H.264 + AAC' : 'H.264 + Opus (is device par AAC nahi tha; kuch purane players Opus nahi chalate)';

  const sink = await openOutput();
  const muxer = new Muxer({ target: sink.target as any, video: { codec: 'avc', width, height }, ...(audioOn ? { audio: { codec: acodec, numberOfChannels: 1, sampleRate: job.sampleRate } } : {}), fastStart: sink.fastStart });
  let err: Error | null = null;
  const venc = new W.VideoEncoder({ output: (c: any, m: any) => muxer.addVideoChunk(c, m), error: (e: Error) => { err = e; } });
  venc.configure(vcfg);

  const total = Math.max(1, Math.round(job.duration * fps));
  const compositor = job.compositor ?? new MotionProCompositor(width, height);
  const ownsCompositor = !job.compositor;
  try {
    for (let i = 0; i < total; i++) {
      if (job.signal?.aborted) throw new Error('Render cancel ho gaya.');
      if (err) throw err;
      const frameCanvas = await compositor.renderFrame(job.scenes, i / fps, job.theme, job.captions);
      const f = new W.VideoFrame(frameCanvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      venc.encode(f, { keyFrame: i % (fps * 2) === 0 }); f.close();
      while (venc.encodeQueueSize > 3) await new Promise((r) => setTimeout(r, 5));
      if (i % 3 === 0) { job.onProgress((i / total) * (audioOn ? 0.9 : 1), 'video'); await tick(); }
    }
    await venc.flush(); venc.close();
  } catch (e) {
    try { venc.close(); } catch { /* encoder may already be closed */ }
    await sink.abort();
    throw e;
  } finally {
    if (ownsCompositor) await compositor.dispose();
  }

  if (audioOn && job.audio) {
    const aenc = new W.AudioEncoder({ output: (c: any, m: any) => muxer.addAudioChunk(c, m), error: (e: Error) => { err = e; } });
    aenc.configure(acfg);
    const sr = job.sampleRate, CH = 4096, totalS = Math.min(job.audio.length, Math.ceil(job.duration * sr));
    for (let off = 0; off < totalS; off += CH) {
      if (job.signal?.aborted) { aenc.close(); await sink.abort(); throw new Error('Render cancel ho gaya.'); }
      const n = Math.min(CH, totalS - off), chunk = job.audio.slice(off, off + n);
      const ad = new W.AudioData({ format: 'f32-planar', sampleRate: sr, numberOfFrames: n, numberOfChannels: 1, timestamp: Math.round((off / sr) * 1e6), data: chunk });
      aenc.encode(ad); ad.close();
      while (aenc.encodeQueueSize > 16) await new Promise((r) => setTimeout(r, 2));
      if ((off / CH) % 40 === 0) { job.onProgress(0.9 + 0.1 * (off / totalS), 'audio'); await tick(); }
    }
    await aenc.flush(); aenc.close();
  }
  if (err) throw err;
  muxer.finalize(); const blob = await sink.finish(); job.onProgress(1, 'done');
  return { streaming: sink.streaming, videoBps: bud.videoBps, capped: bud.capped, blob, ms: performance.now() - t0, frames: total, audio: audioOn, note, width, height };
}
