// OPTIONAL "smarter plan" using an in-browser LLM (web-llm, WebGPU, no key, no server).
// Runs only if the user switches it on. Its answer is validated by parseLLMPlan/applyLLM; the rule plan stays the fallback.
import { buildLLMPrompt, parseLLMPlan, type BlockType, type Mode } from './plan';

export const LLM_MODEL = 'Qwen3-1.7B-q4f16_1-MLC'; // listed in the uploaded web-llm repo config; ~1-1.5 GB first download, then cached
export const hasWebGPU = () => typeof navigator !== 'undefined' && 'gpu' in navigator;

export async function llmSuggest(sentences: string[], mode: Mode, onStatus: (s: string) => void): Promise<Map<number, BlockType>> {
  if (!hasWebGPU()) throw new Error('Is browser/phone mein WebGPU nahi hai; rule-based plan hi use hoga.');
  const webllm = await import('@mlc-ai/web-llm');
  const engine = await webllm.CreateMLCEngine(LLM_MODEL, { initProgressCallback: (p: { text: string }) => onStatus(p.text) });
  onStatus('AI plan bana raha hai…');
  const r = await engine.chat.completions.create({ messages: [{ role: 'user', content: buildLLMPrompt(sentences, mode) + '\n/no_think' }], temperature: 0.2, max_tokens: 900 });
  return parseLLMPlan(r.choices[0]?.message?.content ?? '', sentences.length);
}
