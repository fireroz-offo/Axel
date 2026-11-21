// OPTIONAL "smarter plan" using an in-browser LLM (web-llm, WebGPU, no key, no server). OFF by default.
// Memory fix: tiers from tiny to large (sizes from the uploaded web-llm config: vram_required_MB), engine is
// ALWAYS unloaded right after use, and the cached model files can be deleted from Settings.
import { buildLLMPrompt, parseLLMPlan, type BlockType, type Mode } from './plan';

export interface LlmTier { id: string; label: string; model: string; gpuMB: number }
export const LLM_TIERS: LlmTier[] = [
  { id: 'tiny', label: 'Chhota (SmolLM2-360M)', model: 'SmolLM2-360M-Instruct-q4f16_1-MLC', gpuMB: 376 },
  { id: 'small', label: 'Medium (Qwen2.5-0.5B)', model: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', gpuMB: 945 },
  { id: 'large', label: 'Bada (Qwen3-1.7B) — 2 GB', model: 'Qwen3-1.7B-q4f16_1-MLC', gpuMB: 2037 }
];
export const hasWebGPU = () => typeof navigator !== 'undefined' && 'gpu' in navigator;

export async function llmSuggest(sentences: string[], mode: Mode, tierId: string, onStatus: (s: string) => void): Promise<Map<number, BlockType>> {
  if (!hasWebGPU()) throw new Error('Is browser/phone mein WebGPU nahi hai; rule-based plan hi use hoga.');
  const tier = LLM_TIERS.find((t) => t.id === tierId) ?? LLM_TIERS[0];
  const webllm = await import('@mlc-ai/web-llm');
  const engine = await webllm.CreateMLCEngine(tier.model, { initProgressCallback: (p: { text: string }) => onStatus(p.text) });
  try {
    onStatus('AI plan bana raha hai…');
    const small = tier.id === 'tiny';
    const r = await engine.chat.completions.create({ messages: [{ role: 'user', content: buildLLMPrompt(sentences.slice(0, 60), mode) + (tier.model.startsWith('Qwen3') ? '\n/no_think' : '') }], temperature: 0.2, max_tokens: small ? 600 : 900 });
    return parseLLMPlan(r.choices[0]?.message?.content ?? '', sentences.length);
  } finally {
    try { await engine.unload(); } catch { /* already freed */ } // frees GPU/RAM immediately
  }
}

export async function cachedModels(): Promise<Array<{ tier: LlmTier; cached: boolean }>> {
  try {
    const webllm = await import('@mlc-ai/web-llm');
    return await Promise.all(LLM_TIERS.map(async (tier) => ({ tier, cached: await webllm.hasModelInCache(tier.model) })));
  } catch { return LLM_TIERS.map((tier) => ({ tier, cached: false })); }
}
export async function deleteModel(tier: LlmTier): Promise<void> {
  const webllm = await import('@mlc-ai/web-llm');
  await webllm.deleteModelAllInfoInCache(tier.model);
}
