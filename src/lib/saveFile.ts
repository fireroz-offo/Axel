// Saves/exports a file. In the Android APK (Capacitor WebView) <a download> does not work,
// so we write to app cache and open the system Share sheet (Save to Files/Drive, WhatsApp, etc.).
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function saveOrShare(blob: Blob, filename: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    const data = await blobToBase64(blob);
    const saved = await Filesystem.writeFile({ path: filename, data, directory: Directory.Cache });
    await Share.share({ title: filename, dialogTitle: 'MP4 save / share karein', url: saved.uri });
    return 'Share sheet khul gaya: "Files / Drive / Save to device" chuniye.';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return 'Download shuru ho gaya.';
}
