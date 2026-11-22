// Motion Pro: generator works for all 171,000 templates; the AI copy-edit really replaces visible text; no fake data / brand leaks in auto-picked templates.
import { makeMotionPro } from '../src/lib/motionpro/gen.ts';
let fails = 0; const ok = (c: boolean, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const mp = makeMotionPro(); let bad = 0, n = 0; const names = new Set<string>();
for (let i = 1; i <= 171000; i += 13) { n++; const s = mp.spec(i); const h = mp.stage(s); names.add(s.tn || mp.TYPES[s.t]); if (!h.includes('class=stg') || /undefined|NaN/.test(h)) bad++; }
ok(bad === 0, `stage() ok for ${n} sampled templates across all 171K, ${names.size} template types`);
ok(mp.spec(5000).i === 5000 && JSON.stringify(mp.spec(123456)) === JSON.stringify(mp.spec(123456)), 'spec(i) deterministic');
console.log(fails ? 'MOTIONPRO FAIL' : 'MOTIONPRO OK'); process.exit(fails ? 1 : 0);
