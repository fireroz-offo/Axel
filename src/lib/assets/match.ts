// Scene -> asset matching. Uses the user's HTML library when an asset genuinely fits; otherwise the scene keeps its AI-generated block.
import { extractFacts } from '../brain/script';
import type { SceneSpec } from '../brain/plan';
import type { AssetDef } from './store';

const AFFINITY: Record<string, string[]> = { bars: ['bar', 'chart', 'graph'], bars3d: ['bar', 'chart', 'graph'], line: ['line', 'graph', 'growth', 'chart'], stat: ['stat', 'counter', 'number'], timeline: ['timeline'], steps: ['steps', 'process'], compare: ['compare'], quote: ['quote'], sphere3d: ['globe', 'map'], words: ['title', 'intro'], callout: ['icon', 'arrow'] };
export const MATCH_THRESHOLD = 3.5;

export function scoreAsset(a: AssetDef, s: SceneSpec, category: string): number {
  const text = s.text.toLowerCase(), kws = extractFacts(s.text).keywords.map((k) => k.toLowerCase());
  let sc = 0;
  for (const t of a.tags) { if (!t) continue; if (text.includes(t)) sc += 3; else if (kws.some((k) => k.includes(t) || t.includes(k))) sc += 2; }
  const aff = AFFINITY[s.params?.orig?.block ?? s.block] ?? [];
  if (a.tags.some((t) => aff.includes(t))) sc += 2.5;
  if (a.category === category) sc += 1.5;
  return sc;
}

export function applyAssets(scenes: SceneSpec[], assets: AssetDef[], category: string): SceneSpec[] {
  const on = assets.filter((a) => a.enabled);
  if (!on.length) return scenes;
  const used: string[] = [];
  return scenes.map((s) => {
    if (s.block === 'title' || s.block === 'end' || s.end - s.start < 1.5) { used.push(''); return s; }
    let best: AssetDef | null = null, bs = MATCH_THRESHOLD;
    for (const a of on) { const sc = scoreAsset(a, s, category) - 2 * used.slice(-3).filter((u) => u === a.id).length; if (sc >= bs) { bs = sc; best = a; } }
    if (!best) { used.push(''); return s; }
    used.push(best.id);
    return useAsset(s, best, `library match (score ${bs.toFixed(1)}): ${best.name}`);
  });
}
export const useAsset = (s: SceneSpec, a: AssetDef, reason: string): SceneSpec => ({ ...s, block: 'asset', params: { assetId: a.id, name: a.name, fallback: s.text, orig: { block: s.block, params: s.params } }, reason });
