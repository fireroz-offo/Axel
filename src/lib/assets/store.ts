import { kvGet, kvSet } from '../db';
import type { AssetInfo } from './inspect';

export interface AssetDef { id: string; name: string; kind: 'html' | 'lottie'; html: string; tags: string[]; category: string; duration: number; libs: string[]; hasSeek: boolean; warnings: string[]; size: number; createdAt: number; enabled: boolean }
export const MAX_TOTAL_BYTES = 40 * 1048576, MAX_ONE_BYTES = 8 * 1048576;
const KEY = 'assets:v1';

export const loadAssets = async (): Promise<AssetDef[]> => (await kvGet<AssetDef[]>(KEY)) ?? [];
export const saveAssets = (l: AssetDef[]) => kvSet(KEY, l);

export async function addAsset(name: string, kind: 'html' | 'lottie', html: string, info: AssetInfo): Promise<AssetDef[]> {
  const size = new Blob([html]).size, list = await loadAssets();
  if (size > MAX_ONE_BYTES) throw new Error(`Asset bahut bada hai (${(size / 1048576).toFixed(1)} MB, limit 8 MB).`);
  if (list.reduce((a, b) => a + b.size, 0) + size > MAX_TOTAL_BYTES) throw new Error('Library full (40 MB). Kuch purane assets hatayein.');
  const def: AssetDef = { id: 'a_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, kind, html, tags: info.tags, category: info.category, duration: info.duration, libs: info.libs, hasSeek: info.hasSeek, warnings: info.warnings, size, createdAt: Date.now(), enabled: true };
  const next = [def, ...list]; await saveAssets(next); return next;
}
