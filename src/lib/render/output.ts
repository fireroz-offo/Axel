// Where the MP4 bytes go while rendering. Preferred: stream straight into a file in OPFS (disk), so RAM stays flat for any length.
// Fallback (browser without OPFS writable streams): in-memory buffer, with a hard length warning handled by the caller.
import { ArrayBufferTarget, FileSystemWritableFileStreamTarget } from 'mp4-muxer';

export interface OutputSink { target: ArrayBufferTarget | FileSystemWritableFileStreamTarget; streaming: boolean; fastStart: false | 'in-memory'; finish(): Promise<Blob>; abort(): Promise<void> }
const DIR = 'renders';
const root = async () => (navigator.storage as any).getDirectory() as Promise<FileSystemDirectoryHandle>;
export const opfsStreaming = () => typeof navigator !== 'undefined' && !!navigator.storage && typeof (navigator.storage as any).getDirectory === 'function' && typeof (globalThis as any).FileSystemFileHandle !== 'undefined' && 'createWritable' in (globalThis as any).FileSystemFileHandle.prototype;

/** Delete every previous render so old MP4s never pile up on the phone. */
export async function cleanRenders(): Promise<number> {
  try {
    const d = await (await root()).getDirectoryHandle(DIR, { create: true }); let n = 0;
    for await (const [name] of (d as any).entries()) { await d.removeEntry(name); n++; }
    return n;
  } catch { return 0; }
}
export async function rendersSize(): Promise<number> {
  try {
    const d = await (await root()).getDirectoryHandle(DIR, { create: true }); let n = 0;
    for await (const [, h] of (d as any).entries()) n += (await (h as FileSystemFileHandle).getFile()).size;
    return n;
  } catch { return 0; }
}

export async function openOutput(): Promise<OutputSink> {
  if (opfsStreaming()) {
    try {
      await cleanRenders();
      const d = await (await root()).getDirectoryHandle(DIR, { create: true });
      const name = `divriz-${Date.now()}.mp4`;
      const fh = await d.getFileHandle(name, { create: true });
      const w = await (fh as any).createWritable();
      return {
        target: new FileSystemWritableFileStreamTarget(w), streaming: true, fastStart: false,
        // File from OPFS is disk-backed: it is not loaded into RAM.
        finish: async () => { await w.close(); return fh.getFile(); },
        abort: async () => { try { await w.abort(); } catch { /* ignore */ } try { await d.removeEntry(name); } catch { /* ignore */ } }
      };
    } catch { /* fall through to memory */ }
  }
  const t = new ArrayBufferTarget();
  return { target: t, streaming: false, fastStart: 'in-memory', finish: async () => new Blob([t.buffer], { type: 'video/mp4' }), abort: async () => {} };
}
