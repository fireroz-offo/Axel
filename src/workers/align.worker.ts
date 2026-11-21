// Runs audio analysis + script alignment OFF the main thread so the UI never freezes on long scripts/audio.
import { analyzeSamples, alignScript } from '../lib/audio/analyze';
self.onmessage = (e: MessageEvent<{ samples: Float32Array; sr: number; sentences: string[] }>) => {
  try {
    const { samples, sr, sentences } = e.data;
    const info = analyzeSamples(samples, sr), al = alignScript(sentences, info);
    (self as any).postMessage({ ok: true, info, align: al });
  } catch (err: any) { (self as any).postMessage({ ok: false, error: String(err?.message ?? err) }); }
};
