// Internet AI with NO API key and NO own backend. Providers are public keyless endpoints, tried in order.
// Nothing is bundled (0 MB model). If every provider fails, callers fall back to the rule engine: the app never depends on this.
// NOTE: availability of a keyless public endpoint can change at any time, so health() must be run on the real device (Lab / Settings).
export interface Provider { id: string; label: string; call(messages: Msg[], o: CallOpts): Promise<string> }
export interface Msg { role: 'system' | 'user' | 'assistant'; content: string }
export interface CallOpts { signal?: AbortSignal; timeoutMs: number; maxTokens?: number; temperature?: number; fetchImpl?: typeof fetch }

const withTimeout = (o: CallOpts) => {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), o.timeoutMs);
  o.signal?.addEventListener('abort', () => c.abort());
  return { signal: c.signal, done: () => clearTimeout(t) };
};

/** Pollinations text endpoint (OpenAI-compatible, anonymous tier). */
export const pollinations: Provider = {
  id: 'pollinations', label: 'Pollinations (keyless)',
  async call(messages, o) {
    const f = o.fetchImpl ?? fetch, w = withTimeout(o);
    try {
      const r = await f('https://text.pollinations.ai/openai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: w.signal,
        body: JSON.stringify({ model: 'openai', messages, temperature: o.temperature ?? 0.4, max_tokens: o.maxTokens ?? 700 })
      });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j: any = await r.json();
      const txt = j?.choices?.[0]?.message?.content;
      if (typeof txt !== 'string' || !txt.trim()) throw new Error('khaali jawab');
      return txt;
    } finally { w.done(); }
  }
};

export const PROVIDERS: Provider[] = [pollinations];

export interface AskResult { text: string; provider: string }
/** Try providers in order; one retry each on network error. Returns null if all fail (caller uses fallback). */
export async function ask(messages: Msg[], o: Partial<CallOpts> = {}, providers = PROVIDERS): Promise<AskResult | null> {
  const opts: CallOpts = { timeoutMs: 25000, ...o };
  for (const p of providers) {
    for (let k = 0; k < 2; k++) {
      if (opts.signal?.aborted) return null;
      try { return { text: await p.call(messages, opts), provider: p.id }; }
      catch { if (k === 0) await new Promise((r) => setTimeout(r, 600)); }
    }
  }
  return null;
}

/** Real availability test (used by Settings > "AI check"): returns latency or the error text. */
export async function health(providers = PROVIDERS, fetchImpl?: typeof fetch): Promise<Array<{ id: string; ok: boolean; ms: number; error?: string }>> {
  const out = [];
  for (const p of providers) {
    const t0 = Date.now();
    try { await p.call([{ role: 'user', content: 'Reply with the single word: ok' }], { timeoutMs: 12000, maxTokens: 5, fetchImpl }); out.push({ id: p.id, ok: true, ms: Date.now() - t0 }); }
    catch (e: any) { out.push({ id: p.id, ok: false, ms: Date.now() - t0, error: String(e?.message ?? e) }); }
  }
  return out;
}
