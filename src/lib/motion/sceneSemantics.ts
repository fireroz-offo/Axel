import type { SceneSpec } from '../brain/plan';

export const PRE = 0.35;
export function spokenAt(s: SceneSpec, label: string, fallback: number): number {
  const toks = label.split(/\s+/).map((x) => x.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase()).filter((x) => x.length >= 2);
  for (const tk of toks) {
    const w = s.words.find((x) => x.w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase().startsWith(tk.slice(0, Math.max(2, tk.length - 1))));
    if (w) return Math.max(0, w.t0 - s.start - 0.05 + PRE);
  }
  return fallback;
}

export type Subject = 'robot' | 'temple' | 'coins' | 'person' | 'skyline' | 'chip';
export const SUBJECTS: Subject[] = ['robot', 'temple', 'coins', 'person', 'skyline', 'chip'];
const RULES: Array<[RegExp, Subject]> = [
  [/पैसा|पैसे|निवेश|बैंक|ब्याज|रुपय|धन|मुद्रा|कमाई|बचत|money|invest|bank|interest|coin|profit|wealth|income|saving|₹|\$/, 'coins'],
  [/इतिहास|प्राचीन|साम्राज्य|मंदिर|सभ्यता|राजा|युद्ध|history|ancient|empire|temple|roman|greek|war|civiliz|king/, 'temple'],
  [/कंपनी|बाज़ार|बाजार|व्यापार|शहर|कारोबार|उद्योग|company|market|business|city|startup|industry|economy|अर्थव्यवस्था/, 'skyline'],
  [/\bai\b|रोबोट|एआई|मशीन|robot|machine|automat|artificial/, 'robot'],
  [/तकनीक|कंप्यूटर|डेटा|इंटरनेट|सॉफ़्टवेयर|चिप|मोबाइल|tech|computer|data|internet|software|chip|digital|device|processor/, 'chip'],
  [/इंसान|लोग|मन|दिमाग|व्यवहार|भावना|मनोविज्ञान|human|people|mind|brain|behavio|emotion|psycholog|person/, 'person']
];
const POOL: Record<string, Subject[]> = { finance: ['coins', 'skyline', 'person'], business: ['skyline', 'coins', 'person'], technology: ['chip', 'robot', 'skyline'], ai: ['robot', 'chip', 'person'], history: ['temple', 'person', 'skyline'], psychology: ['person', 'robot', 'chip'], health: ['person', 'chip', 'robot'], science: ['chip', 'robot', 'person'], space: ['chip', 'robot', 'skyline'], education: ['person', 'robot', 'chip'] };
export function subjectsFor(text: string, category = 'other'): Subject[] {
  const t = text.toLowerCase(), out: Subject[] = [];
  for (const [re, kind] of RULES) if (re.test(t) && !out.includes(kind)) out.push(kind);
  for (const kind of POOL[category] ?? ['robot', 'chip', 'person']) if (!out.includes(kind)) out.push(kind);
  return out;
}
export const pickSubject = (text: string, category = 'other', avoid?: Subject): Subject => {
  const choices = subjectsFor(text, category);
  return choices.find((x) => x !== avoid) ?? choices[0];
};
