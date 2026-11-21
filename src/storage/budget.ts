// Storage budget: the app keeps its own data under a hard cap (default 100 MB; 50 MB option). Oldest items are evicted first.
export interface StoreItem { id: string; kind: 'render' | 'asset' | 'audio' | 'cache'; bytes: number; at: number; keep?: boolean }
export const CAPS_MB = [50, 100] as const;

/** Pure: which items to delete so the total fits under capBytes. Never deletes keep=true; evicts renders first, then cache, audio, assets; oldest first. */
export function planEviction(items: StoreItem[], capBytes: number): { remove: StoreItem[]; total: number; after: number; fits: boolean } {
  const total = items.reduce((a, b) => a + b.bytes, 0);
  const order: StoreItem['kind'][] = ['cache', 'render', 'audio', 'asset'];
  const cand = items.filter((i) => !i.keep).sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.at - b.at);
  const remove: StoreItem[] = []; let cur = total;
  for (const c of cand) { if (cur <= capBytes) break; remove.push(c); cur -= c.bytes; }
  return { remove, total, after: cur, fits: cur <= capBytes };
}

// ---- browser side (OPFS + Cache Storage + IndexedDB estimate) ----
const root = async () => (navigator.storage as any).getDirectory() as Promise<FileSystemDirectoryHandle>;

export async function listOpfs(): Promise<StoreItem[]> {
  const out: StoreItem[] = [];
  try {
    const r = await root();
    for (const dir of ['renders', 'audio', 'assets']) {
      let d: FileSystemDirectoryHandle; try { d = await r.getDirectoryHandle(dir); } catch { continue; }
      for await (const [name, h] of (d as any).entries()) { if (h.kind !== 'file') continue; const f = await h.getFile(); out.push({ id: `${dir}/${name}`, kind: dir === 'renders' ? 'render' : dir === 'audio' ? 'audio' : 'asset', bytes: f.size, at: f.lastModified }); }
    }
  } catch { /* OPFS missing */ }
  return out;
}
export async function removeOpfs(id: string): Promise<void> {
  const [dir, name] = id.split('/'); try { await (await (await root()).getDirectoryHandle(dir)).removeEntry(name); } catch { /* gone */ }
}
/** Old versions stored web-llm models (0.4 - 2 GB) in Cache Storage / IndexedDB. Remove them: they break the 100 MB budget. */
export async function purgeLegacyModels(): Promise<number> {
  let freed = 0;
  try {
    for (const k of await caches.keys()) if (/webllm|mlc/i.test(k)) { await caches.delete(k); freed++; }
    for (const db of (await (indexedDB as any).databases?.()) ?? []) if (db.name && /webllm|mlc/i.test(db.name)) { indexedDB.deleteDatabase(db.name); freed++; }
  } catch { /* ignore */ }
  return freed;
}
export async function usage(): Promise<{ usedMB: number; quotaMB: number; appMB: number }> {
  const est = await navigator.storage?.estimate?.().catch(() => undefined);
  const app = (await listOpfs()).reduce((a, b) => a + b.bytes, 0);
  return { usedMB: (est?.usage ?? 0) / 1048576, quotaMB: (est?.quota ?? 0) / 1048576, appMB: app / 1048576 };
}
export async function enforce(capMB: number, keepIds: string[] = []): Promise<{ removed: number; afterMB: number; fits: boolean }> {
  const items = (await listOpfs()).map((i) => ({ ...i, keep: keepIds.includes(i.id) }));
  const p = planEviction(items, capMB * 1048576);
  for (const r of p.remove) await removeOpfs(r.id);
  return { removed: p.remove.length, afterMB: p.after / 1048576, fits: p.fits };
}
