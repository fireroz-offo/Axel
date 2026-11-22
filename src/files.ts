import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const CHUNK = 3 * 512 * 1024; // multiple of 3 -> chunks concatenate as valid base64

function b64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(s);
}

async function writeChunked(path: string, bytes: Uint8Array, directory: Directory): Promise<string> {
  await Filesystem.writeFile({ path, data: b64(bytes.subarray(0, CHUNK)), directory, recursive: true });
  for (let off = CHUNK; off < bytes.length; off += CHUNK) {
    await Filesystem.appendFile({ path, data: b64(bytes.subarray(off, off + CHUNK)), directory });
  }
  return (await Filesystem.getUri({ path, directory })).uri;
}

export const isNative = () => Capacitor.isNativePlatform();

function webDownload(bytes: Uint8Array, name: string, mime: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000);
}

/** Native: share sheet (Save to Files / Drive / WhatsApp / Gallery apps). Web: normal download. */
export async function shareBytes(bytes: Uint8Array, name: string, mime: string): Promise<string> {
  if (!isNative()) { webDownload(bytes, name, mime); return `${name} download ho gaya`; }
  const uri = await writeChunked(name, bytes, Directory.Cache);
  await Share.share({ title: name, dialogTitle: 'Save / share', url: uri });
  return 'Share sheet khul gaya';
}

/** Native: try public Documents/DIVRIZ folder, fall back to the share sheet if Android refuses. */
export async function saveBytes(bytes: Uint8Array, name: string, mime: string): Promise<string> {
  if (!isNative()) { webDownload(bytes, name, mime); return `${name} download ho gaya`; }
  try {
    await writeChunked('DIVRIZ/' + name, bytes, Directory.Documents);
    return `Saved: Documents/DIVRIZ/${name}`;
  } catch {
    return shareBytes(bytes, name, mime);
  }
}
