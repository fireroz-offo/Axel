// File-size control. The bitrate is derived from a hard size cap, so a video can never grow past it, however long it is.
export type Quality = 'small' | 'balanced' | 'high';
export const QUALITY: Record<Quality, { label: string; mbps: number }> = {
  small: { label: 'Chhota file', mbps: 1.2 },
  balanced: { label: 'Balanced', mbps: 2.2 },
  high: { label: 'High', mbps: 3.5 }
};
export const AUDIO_BPS = 96_000;
export const SIZE_CAPS_MB = [50, 100, 200, 400];

export interface Budget { videoBps: number; estMB: number; capped: boolean }
/** videoBps = min(quality bitrate scaled for resolution, what the size cap allows). Flat graphics compress well, so this is conservative. */
export function planBitrate(o: { width: number; height: number; fps: number; duration: number; quality: Quality; maxMB: number; hasAudio: boolean }): Budget {
  const px = o.width * o.height, ref = 1280 * 720;
  const wanted = QUALITY[o.quality].mbps * 1e6 * Math.sqrt(px / ref) * (o.fps / 30);
  const audioBits = o.hasAudio ? AUDIO_BPS * o.duration : 0;
  const allowed = Math.max(250_000, (o.maxMB * 8e6 * 0.9 - audioBits) / Math.max(1, o.duration));
  const videoBps = Math.round(Math.min(wanted, allowed));
  return { videoBps, estMB: ((videoBps + (o.hasAudio ? AUDIO_BPS : 0)) * o.duration) / 8e6, capped: allowed < wanted };
}
