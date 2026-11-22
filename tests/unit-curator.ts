import { smartHeadline, scoreTemplate, curateScenes, pixelBonus, sceneTempo, isHindi, type TemplateMetrics, type InspectOptions, type Inspector, type SceneNeeds } from '../src/lib/motion/curator.ts';
import { candidateMotions, rangeOf } from '../src/lib/motion/selector.ts';
const ok = (c: boolean, m: string) => { if (!c) { console.error('FAIL ' + m); process.exit(1); } console.log('PASS ' + m); };
const base: TemplateMetrics = { id: 1, tn: 'A', cat: '', titleSlot: true, subSlot: true, counter: 0, bars: 0, items: 0, labels: 0, animCount: 12, entranceEnd: 1.5, ambient: 3, spanning: 2, latinLeak: 0, otherDeva: 0, otherDigits: 0, otherSymbols: 0, textNodes: 3, titleOverflow: false, subOverflow: false, titleFont: 40, titleH: 0.1, clipped: 0, overlap: 0 };
const need: SceneNeeds = { currency: false, valueDigits: 0, dur: 4, hindi: true, wantsSub: false, counter: false, bars: 0, items: 0, tempo: 'normal' };
const S = (m: Partial<TemplateMetrics>, n: Partial<SceneNeeds> = {}) => scoreTemplate({ ...base, ...m }, { ...need, ...n }).score;

// headline
ok(smartHeadline('क्या आप जानते हैं कि भारत आज दुनिया की पाँचवीं सबसे बड़ी अर्थव्यवस्था है').startsWith('भारत आज'), 'headline drops the question lead');
ok(/3\.9/.test(smartHeadline('साल 2024 में भारत की जीडीपी 3.9 ट्रिलियन डॉलर तक पहुँच गई')), 'headline keeps the meaningful number, not the year');
ok(!/^(की|का|के|में)\s/.test(smartHeadline('साल 2024 में भारत की जीडीपी 3.9 ट्रिलियन डॉलर तक पहुँच गई')), 'headline never starts with a particle');
ok(smartHeadline('यह सब कैसे हुआ, पहले निवेश आया, फिर उत्पादन बढ़ा') === 'यह सब कैसे हुआ', 'headline = first clause');
ok(smartHeadline('आगे की राह चुनौतियों और अवसरों से भरी है, फैसला हमारे हाथ में है').endsWith('भरी'), 'headline drops trailing particle');
ok(smartHeadline('एक '.repeat(30)).length <= 46 + 3, 'headline length is bounded');
ok(isHindi('भारत की जीडीपी') && !isHindi('GDP of India'), 'language detection');

// scoring
ok(S({}) > S({ titleOverflow: true }), 'title overflow is penalised');
ok(S({}) > S({ latinLeak: 30 }), 'English placeholder text is penalised for Hindi scripts');
ok(S({}) > S({ otherSymbols: 2 }), 'fake currency amounts are penalised');
ok(S({ counter: 2 }, { counter: true, valueDigits: 1 }) > S({ counter: 0 }, { counter: true, valueDigits: 1 }), 'stat scene prefers a template with a number slot');
ok(S({ bars: 6 }, { bars: 4 }) > S({ bars: 0 }, { bars: 4 }), 'bar scene prefers bar slots');
ok(S({ entranceEnd: 1.2 }) > S({ entranceEnd: 7 }), 'animation must finish inside the scene');
ok(S({ entranceEnd: 0.8 }, { tempo: 'fast' }) > S({ entranceEnd: 3 }, { tempo: 'fast' }), 'fast voice prefers quick entrance');
ok(pixelBonus({ detail: 6, coverage: 0.07 }).v < 0 && pixelBonus({ detail: 18, coverage: 0.3 }).v > 0, 'empty-looking templates lose, rich ones win');

// tempo from words/sec and loudness
const fast = sceneTempo({ start: 0, end: 2, text: 'एक दो तीन चार पाँच छह सात आठ', words: [] }, null), slow = sceneTempo({ start: 0, end: 6, text: 'एक दो तीन चार', words: [] }, null);
ok(fast.tempo === 'fast' && slow.tempo === 'slow', 'tempo fast/slow from speech pace');

// candidates: distinct, spread over >=3 catalogue ranges, no demo-UI ranges for non-software text, deterministic
const c = candidateMotions('भारत की अर्थव्यवस्था', 'callout', 'other', 's:1', 10), c2 = candidateMotions('भारत की अर्थव्यवस्था', 'callout', 'other', 's:1', 10);
ok(c.length === 10 && new Set(c).size === 10, '10 distinct candidates');
ok(JSON.stringify(c) === JSON.stringify(c2), 'candidates are deterministic');
ok(!c.some((id) => ['SaaS Explainer', 'Claude Motion'].includes(rangeOf(id))), 'no demo-UI templates for a non-software script');
ok(candidateMotions('यह ऐप सब्सक्रिप्शन पर चलता है', 'callout', 'other', 's', 40).some((id) => ['SaaS Explainer', 'Claude Motion'].includes(rangeOf(id))), 'software script may use SaaS templates');
ok(new Set(candidateMotions('कंपनी का मुनाफा 40% बढ़ा', 'stat', 'other', 's', 12).map(rangeOf)).size >= 2, 'candidates span several ranges');

// curator driver: picks the best, never repeats a template, shortens an overflowing headline, keeps ranked candidates for swapping
const fake: Inspector = {
  async inspect(o: InspectOptions) {
    const good = o.id % 7 === 0; // pretend ids divisible by 7 are good templates
    return { ...base, id: o.id, tn: 'T' + (o.id % 3), titleSlot: good, latinLeak: good ? 0 : 40, titleOverflow: good && o.title.split(' ').length > 3 && o.id % 14 === 0 };
  }
};
const mk = (i: number, text: string, block = 'callout') => ({ id: i, text, start: i * 3, end: i * 3 + 3, block, params: {}, words: [], transition: 'fade', camera: { z0: 1, z1: 1, px: 0 }, reason: '' }) as any;
const scenes = [mk(0, 'भारत की अर्थव्यवस्था बहुत तेज़ी से बढ़ रही है', 'title'), mk(1, 'निवेश आया फिर उत्पादन बढ़ा'), mk(2, 'रोजगार भी बढ़ा और आय भी')];
const out = await curateScenes(scenes, { inspector: fake, width: 720, height: 1280, theme: { acc: '#fff', acc2: '#fff', bg0: '#000', bg1: '#000', ink: '#fff' }, captions: true, candidates: 10, seed: 'x' });
ok(out.length === 3 && out.every((s) => typeof s.params.motionId === 'number'), 'every scene gets a template');
ok(new Set(out.map((s) => s.params.motionId)).size === 3, 'no template is reused');
ok(out.every((s) => s.params.motionId % 7 === 0), 'the best-scoring candidate wins');
ok(out.every((s) => Array.isArray(s.params.candidates) && s.params.candidates.length >= 3 && s.params.candidates[0] === s.params.motionId), 'ranked candidate list kept for one-tap swapping');
ok(out.every((s) => s.params.curation && s.params.headline), 'curation reasons + headline stored');
console.log('CURATOR OK');
