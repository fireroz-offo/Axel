/** Opens the original Motion Pro HTML/CSS/JS generator with an AI-selected template.
 * The full gallery/runtime is bundled under public/motion-pro; no network or API key required.
 */
export interface MotionProScene { motionId?: number; text: string; params?: Record<string, unknown> }
export function motionProSceneUrl(scene: MotionProScene, accent = '#ffb454'): string {
  const id = Math.max(1, Math.min(171000, Math.round(Number(scene.motionId) || 71001)));
  const text = scene.text.trim();
  const words = text.split(/\s+/);
  const title = words.slice(0, 7).join(' ');
  const subtitle = text.length > title.length ? text : '';
  const seed = Math.abs(Math.imul(id, 2654435761)) % 999999;
  const q = new URLSearchParams({ template: String(id), title, subtitle, accent, seed: String(seed) });
  return `motion-pro/index.html?${q.toString()}`;
}
