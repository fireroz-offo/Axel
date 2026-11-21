// Automatic asset inspection: dependencies, libraries, seek hook, duration, tags and category. Pure string analysis (no execution).
import type { CategoryId } from '../types';

export interface AssetInfo { libs: string[]; hasSeek: boolean; duration: number; tags: string[]; category: CategoryId | 'other'; external: string[]; warnings: string[]; usesCanvas: boolean; usesWebgl: boolean }

const CAT_WORDS: Array<[CategoryId, RegExp]> = [
  ['finance', /finance|money|coin|stock|invest|bank|rupee|dollar|interest|profit|loan|वित्त|पैसा|शेयर|निवेश|ब्याज|बैंक/i],
  ['business', /business|growth|startup|revenue|sales|market|funnel|process|व्यापार|बिक्री|कंपनी/i],
  ['technology', /tech|circuit|chip|device|software|code|network|robot|data ?center|टेक|सर्किट|चिप/i],
  ['ai', /\bai\b|neural|machine learning|model|brain|एआई|न्यूरल/i],
  ['science', /science|molecule|atom|dna|cell|lab|chemistry|physics|विज्ञान|अणु|परमाणु/i],
  ['psychology', /psycholog|mind|emotion|brain|behavio|मनोविज्ञान|मन/i],
  ['history', /history|map|timeline|ancient|empire|war|इतिहास|नक्शा|साम्राज्य/i],
  ['education', /education|school|learn|book|study|शिक्षा|पढ़/i],
  ['health', /health|heart|medic|body|nutrition|स्वास्थ्य|दिल|दवा/i],
  ['space', /space|planet|star|galaxy|orbit|rocket|moon|अंतरिक्ष|ग्रह|तारा/i]
];
const TAG_WORDS = ['chart', 'graph', 'bar', 'line', 'pie', 'stat', 'counter', 'number', 'timeline', 'map', 'globe', 'steps', 'process', 'compare', 'quote', 'title', 'lower-third', 'intro', 'outro', 'arrow', 'icon', 'background', 'transition', 'coin', 'growth', 'loader'];

export function inspectHtml(html: string, userTags: string[] = [], external: string[] = []): AssetInfo {
  const warnings: string[] = [], lower = html.toLowerCase();
  const libs = [/gsap/.test(lower) && 'gsap', /lottie|bodymovin/.test(lower) && 'lottie', /three(\.js|\.min|\.module)|THREE\./.test(html) && 'three', /pixi/.test(lower) && 'pixi', /anime(\.min)?\.js|anime\(/.test(lower) && 'anime'].filter(Boolean) as string[];
  const hasSeek = /divrizSeek/.test(html);
  const usesCanvas = /<canvas|getContext\(/.test(html), usesWebgl = /webgl|THREE\./i.test(html);
  const meta = (n: string) => new RegExp(`<meta[^>]+name=["']${n}["'][^>]+content=["']([^"']*)["']`, 'i').exec(html)?.[1];
  const dm = parseFloat(meta('divriz-duration') ?? ''), duration = isFinite(dm) && dm > 0.5 && dm <= 30 ? dm : 4;
  const text = (html.replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ') + ' ' + (/<title>([^<]*)/i.exec(html)?.[1] ?? '')).slice(0, 4000);
  const idc = [...html.matchAll(/(?:class|id)=["']([^"']+)["']/g)].map((m) => m[1]).join(' ').toLowerCase();
  const tags = new Set<string>([...userTags, ...(meta('divriz-tags')?.split(',') ?? [])].map((t) => t.trim().toLowerCase()).filter(Boolean));
  for (const w of TAG_WORDS) if (idc.includes(w) || lower.includes('<title>') && new RegExp(`<title>[^<]*${w}`, 'i').test(html)) tags.add(w);
  if (/<svg[^>]*>[\s\S]*<(rect|path)[\s\S]*bar/i.test(html)) tags.add('bar');
  const hay = idc + ' ' + text + ' ' + [...tags].join(' ');
  const mc = meta('divriz-category') as CategoryId | undefined;
  const category = mc ?? CAT_WORDS.find(([, re]) => re.test(hay))?.[0] ?? 'other';
  if (external.length) warnings.push(`${external.length} network link hataye gaye (offline/safe rehne ke liye): ${external.slice(0, 3).join(', ')}${external.length > 3 ? '…' : ''}`);
  if (libs.includes('three') || libs.includes('pixi')) warnings.push('Three.js/PixiJS wali HTML tab chalegi jab library file ZIP mein hi ho; WebGL frame capture is phase mein limited hai.');
  if (/while\s*\(\s*(true|1)\s*\)|for\s*\(\s*;\s*;\s*\)/.test(html)) warnings.push('Infinite loop jaisa code mila — render atak sakta hai.');
  if (!hasSeek && !libs.length && !/@keyframes|animation|transition/i.test(html)) warnings.push('Koi animation nahi dikhi (CSS animation / GSAP / divrizSeek) — static frame banega.');
  if (usesCanvas && !hasSeek) warnings.push('Canvas animation tabhi time-ke-hisaab se chalegi jab aap window.divrizSeek(t) define karein.');
  return { libs, hasSeek, duration, tags: [...tags], category, external, warnings, usesCanvas, usesWebgl };
}
