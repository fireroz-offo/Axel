import type { AsrWord } from './scriptAlign';
export const WHISPER_MODELS = {
  tiny: { id: 'onnx-community/whisper-tiny', label: 'Tiny (~40 MB) — tez, Hindi kamzor', mb: 40 },
  base: { id: 'onnx-community/whisper-base', label: 'Base (~80 MB) — behtar Hindi', mb: 80 }
} as const;
export type WhisperTier = keyof typeof WHISPER_MODELS;

/** samples: mono 16 kHz Float32 (the buffer is TRANSFERRED to the worker, pass a copy if you still need it). */
export function transcribe(samples: Float32Array, o: { tier: WhisperTier; lang: 'hi' | 'en'; onStatus?: (s: string) => void; signal?: AbortSignal; timeoutMs?: number }): Promise<AsrWord[]> {
  return new Promise((res, rej) => {
    if (typeof Worker === 'undefined') return rej(new Error('Is browser mein Web Worker nahi hai'));
    const w = new Worker(new URL('./whisper.worker.ts', import.meta.url), { type: 'module' });
    const done = (f: () => void) => { clearTimeout(timer); w.terminate(); f(); };
    const timer = setTimeout(() => done(() => rej(new Error('Whisper bahut der se chal raha hai (timeout)'))), o.timeoutMs ?? 20 * 60_000);
    o.signal?.addEventListener('abort', () => done(() => rej(new Error('Cancelled'))));
    w.onmessage = (e) => { const m = e.data; if (m.type === 'status') o.onStatus?.(m.text); else if (m.type === 'done') done(() => res(m.words)); else if (m.type === 'error') done(() => rej(new Error(m.error))); };
    w.onerror = (e) => done(() => rej(new Error(e.message || 'Whisper worker error')));
    w.postMessage({ samples, model: WHISPER_MODELS[o.tier].id, lang: o.lang }, [samples.buffer]);
  });
}
