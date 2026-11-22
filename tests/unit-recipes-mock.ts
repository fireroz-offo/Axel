// Runs every 3D recipe (old 10 + new 12) against a mock three.js: build + update at many times, in landscape and portrait, with real and empty params.
// Proves: no crash, no undefined variable, every label anchor is well-formed. It does NOT prove the WebGL look (that needs a real phone).
import { RECIPES } from '../src/engine/three-engine/recipes';
import { RECIPES2 } from '../src/engine/three-engine/recipes2';
import { RECIPES3 } from '../src/engine/three-engine/recipes3';
import { TIERS } from '../src/engine/three-engine/quality';
let fails = 0; const ok = (c: boolean, m: string) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const THREE: any = await import('three');
(globalThis as any).document = { createElement: () => new THREE.Group() }; // planet3d paints a CanvasTexture
const pal = (doc: boolean) => ({ bg0: new THREE.Color(), bg1: new THREE.Color(), acc: new THREE.Color(), acc2: new THREE.Color(), ink: new THREE.Color(), doc });
const ALL: Record<string, any> = { ...RECIPES, ...RECIPES2, ...RECIPES3 };
const params: Record<string, any[]> = {
  donut3d: [{ values: [40, 30, 20, 10], labels: ['A', 'B', 'C', 'D'], suffix: '%' }, { values: [1, 99] }],
  scale3d: [{ left: 'फायदे', right: 'नुकसान' }, {}], pipeline3d: [{ items: ['खोज', 'योजना', 'अमल'] }, { items: ['a', 'b', 'c', 'd', 'e'] }, {}],
  brain3d: [{ items: ['इनपुट', 'सोच', 'नतीजा'] }, {}], gears3d: [{ items: ['x', 'y', 'z'] }, {}],
  coins3d: [{ values: [1, 2, 4, 8] }, {}], chart3d: [{ values: [3, 5, 9] }], road3d: [{ events: [{ year: 1991, label: 'a' }, { year: 2000, label: 'b' }] }],
};
let n = 0;
for (const name of Object.keys(ALL)) {
  for (const p of params[name] ?? [{ label: 'विषय', title: 'T', items: ['a', 'b', 'c'] }, {}]) {
    for (const [aspect, fit] of [[16 / 9, 1], [9 / 16, 1.9]] as const) {
      let bad = '';
      try {
        const built = ALL[name]({ scene: new THREE.Scene(), pal: pal(name.length % 2 === 0), tier: TIERS.medium, params: p, seed: 1234, aspect, fit, env: null });
        for (const t of [-0.35, 0, 0.4, 1, 2.5, 5, 9]) {
          const lab = built.update(t, 10, new THREE.PerspectiveCamera());
          if (!Array.isArray(lab)) bad = 'update() did not return an array';
          for (const a of lab) if (!a.p || typeof a.text !== 'string' || !Number.isFinite(a.at)) bad = `bad anchor ${JSON.stringify({ t: a.text, at: a.at })}`;
        }
      } catch (e: any) { bad = String(e?.stack ?? e).split('\n').slice(0, 3).join(' | '); }
      n++; if (bad) ok(false, `${name} ${aspect > 1 ? 'land' : 'port'} ${JSON.stringify(p).slice(0, 40)}: ${bad}`);
    }
  }
}
ok(Object.keys(RECIPES3).length === 4 && Object.keys(RECIPES2).length === 12, '12 new recipes registered: ' + Object.keys(RECIPES2).join(','));
ok(fails === 0, `${n} recipe builds x 7 times executed without error`);
console.log(fails ? 'MOCK-THREE FAIL' : 'MOCK-THREE OK');
process.exit(fails ? 1 : 0);
