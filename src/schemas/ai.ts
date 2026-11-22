// Zod schemas: every AI answer (internet model OR rule engine) must pass these before the app uses it.
import { z } from 'zod';

export const BLOCKS = ['title', 'stat', 'bars', 'bars3d', 'line', 'timeline', 'steps', 'compare', 'quote', 'words', 'callout', 'sphere3d', 'hero', 'orbit', 'chartcard', 'coins3d', 'city3d', 'exploded3d', 'atom3d', 'helix3d', 'planet3d', 'network3d', 'road3d', 'end'] as const;
export const BlockSchema = z.enum(BLOCKS);

export const ScenePlanSchema = z.array(z.object({ i: z.number().int().min(0), block: BlockSchema })).min(1);
export const SectionSchema = z.object({
  id: z.string().min(1), title: z.string().min(1),
  text: z.string().min(20).max(4000),
  source: z.enum(['ai', 'extractive']),
  warnings: z.array(z.string()).default([])
});
export const ScriptSchema = z.object({
  sections: z.array(SectionSchema).min(3),
  facts: z.array(z.object({ text: z.string(), source: z.string(), url: z.string().optional() })),
  engine: z.string()
});
export type Section = z.infer<typeof SectionSchema>;
export type ScriptDoc = z.infer<typeof ScriptSchema>;

/** Pull the first JSON value out of a model answer (handles ```json fences and chatter around it). */
export function extractJSON(raw: string): unknown {
  const t = raw.replace(/```(?:json)?/gi, '').trim();
  for (const [o, c] of [['[', ']'], ['{', '}']] as const) {
    const a = t.indexOf(o), b = t.lastIndexOf(c);
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch { /* try next */ } }
  }
  throw new Error('Jawab mein valid JSON nahi mila');
}
