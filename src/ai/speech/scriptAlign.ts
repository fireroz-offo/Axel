// Script <-> speech-recognition alignment (pure, testable in Node). ASR = Whisper word timestamps (see whisper.worker.ts).
// Needleman-Wunsch over words with fuzzy matching (Whisper spells Hindi differently from the script), banded so a 1-hour script stays small.
import { tokenize, cleanWord } from '../../lib/brain/script';
import type { AlignResult, Report } from '../../lib/audio/analyze';
import type { Timed, Word } from '../../lib/brain/plan';

export interface AsrWord { text: string; start: number; end: number }

/** normalise so that spelling variants compare equal (nukta, chandrabindu, zero-width, case, digits) */
export const norm = (w: string): string =>
  cleanWord(w).normalize('NFC').toLowerCase().replace(/[\u200b-\u200d\u093c]/g, '').replace(/\u0901/g, '\u0902').replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)));

function lev(a: string, b: string): number {
  if (a === b) return 0; const m = a.length, n = b.length; if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
const sim = (a: string, b: string): number => {
  if (!a || !b) return 0; if (a === b) return 1; const L = Math.max(a.length, b.length);
  if (L <= 2 || Math.abs(a.length - b.length) > L * 0.4) return 0;
  if (a[0] !== b[0] && a[a.length - 1] !== b[b.length - 1]) return 0; // cheap reject: ASR errors rarely change both ends of a word
  return 1 - lev(a, b) / L;
};
const pairScore = (a: string, b: string): number => { const s = sim(a, b); return s === 1 ? 3 : s >= 0.72 ? 1.5 + s : s >= 0.55 ? 0.2 : -2; };

/** merge ASR fragments: Whisper may split one spoken word in pieces or glue punctuation */
export const cleanAsr = (w: AsrWord[]): AsrWord[] => w.map((x) => ({ ...x, text: x.text.trim() })).filter((x) => norm(x.text).length > 0 && isFinite(x.start) && isFinite(x.end));

/** align[i] = index of the ASR word matched to script word i (or -1) */
export function alignWords(script: string[], asr: string[]): { match: number[]; score: number } {
  const n = script.length, m = asr.length, GAP = -1.2;
  if (!n || !m) return { match: new Array(n).fill(-1), score: 0 };
  const B = Math.min(400, Math.max(120, Math.ceil(Math.max(n, m) * 0.25))), // +-400 words (~3 min) drift is plenty
    W = 2 * B + 1, ratio = m / n;
  const lo = (i: number) => Math.max(0, Math.round(i * ratio) - B);
  const NEG = -1e9, sc = new Float32Array((n + 1) * W).fill(NEG), tb = new Uint8Array((n + 1) * W); // 1 diag, 2 up(skip script), 3 left(skip asr)
  const win = (i: number) => (i === 0 ? 0 : lo(i - 1));
  const get = (i: number, j: number) => { const o = j - win(i); return o < 0 || o >= W ? NEG : sc[i * W + o]; };
  for (let j = 0; j <= Math.min(m, W - 1); j++) { sc[j] = j * GAP; tb[j] = 3; } sc[0] = 0;
  for (let i = 1; i <= n; i++) {
    const w0 = win(i), a = script[i - 1];
    for (let o = 0; o < W; o++) {
      const j = w0 + o; if (j > m) break;
      let best = NEG, dir = 0;
      if (j >= 1) { const d = get(i - 1, j - 1); if (d > NEG) { const v = d + pairScore(a, asr[j - 1]); if (v > best) { best = v; dir = 1; } } }
      const up = get(i - 1, j); if (up > NEG && up + GAP > best) { best = up + GAP; dir = 2; }
      if (o > 0) { const l = sc[i * W + o - 1]; if (l > NEG && l + GAP > best) { best = l + GAP; dir = 3; } }
      sc[i * W + o] = best; tb[i * W + o] = dir;
    }
  }
  const match = new Array(n).fill(-1);
  let i = n, j = Math.min(m, win(n) + W - 1), bestEnd = NEG;
  for (let jj = win(n); jj <= Math.min(m, win(n) + W - 1); jj++) { const v = get(n, jj); if (v > bestEnd) { bestEnd = v; j = jj; } }
  const total = bestEnd;
  while (i > 0) {
    const o = j - win(i), dir = o >= 0 && o < W ? tb[i * W + o] : 2;
    if (dir === 1 && j >= 1) { if (sim(script[i - 1], asr[j - 1]) >= 0.55) match[i - 1] = j - 1; i--; j--; }
    else if (dir === 3 && j > 0) j--;
    else i--;
  }
  return { match, score: total };
}

export interface AsrAlign extends AlignResult { coverage: number; missing: string[]; extra: number }

/**
 * Build scenes with REAL word timestamps from the ASR result.
 * Returns null when the recognition is too poor to trust (caller then uses timing-based alignment).
 */
export function alignScriptToAsr(sentences: string[], asrRaw: AsrWord[], duration: number): AsrAlign | null {
  const asr = cleanAsr(asrRaw); if (!asr.length || !sentences.length) return null;
  const toks = sentences.map((s) => tokenize(s)), flat: Array<{ s: number; k: number; w: string }> = [];
  toks.forEach((t, s) => t.forEach((w, k) => { if (norm(w)) flat.push({ s, k, w }); }));
  if (!flat.length) return null;
  const { match } = alignWords(flat.map((f) => norm(f.w)), asr.map((a) => norm(a.text)));
  const hit = match.filter((x) => x >= 0).length, coverage = hit / flat.length;
  if (coverage < 0.35) return null;

  // times per script word: matched -> ASR time; unmatched -> linear interpolation between matched neighbours
  const t0 = new Array<number>(flat.length), t1 = new Array<number>(flat.length), ok = match.map((x) => x >= 0);
  flat.forEach((_, i) => { if (ok[i]) { t0[i] = asr[match[i]].start; t1[i] = Math.max(asr[match[i]].end, asr[match[i]].start + 0.04); } });
  let i = 0;
  while (i < flat.length) {
    if (ok[i]) { i++; continue; }
    let a = i; while (i < flat.length && !ok[i]) i++;
    const prevT = a > 0 ? t1[a - 1] : 0, nextT = i < flat.length ? t0[i] : Math.max(prevT, duration), gap = Math.max(0, nextT - prevT), n = i - a;
    for (let k = 0; k < n; k++) { t0[a + k] = prevT + (gap * k) / n; t1[a + k] = prevT + (gap * (k + 1)) / n; }
  }
  // enforce monotonic times
  for (let k = 1; k < flat.length; k++) { if (t0[k] < t0[k - 1]) t0[k] = t0[k - 1]; if (t1[k] < t0[k]) t1[k] = t0[k] + 0.04; }

  const bySent: number[][] = sentences.map(() => []); flat.forEach((f, idx) => bySent[f.s].push(idx));
  const bounds: number[] = [0];
  for (let s = 1; s < sentences.length; s++) {
    const prev = bySent[s - 1], cur = bySent[s];
    const endPrev = prev.length ? t1[prev[prev.length - 1]] : bounds[s - 1], startCur = cur.length ? t0[cur[0]] : endPrev;
    bounds.push(Math.max(bounds[s - 1] + 0.3, (endPrev + Math.max(startCur, endPrev)) / 2)); // cut in the middle of the pause
  }
  bounds.push(duration);
  for (let s = 1; s < bounds.length; s++) bounds[s] = Math.min(Math.max(bounds[s], bounds[s - 1] + 0.05), duration);

  const scenes: Timed[] = sentences.map((text, s) => {
    const words: Word[] = []; const ws = toks[s]; let fi = 0;
    for (const w of ws) {
      if (!norm(w)) { const last = words[words.length - 1]; words.push({ w, t0: last ? last.t1 : bounds[s], t1: last ? last.t1 + 0.02 : bounds[s] + 0.02 }); continue; }
      const gi = bySent[s][fi++]; words.push({ w, t0: Math.max(bounds[s], t0[gi]), t1: Math.min(bounds[s + 1], Math.max(t1[gi], t0[gi] + 0.03)) });
    }
    return { text, start: bounds[s], end: bounds[s + 1], words };
  });

  const usedAsr = new Set(match.filter((x) => x >= 0)), extra = asr.length - usedAsr.size;
  const missing = flat.filter((_, k) => !ok[k]).map((f) => f.w);
  const flags: string[] = [];
  if (coverage < 0.7) flags.push(`Voiceover script se kaafi alag hai: sirf ${(coverage * 100).toFixed(0)}% shabd mile.`);
  bySent.forEach((idxs, s) => { const c = idxs.length ? idxs.filter((k) => ok[k]).length / idxs.length : 1; if (idxs.length >= 4 && c < 0.5) flags.push(`Scene ${s + 1}: ${(c * 100).toFixed(0)}% hi shabd sune gaye — yahan kuch chhoota ya alag bola gaya ho sakta hai.`); });
  if (extra > Math.max(8, flat.length * 0.2)) flags.push(`Audio mein ${extra} extra shabd mile jo script mein nahi hain.`);
  if (missing.length) flags.push(`${missing.length} script ke shabd audio mein nahi mile${missing.length <= 8 ? ': ' + missing.join(', ') : ' (jaise: ' + missing.slice(0, 6).join(', ') + '…)'}.`);
  const speech = asr[asr.length - 1].end - asr[0].start, rates = scenes.map((sc) => { const d = sc.end - sc.start; return d > 0.05 ? sc.text.replace(/\s/g, '').length / d : 0; });
  const report: Report = { audioSec: duration, expectedSec: (flat.length / 140) * 60, ratio: speech / Math.max(1, (flat.length / 140) * 60), sentences: sentences.length, flags, rates, method: 'whisper word timestamps + fuzzy word alignment' };
  return { scenes, report, coverage, missing, extra };
}
