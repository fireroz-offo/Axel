// Script understanding (rule-based, deterministic, Hindi + English). No network, no model.
export const normalizeDigits = (s: string) => s.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)));

const ENDERS = '।!?….';
const CLOSERS = '"”’\')]';

/** Split a script into sentences. Keeps decimals (3.5) and splits very long sentences at a comma. */
export function splitSentences(text: string): string[] {
  const t = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
  const raw: string[] = [];
  for (const para of t.split(/\n+/)) {
    let cur = '';
    for (let i = 0; i < para.length; i++) {
      const ch = para[i];
      cur += ch;
      if (!ENDERS.includes(ch)) continue;
      if (ch === '.' && (/\d/.test(para[i - 1] ?? '') && /\d/.test(para[i + 1] ?? ''))) continue;
      if (ch === '.' && para[i + 1] && !/\s/.test(para[i + 1]) && !CLOSERS.includes(para[i + 1])) continue;
      while (i + 1 < para.length && (CLOSERS.includes(para[i + 1]) || ENDERS.includes(para[i + 1]))) cur += para[++i];
      if (i + 1 >= para.length || /\s/.test(para[i + 1])) { raw.push(cur.trim()); cur = ''; }
    }
    if (cur.trim()) raw.push(cur.trim());
  }
  // merge fragments that are too short into the next sentence
  const merged: string[] = [];
  for (const s of raw) {
    if (merged.length && merged[merged.length - 1].length < 14) merged[merged.length - 1] += ' ' + s;
    else merged.push(s);
  }
  // split very long sentences near the middle comma
  const out: string[] = [];
  for (const s of merged) {
    if (s.length <= 170) { out.push(s); continue; }
    const mid = s.length / 2;
    let best = -1, bd = 1e9;
    for (let i = 0; i < s.length; i++) if (',;，'.includes(s[i]) && Math.abs(i - mid) < bd) { bd = Math.abs(i - mid); best = i; }
    if (best > 20 && best < s.length - 20) { out.push(s.slice(0, best + 1).trim()); out.push(s.slice(best + 1).trim()); } else out.push(s);
  }
  return out.filter(Boolean);
}

export const tokenize = (s: string) => s.split(/\s+/).filter(Boolean);
export const cleanWord = (w: string) => w.replace(/^[^\p{L}\p{M}\p{N}₹$%]+|[^\p{L}\p{M}\p{N}%]+$/gu, '');

const STOP = new Set(('है हैं का की के में से और को पर यह वह कि ही तो भी एक जो था थे थी होता होती होते करते करता करती कर हो गया गई गए लिए साथ बाद तक या जब तब कोई अपने आप हम आपका आपके इस उस इन उन ने वे जैसे क्योंकि लेकिन अगर तो नहीं ' +
  'the a an is are was were of to in on and or for with that this it as at by be from but not have has had will can').split(' '));

export type Unit = '' | '%' | 'money' | 'scale';
export interface Num { value: number; raw: string; unit: Unit; prefix: string; suffix: string; label: string }
export interface Facts {
  numbers: Num[]; years: Array<{ year: number; label: string }>; quotes: string[];
  compare: boolean; steps: boolean; growth: boolean; decline: boolean; world: boolean; question: boolean; definition: boolean;
  list: string[]; keywords: string[];
}

const NUM_RE = /([₹$€]?)\s*(\d[\d,]*(?:\.\d+)?)\s*(%|प्रतिशत|percent|रुपये|रुपए|रुपया|rupees|डॉलर|dollars|लाख|करोड़|करोड|हज़ार|हजार|million|billion|crore|lakh|thousand)?/giu;

export function extractFacts(sentence: string): Facts {
  const s = normalizeDigits(sentence);
  const numbers: Num[] = []; const years: Facts['years'] = [];
  for (const m of s.matchAll(NUM_RE)) {
    const value = parseFloat(m[2].replace(/,/g, ''));
    if (!isFinite(value)) continue;
    const before = s.slice(0, m.index).trim().split(/\s+/).pop() ?? '';
    const after = s.slice((m.index ?? 0) + m[0].length).trim().split(/\s+/).slice(0, 4).map(cleanWord).join(' ');
    if (!m[1] && !m[3] && Number.isInteger(value) && value >= 1500 && value <= 2100 && !m[2].includes(',')) { years.push({ year: value, label: after || before }); continue; }
    const suf = (m[3] ?? '').toLowerCase();
    const isPct = suf === '%' || suf === 'प्रतिशत' || suf === 'percent';
    numbers.push({ value, raw: m[0].trim(), unit: isPct ? '%' : (m[1] || /रुपये|रुपए|रुपया|rupees|डॉलर|dollars/.test(suf)) ? 'money' : suf ? 'scale' : '', prefix: m[1] ?? '', suffix: isPct ? '%' : m[3] ? ' ' + m[3] : '', label: cleanWord(before) });
  }
  const quotes = [...sentence.matchAll(/[“"]([^”"]{6,140})[”"]/g)].map((m) => m[1]);
  const has = (re: RegExp) => re.test(s.toLowerCase());
  const parts = sentence.split(/[,،;]|(?:^|\s)(?:और|फिर|तथा)(?=\s)|\b(?:and|then)\b/i).map((x) => (x ?? '').replace(/[।.!?]+$/, '').trim()).filter((x) => x.length > 2 && x.length < 60);
  const kw = tokenize(sentence).map(cleanWord).filter((w) => w.length >= 4 && !STOP.has(w.toLowerCase()) && !/^\d/.test(w));
  const keywords = [...new Set(kw)].sort((a, b) => b.length - a.length).slice(0, 3);
  return {
    numbers, years, quotes,
    compare: has(/बनाम|\bvs\b|versus|जबकि|मगर|अंतर|difference|compared|तुलना/),
    steps: has(/पहला|पहले|दूसरा|दूसरे|तीसरा|अंत में|सबसे पहले|\bstep\b|\bfirst\b|\bsecond\b|\bthird\b|finally/) || (/(^|\s)1[.)]\s/.test(s) && /(^|\s)2[.)]\s/.test(s)),
    growth: has(/बढ़|बढ|वृद्धि|grow|increase|rise|compound|ब्याज|multiply|गुना|तेज़ी|तेजी/),
    decline: has(/गिर|घट|कमी|decline|decrease|drop|fall|नुकसान|loss|crash/),
    world: has(/दुनिया|विश्व|global|world|देश|earth|पृथ्वी|international|अंतरराष्ट्रीय|ग्रह|planet/),
    question: /[?？]\s*$/.test(sentence.trim()) || has(/^(क्या|क्यों|कैसे|कौन|कब|what|why|how|who|when)\b/),
    definition: has(/कहते हैं|मतलब|means|is defined|यानी|अर्थात|refers to|is called/),
    list: parts.length >= 3 ? parts.slice(0, 5) : [], keywords
  };
}
