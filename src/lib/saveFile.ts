// Export helpers.
//  - Android APK: native "SaveFile" plugin streams the file into Downloads/DIVRIZ (MediaStore). Reliable, no permission on Android 10+.
//  - Share sheet is a separate optional action (works on some phones, "Share canceled" on others).
//  - Browser: normal <a download>.
import { Capacitor, registerPlugin } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface SaveFilePlugin {
  open(o: { name: string; mime: string }): Promise<void>;
  write(o: { data: string }): Promise<void>;
  close(): Promise<{ path: string; uri: string }>;
}
const SaveFile = registerPlugin<SaveFilePlugin>('SaveFile');

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Save to the phone's Downloads folder (APK) or trigger a browser download. */
export async function saveToDownloads(blob: Blob, filename: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    if (!Capacitor.isPluginAvailable('SaveFile')) throw new Error('Native save plugin missing - APK ko naye build se update karein');
    await SaveFile.open({ name: filename, mime: blob.type || 'video/mp4' });
    const CHUNK = 768 * 1024; // multiple of 3 => each base64 chunk decodes independently
    for (let off = 0; off < blob.size; off += CHUNK) {
      await SaveFile.write({ data: await blobToBase64(blob.slice(off, off + CHUNK)) });
    }
    const r = await SaveFile.close();
    return `✅ Save ho gaya: ${r.path} (Files app > Downloads > DIVRIZ)`;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return '✅ Download shuru ho gaya.';
}

/** Optional: system share sheet (APK only). */
export async function shareFile(blob: Blob, filename: string): Promise<string> {
  if (!Capacitor.isNativePlatform()) return saveToDownloads(blob, filename);
  const data = await blobToBase64(blob);
  const saved = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
  await Share.share({ title: filename, dialogTitle: 'MP4 share karein', files: [saved.uri] });
  return 'Share sheet se bheja gaya.';
}
