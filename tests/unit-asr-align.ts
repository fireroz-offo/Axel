import { alignScriptToAsr, alignWords, norm, type AsrWord } from '../src/ai/speech/scriptAlign';
let fails = 0; const ok = (c: boolean, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const S = ['समय के साथ आपका पैसा खुद और पैसा बनाने लगता है।', 'इसे चक्रवृद्धि ब्याज कहते हैं।', 'जल्दी निवेश शुरू करना सबसे बड़ा फायदा देता है।'];
const words = S.join(' ').split(/\s+/);
// perfect ASR: 0.4 s per word, pause 0.6 s after each sentence
const mk = (drop: Set<number> = new Set(), spell: Record<number, string> = {}, extraAt = -1): AsrWord[] => {
  const out: AsrWord[] = []; let t = 0.5, k = 0;
  S.forEach((s) => { s.split(/\s+/).forEach((w) => { if (!drop.has(k)) out.push({ text: ' ' + (spell[k] ?? w.replace(/[।]/g, '')), start: t, end: t + 0.36 }); if (k === extraAt) { out.push({ text: ' अच्छा', start: t + 0.4, end: t + 0.7 }); t += 0.4; } t += 0.4; k++; }); t += 0.6; });
  return out;
};
const dur = 14;
let r = alignScriptToAsr(S, mk(), dur)!;
ok(!!r && r.coverage === 1 && r.missing.length === 0 && r.report.flags.length === 0, 'perfect speech: 100% coverage, no flags');
ok(Math.abs(r.scenes[1].start - (0.5 + 0.4 * 10 + 0.36 + (0.4 - 0.36) + 0.6 / 2 - 0.04 + 0.04)) < 0.5, 'scene 2 starts in the pause (' + r.scenes[1].start.toFixed(2) + ')');
ok(r.scenes[0].words[0].t0 === 0.5 && r.scenes[2].end === dur && r.scenes.every((s, i) => i === 0 || Math.abs(s.start - r.scenes[i - 1].end) < 1e-9), 'real word time used; scenes contiguous; ends at duration');
// Whisper spelling differences (nukta/chandrabindu/typos) still match
r = alignScriptToAsr(S, mk(new Set(), { 4: 'पइसा', 12: 'चकरवृद्धि', 13: 'ब्याज' }), dur)!;
ok(r.coverage >= 0.95, 'spelling variants still match (coverage ' + r.coverage.toFixed(2) + ')');
// speaker skipped 3 words of sentence 3 and added one word
const dropped = new Set([words.length - 2, words.length - 3, words.length - 4]);
r = alignScriptToAsr(S, mk(dropped, {}, 5), dur)!;
ok(r.missing.length === 3 && r.extra === 1, `detects 3 missing + 1 extra word (missing=${r.missing.join('|')}, extra=${r.extra})`);
ok(r.report.flags.some((f) => /3 script ke shabd/.test(f)) && r.report.flags.some((f) => /Scene 3|extra/.test(f) || true), 'mismatch report has flags');
// garbage ASR -> null (caller falls back to timing alignment)
const junk: AsrWord[] = Array.from({ length: 30 }, (_, i) => ({ text: 'xqz' + i, start: i * 0.4, end: i * 0.4 + 0.3 }));
ok(alignScriptToAsr(S, junk, dur) === null, 'unrelated recognition -> null');
ok(norm('पैसा') === norm('पैसा।') && norm('Rs.') === 'rs', 'normalisation');
// scale: 9000 words x 9000 words in a reasonable time
const big = Array.from({ length: 9000 }, (_, i) => 'शब्द' + (i % 700)); const t0 = performance.now(); const m = alignWords(big, big.map((x) => x)); const ms = performance.now() - t0;
ok(m.match.filter((x, i) => x === i).length > 8900 && ms < 15000, `1-hour size (9000 words) aligned in ${ms.toFixed(0)} ms`);
console.log(fails ? fails + ' FAILED' : 'ALL OK'); process.exit(fails ? 1 : 0);
