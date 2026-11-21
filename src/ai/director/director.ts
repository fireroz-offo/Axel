// Director: asks the internet AI for a scene -> block plan, validates with Zod, merges into the rule-based plan.
// Rule engine stays the safety net: bad / missing AI answer never breaks the plan.
import { ask } from '../net/keyless';
import { ScenePlanSchema, extractJSON, BLOCKS } from '../../schemas/ai';

export interface DirectorResult { picks: Map<number, string>; provider: string | null; note: string }

export function buildPrompt(sentences: string[], mode: 'explanation' | 'documentary'): string {
  const list = sentences.map((s, i) => `${i}: ${s.slice(0, 160)}`).join('\n');
  return `You are a motion-graphics director for a ${mode} video. For each numbered voiceover line choose ONE block from: ${BLOCKS.join(', ')}.\n` +
    `Rules: first line = title, last line = end; do not repeat the same block twice in a row; use stat only if the line has a number; use timeline only for years/sequence; use compare only for contrast.\n` +
    `Answer ONLY with JSON: [{"i":0,"block":"title"}, ...]\n\n${list}`;
}

/** Long scripts are sent in chunks of 25 lines, so each request is small and fast (a 10-min script = ~5 short calls, not one giant one). */
export async function direct(sentences: string[], mode: 'explanation' | 'documentary', o: { signal?: AbortSignal; askFn?: typeof ask; onStatus?: (s: string) => void } = {}): Promise<DirectorResult> {
  const askFn = o.askFn ?? ask, picks = new Map<number, string>(); let provider: string | null = null, failed = 0;
  const CH = 25;
  for (let a = 0; a < sentences.length; a += CH) {
    o.onStatus?.(`AI director: ${Math.min(a + CH, sentences.length)}/${sentences.length} lines`);
    const part = sentences.slice(a, a + CH);
    const r = await askFn([{ role: 'user', content: buildPrompt(part, mode) }], { signal: o.signal, maxTokens: 500, temperature: 0.2 });
    if (!r) { failed++; continue; }
    try {
      const plan = ScenePlanSchema.parse(extractJSON(r.text));
      for (const p of plan) if (p.i < part.length) picks.set(a + p.i, p.block);
      provider = r.provider;
    } catch { failed++; }
  }
  const note = picks.size === 0 ? 'Internet AI se plan nahi mila: rule-based plan use hua.' : failed ? `AI ne ${picks.size}/${sentences.length} lines ka plan diya, baaki rule-based.` : `AI plan ${picks.size} lines ke liye (${provider}).`;
  return { picks, provider, note };
}
