// Whisper speech recognition in the browser (transformers.js + ONNX, q8). Runs in a Worker so the UI never freezes.
// Model files come from the public Hugging Face hub (internet, no key) and are cached by the browser after the first download.
let asrPipe: any = null, loaded = '';
const post = (m: any) => (self as any).postMessage(m);

self.onmessage = async (e: MessageEvent<{ samples: Float32Array; model: string; lang: 'hi' | 'en' }>) => {
  const { samples, model, lang } = e.data;
  try {
    const tf: any = await import('@huggingface/transformers');
    tf.env.allowLocalModels = false;
    if (!asrPipe || loaded !== model) {
      post({ type: 'status', text: 'Whisper model download/load ho raha hai (pehli baar hi)…' });
      asrPipe = await tf.pipeline('automatic-speech-recognition', model, {
        dtype: 'q8', device: 'wasm',
        progress_callback: (p: any) => { if (p?.status === 'progress' && typeof p.progress === 'number') post({ type: 'status', text: `Whisper model: ${Math.round(p.progress)}% (${p.file ?? ''})` }); }
      });
      loaded = model;
    }
    post({ type: 'status', text: 'Awaaz sunkar shabd pehchan raha hoon…' });
    const out = await asrPipe(samples, { language: lang === 'hi' ? 'hindi' : 'english', task: 'transcribe', return_timestamps: 'word', chunk_length_s: 30, stride_length_s: 5 });
    const chunks: any[] = out?.chunks ?? [];
    const words = chunks.map((c, i) => { const s = Number(c.timestamp?.[0]), n = Number(chunks[i + 1]?.timestamp?.[0]); const eRaw = Number(c.timestamp?.[1]); return { text: String(c.text ?? ''), start: s, end: isFinite(eRaw) && eRaw > s ? eRaw : isFinite(n) ? n : s + 0.3 }; });
    post({ type: 'done', words });
  } catch (err: any) { post({ type: 'error', error: String(err?.message ?? err) }); }
};
