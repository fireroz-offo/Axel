import { alignScript, analyzeSamples, type AlignResult, type AudioInfo } from '../lib/audio/analyze';
/** Worker first (non-blocking); if Workers are unavailable or fail, same code on the main thread. */
export function runAlign(samples: Float32Array, sr: number, sentences: string[]): Promise<{ info: AudioInfo; align: AlignResult }> {
  const inline = () => { const info = analyzeSamples(samples, sr); return { info, align: alignScript(sentences, info) }; };
  if (typeof Worker === 'undefined') return Promise.resolve(inline());
  return new Promise((res) => {
    try {
      const w = new Worker(new URL('./align.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e) => { w.terminate(); res(e.data.ok ? { info: e.data.info, align: e.data.align } : inline()); };
      w.onerror = () => { w.terminate(); res(inline()); };
      w.postMessage({ samples, sr, sentences }, [samples.buffer]);
    } catch { res(inline()); }
  });
}
