// Audio analysis + script alignment. Pure functions over Float32Array so they run (and are tested) in Node too.
import { tokenize, cleanWord } from '../brain/script';
import type { Timed, Word } from '../brain/plan';

export interface Silence { start: number; end: number }
export interface AudioInfo { duration: number; hop: number; env: number[]; silences: Silence[]; speechStart: number; speechEnd: number; threshold: number }

/** RMS envelope (hop seconds), adaptive silence threshold, silence segments (>= minSil). */
export function analyzeSamples(x: Float32Array, sr: number, hop = 0.02, minSil = 0.22): AudioInfo {
  const duration = x.length / sr, n = Math.max(1, Math.floor(duration / hop)), step = Math.floor(sr * hop);
  const env: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0; const a = i * step, b = Math.min(x.length, a + step);
    for (let k = a; k < b; k++) s += x[k] * x[k];
    env[i] = Math.sqrt(s / Math.max(1, b - a));
  }
  const sorted = [...env].sort((a, b) => a - b);
  const floor = sorted[Math.floor(n * 0.1)] ?? 0, peak = sorted[Math.floor(n * 0.95)] ?? 0;
  const threshold = Math.max(floor * 2.5, peak * 0.06, 1e-4);
  const sil: Silence[] = []; let s0 = -1;
  for (let i = 0; i <= n; i++) {
    const quiet = i < n && env[i] < threshold;
    if (quiet && s0 < 0) s0 = i;
    if (!quiet && s0 >= 0) { if ((i - s0) * hop >= minSil) sil.push({ start: s0 * hop, end: i * hop }); s0 = -1; }
  }
  let speechStart = 0, speechEnd = duration;
  if (sil.length && sil[0].start < 0.001) speechStart = sil[0].end;
  if (sil.length && sil[sil.length - 1].end >= duration - 0.001) speechEnd = sil[sil.length - 1].start;
  if (speechEnd <= speechStart) { speechStart = 0; speechEnd = duration; }
  return { duration, hop, env, silences: sil, speechStart, speechEnd, threshold };
}

const weight = (s: string) => Math.max(1, [...s.replace(/[\s\p{P}]/gu, '')].length);

/** voiced time before t (silences inside speech region removed) */
function voicedBefore(t: number, info: AudioInfo): number {
  let v = Math.max(0, Math.min(t, info.speechEnd) - info.speechStart);
  for (const s of info.silences) {
    const a = Math.max(s.start, info.speechStart), b = Math.min(s.end, info.speechEnd, t);
    if (b > a) v -= b - a;
  }
  return Math.max(0, v);
}
function timeAtVoiced(v: number, info: AudioInfo): number {
  let lo = info.speechStart, hi = info.speechEnd;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (voicedBefore(m, info) < v) lo = m; else hi = m; }
  return hi;
}

export interface AlignResult { scenes: Timed[]; report: Report }
export interface Report { audioSec: number; expectedSec: number; ratio: number; sentences: number; flags: string[]; rates: number[]; method: string }

/**
 * Align sentences to audio: weight each sentence by spoken length, spread over *voiced* time,
 * then snap every boundary to the nearest silence centre (<= 0.9 s away). Scenes are contiguous (no gaps/black frames).
 * NOTE: this is timing-based alignment, not speech recognition. It cannot hear skipped/extra words.
 */
export function alignScript(sentences: string[], info: AudioInfo): AlignResult {
  const n = sentences.length;
  const w = sentences.map(weight), W = w.reduce((a, b) => a + b, 0);
  const totalVoiced = voicedBefore(info.speechEnd, info);
  const bounds: number[] = [0];
  let acc = 0;
  for (let i = 0; i < n - 1; i++) {
    acc += w[i];
    let t = timeAtVoiced((acc / W) * totalVoiced, info);
    let best = t, bd = 0.9;
    for (const s of info.silences) { const c = (s.start + s.end) / 2, d = Math.abs(c - t); if (d < bd && c > info.speechStart && c < info.speechEnd) { bd = d; best = c; } }
    t = best;
    const minGap = 0.7;
    if (t < bounds[bounds.length - 1] + minGap) t = bounds[bounds.length - 1] + minGap;
    bounds.push(t);
  }
  bounds.push(info.duration);
  // keep monotonic and inside duration
  for (let i = 1; i < bounds.length; i++) bounds[i] = Math.min(Math.max(bounds[i], bounds[i - 1] + 0.05), info.duration);

  const scenes: Timed[] = sentences.map((text, i) => {
    const a = i === 0 ? 0 : bounds[i], b = bounds[i + 1];
    const toks = tokenize(text);
    const ww = toks.map((t) => weight(cleanWord(t)) || 1), WW = ww.reduce((x, y) => x + y, 0);
    // words only get voiced time inside this sentence's speech span
    const sa = Math.max(a, info.speechStart), sb = Math.min(b, info.speechEnd);
    const va = voicedBefore(sa, info), vb = voicedBefore(Math.max(sb, sa), info);
    let cum = 0;
    const words: Word[] = toks.map((t, k) => {
      const t0 = vb > va ? timeAtVoiced(va + (cum / WW) * (vb - va), info) : a + (cum / WW) * (b - a);
      cum += ww[k];
      const t1 = vb > va ? timeAtVoiced(va + (cum / WW) * (vb - va), info) : a + (cum / WW) * (b - a);
      return { w: t, t0: Math.max(a, t0), t1: Math.min(b, Math.max(t1, t0 + 0.02)) };
    });
    return { text, start: a, end: b, words };
  });

  const WPM = 140, totalWords = sentences.reduce((a, s) => a + tokenize(s).length, 0);
  const expectedSec = (totalWords / WPM) * 60;
  const rates = scenes.map((s) => { const v = voicedBefore(Math.min(s.end, info.speechEnd), info) - voicedBefore(Math.min(s.start, info.speechEnd), info); return v > 0.05 ? weight(s.text) / v : 0; });
  const nz = rates.filter((r) => r > 0), mean = nz.reduce((a, b) => a + b, 0) / Math.max(1, nz.length);
  const sd = Math.sqrt(nz.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, nz.length));
  const flags: string[] = [];
  const speechSec = info.speechEnd - info.speechStart, ratio = speechSec / Math.max(1, expectedSec);
  if (ratio < 0.55) flags.push('Audio script se kaafi chhota hai: shayad kuch hissa bola nahi gaya.');
  if (ratio > 1.9) flags.push('Audio script se kaafi lamba hai: shayad extra bola gaya ya bahut dheere.');
  rates.forEach((r, i) => { if (sd > 0 && r > 0 && Math.abs(r - mean) > 2.2 * sd) flags.push(`Scene ${i + 1}: bolne ki speed baaki se alag hai (check karein ki yahan kuch chhoota ya extra to nahi).`); });
  if (!info.silences.length) flags.push('Audio mein koi saaf pause nahi mila: timing sirf script ki length se anumaanit hai.');
  return { scenes, report: { audioSec: info.duration, expectedSec, ratio, sentences: n, flags, rates, method: 'voiced-time weights + silence snapping (no speech recognition)' } };
}
