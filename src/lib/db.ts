// Local-only storage: IndexedDB for project records, OPFS for large files (audio, video).
import type { Project } from './types';

const DB_NAME = 'divriz-ai';
const DB_VERSION = 1;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const r = fn(t.objectStore(store));
    t.oncomplete = () => { db.close(); resolve(r.result); };
    t.onerror = () => { db.close(); reject(t.error); };
    t.onabort = () => { db.close(); reject(t.error); };
  });
}

export const saveProject = (p: Project) => tx('projects', 'readwrite', (s) => s.put({ ...p, updatedAt: Date.now() }));
export const getProject = (id: string) => tx<Project | undefined>('projects', 'readonly', (s) => s.get(id));
export const deleteProject = (id: string) => tx('projects', 'readwrite', (s) => s.delete(id));
export async function listProjects(): Promise<Project[]> {
  const all = await tx<Project[]>('projects', 'readonly', (s) => s.getAll());
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export const kvGet = <T,>(key: string) => tx<T | undefined>('kv', 'readonly', (s) => s.get(key));
export const kvSet = (key: string, value: unknown) => tx('kv', 'readwrite', (s) => s.put(value, key));

export function newProjectId() {
  return 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------- OPFS ----------
export const opfsSupported = () => 'storage' in navigator && typeof (navigator.storage as any).getDirectory === 'function';

async function dir(sub?: string) {
  let d: FileSystemDirectoryHandle = await (navigator.storage as any).getDirectory();
  if (sub) d = await d.getDirectoryHandle(sub, { create: true });
  return d;
}

export async function opfsWrite(sub: string, name: string, data: Blob | ArrayBuffer | string) {
  const d = await dir(sub);
  const fh = await d.getFileHandle(name, { create: true });
  // createWritable is not on every mobile browser; fall back to a plain IndexedDB-free error message.
  const w = await (fh as any).createWritable();
  await w.write(data);
  await w.close();
}

export async function opfsRead(sub: string, name: string): Promise<File> {
  const d = await dir(sub);
  const fh = await d.getFileHandle(name);
  return fh.getFile();
}

export async function opfsRemove(sub: string, name: string) {
  const d = await dir(sub);
  await d.removeEntry(name);
}
