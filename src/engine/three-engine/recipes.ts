// 10 cinematic 3D scene recipes. The AI only picks a recipe and fills its data; the look (lighting, bloom, camera, easing) lives here.
// Each recipe builds its objects once, then update(t) poses them: frame = f(time).
import * as THREE from 'three';
import { E, seg, clamp, lerp, rng, orbit, barLayout, coinCounts, syntheticGrowth, fmtNum, cityBlocks, explodedY, helixPoints, nucleus, fibonacci, graticule, arcPoints, latLon, CITIES, networkGraph, roadPath, eventU, solveInOut, ribbonStrip } from './layout';
import type { Anchor, BuildCtx, Built, Recipe } from './types';

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const mixc = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, clamp(t));
export const dummy = new THREE.Object3D();
export const world = (o: THREE.Object3D, x: number, y: number, z: number) => o.localToWorld(V(x, y, z));
export const glow = (c: THREE.Color, k = 2) => c.clone().multiplyScalar(k); // >1 + toneMapped:false => blooms

export function addFloor({ scene, pal }: BuildCtx, size = 40) {
  const f = new THREE.Mesh(new THREE.CircleGeometry(size, 64), new THREE.MeshStandardMaterial({ color: mixc(pal.bg1, pal.bg0, 0.55), metalness: 0.7, roughness: 0.3 }));
  f.rotation.x = -Math.PI / 2; scene.add(f);
  const g = new THREE.GridHelper(size * 1.6, Math.round(size * 1.6), pal.acc.clone(), pal.acc.clone()); const m = g.material as THREE.LineBasicMaterial; m.transparent = true; m.opacity = 0.1; g.position.y = 0.01; scene.add(g);
}
export function addDust({ scene, pal, tier, seed }: BuildCtx, spread = 14, size = 0.05, n = tier.particles) {
  const r = rng(seed ^ 0x9e37), a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = (r() - 0.5) * spread * 2; a[i * 3 + 1] = r() * spread * 0.7; a[i * 3 + 2] = (r() - 0.5) * spread * 2; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: mixc(pal.acc, pal.ink, 0.5), size, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(p); return p;
}
export function addStars({ scene, pal, tier, seed }: BuildCtx, R = 70) {
  const r = rng(seed ^ 0x51ed), n = tier.stars, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const th = r() * 6.283, c = 2 * r() - 1, s = Math.sqrt(1 - c * c), k = R * (0.6 + 0.4 * r()); a[i * 3] = Math.cos(th) * s * k; a[i * 3 + 1] = c * k; a[i * 3 + 2] = Math.sin(th) * s * k; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: pal.ink.clone(), size: 0.22, transparent: true, opacity: 0.8, depthWrite: false, fog: false })); scene.add(p); return p;
}
export const sway = (cam: THREE.PerspectiveCamera, t: number, doc: boolean, a = 0.05) => { if (doc) { cam.position.x += Math.sin(t * 0.7) * a; cam.position.y += Math.cos(t * 0.9) * a * 0.6; } };
export const label = (p: THREE.Vector3, text: string, at: number, sub?: string, fixed = false): Anchor => ({ p, text, sub, at, fixed });

// 1 ───────── money / compound growth: columns of gold coins dropping in
const coins3d: Recipe = (x) => {
  const { scene, pal, tier, params } = x, real = Array.isArray(params.values) && params.values.length >= 2, vals: number[] = real ? params.values.slice(0, 8) : syntheticGrowth(7, params.dir === 'down' ? 'down' : 'up');
  const counts = coinCounts(vals, tier.maxCoins), N = vals.length, gap = 1.5, x0 = -((N - 1) * gap) / 2, total = counts.reduce((a, b) => a + b, 0), r = rng(x.seed);
  addFloor(x); const dust = addDust(x, 10);
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(0xf2c14e), metalness: 1, roughness: 0.24, emissive: new THREE.Color(0x3a2600), emissiveIntensity: 0.35 });
  const inst = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, tier.segments), mat, total); scene.add(inst);
  const items: Array<{ i: number; k: number; yaw: number; dx: number; dz: number }> = [];
  counts.forEach((n, i) => { for (let k = 0; k < n; k++) items.push({ i, k, yaw: r() * 6.28, dx: (r() - 0.5) * 0.07, dz: (r() - 0.5) * 0.07 }); });
  const colT = (i: number) => 0.3 + i * 0.28;
  return {
    update(t, dur, cam) {
      items.forEach((it, idx) => {
        const p = E.out(seg(t, colT(it.i) + it.k * 0.04, 0.5));
        dummy.position.set(x0 + it.i * gap + it.dx, 0.06 + it.k * 0.125 + (1 - p) * 5, it.dz); dummy.rotation.set((1 - p) * 3, it.yaw, 0); dummy.scale.setScalar(p > 0 ? 1 : 0.0001); dummy.updateMatrix(); inst.setMatrixAt(idx, dummy.matrix);
      });
      inst.instanceMatrix.needsUpdate = true; dust.rotation.y = t * 0.03;
      const u = clamp(t / dur), [cx, cy, cz] = orbit(u, x.fit * (11.5 - 2.5 * u), -0.5, 0.25, 3.2 + u * 0.8); cam.position.set(cx, cy, cz); cam.lookAt(0, 1.6, 0); sway(cam, t, pal.doc);
      return real ? vals.map((v, i) => label(V(x0 + i * gap, counts[i] * 0.125 + 0.7, 0), `${params.prefix ?? ''}${fmtNum(v)}${params.suffix ?? ''}`, colT(i) + counts[i] * 0.04 + 0.4, params.labels?.[i], true)) : [];
    }
  } as Built;
};

// 2 ───────── 3D bar chart (real numbers only)
const chart3d: Recipe = (x) => {
  const { scene, pal, params } = x, vals: number[] = (params.values ?? []).slice(0, 6), N = Math.max(1, vals.length), H = barLayout(vals.length ? vals : [1]), gap = 1.5, x0 = -((N - 1) * gap) / 2;
  addFloor(x); const dust = addDust(x, 10);
  const bars = H.map((_, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1, 0.95), new THREE.MeshPhysicalMaterial({ color: mixc(pal.acc2, pal.acc, N > 1 ? i / (N - 1) : 0.5), metalness: 0.3, roughness: 0.25, clearcoat: 1, emissive: mixc(pal.acc2, pal.acc, N > 1 ? i / (N - 1) : 0.5), emissiveIntensity: 0.18 })); scene.add(m); return m; });
  return {
    update(t, dur, cam) {
      bars.forEach((m, i) => { const hh = Math.max(0.001, H[i] * 4.2 * E.back(seg(t, 0.3 + i * 0.18, 0.85))); m.scale.y = hh; m.position.set(x0 + i * gap, hh / 2, 0); });
      dust.rotation.y = t * 0.03; const u = clamp(t / dur), [cx, cy, cz] = orbit(u, x.fit * 10.5, -0.55, 0.35, 3.5 + u * 0.7); cam.position.set(cx, cy, cz); cam.lookAt(0, 1.7, 0); sway(cam, t, pal.doc);
      return vals.map((v, i) => label(V(x0 + i * gap, H[i] * 4.2 + 0.55, 0), `${params.prefix ?? ''}${fmtNum(v)}${params.suffix ?? ''}`, 0.3 + i * 0.18 + 0.7, params.labels?.[i], true));
    }
  };
};

// 3 ───────── globe with graticule, dotted sphere and glowing arcs (stylised: no land mask)
const globe3d: Recipe = (x) => {
  const { scene, pal, tier, params } = x, R = 2.2, g = new THREE.Group(); scene.add(g); addDust(x, 12); const stars = addStars(x);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, tier.segments, tier.segments), new THREE.MeshStandardMaterial({ color: mixc(pal.bg1, pal.bg0, 0.3), metalness: 0.25, roughness: 0.55, emissive: pal.acc2.clone(), emissiveIntensity: 0.05 })));
  const gl = new THREE.BufferGeometry(); gl.setAttribute('position', new THREE.BufferAttribute(graticule(R * 1.001), 3)); g.add(new THREE.LineSegments(gl, new THREE.LineBasicMaterial({ color: pal.acc2.clone(), transparent: true, opacity: 0.3 })));
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(fibonacci(Math.min(1800, tier.particles + 400), R * 1.004), 3)); g.add(new THREE.Points(dg, new THREE.PointsMaterial({ color: pal.acc2.clone(), size: 0.028, transparent: true, opacity: 0.8 })));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.12, 32, 32), new THREE.MeshBasicMaterial({ color: pal.acc2.clone(), transparent: true, opacity: 0.1, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })));
  const r = rng(x.seed), idx = CITIES.map((_, i) => i).sort(() => r() - 0.5), arcs = Array.from({ length: 5 }, (_, k) => { const a = CITIES[idx[k * 2]], b = CITIES[idx[k * 2 + 1]], pts = arcPoints([a[1], a[2]], [b[1], b[2]], 64, R, 0.35); const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pts, 3)); const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: glow(pal.acc, 1.8), transparent: true, opacity: 0.95, toneMapped: false })); g.add(line); const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: glow(pal.ink, 2), toneMapped: false })); g.add(dot); const mk = (c: [string, number, number]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), new THREE.MeshBasicMaterial({ color: glow(pal.acc, 2), toneMapped: false })); m.position.set(...latLon(c[1], c[2], R * 1.01)); g.add(m); return m; }; return { pts, line, dot, m1: mk(a), m2: mk(b), t0: 0.7 + k * 0.45 }; });
  return {
    update(t, dur, cam) {
      const sc = lerp(0.001, 1, E.back(seg(t, 0, 0.9))); g.scale.setScalar(sc); g.rotation.set(0.3, t * 0.25 + 0.6, 0); stars.rotation.y = t * 0.01;
      for (const a of arcs) { const p = E.inout(seg(t, a.t0, 1.4)), n = Math.max(2, Math.floor(p * 65)); a.line.geometry.setDrawRange(0, n); const i = Math.min(64, Math.floor(p * 64)); a.dot.position.set(a.pts[i * 3], a.pts[i * 3 + 1], a.pts[i * 3 + 2]); a.dot.visible = p > 0 && p < 1; const pulse = 1 + 0.5 * Math.sin(t * 5); a.m1.scale.setScalar(p > 0 ? pulse : 0.001); a.m2.scale.setScalar(p >= 1 ? pulse : 0.001); }
      const u = clamp(t / dur); cam.position.set(Math.sin(u * 0.5 - 0.25) * x.fit * (9.6 - 1.8 * E.inout(u)), 1.2 + u * 0.8, Math.cos(u * 0.5 - 0.25) * x.fit * (9.6 - 1.8 * E.inout(u))); cam.lookAt(0, 0, 0); sway(cam, t, pal.doc, 0.03);
      return params.label ? [label(V(0, R * 1.45, 0), params.label, 0.6, undefined, true)] : [];
    }
  };
};

// 4 ───────── city that grows (business / economy / history) with a forward fly-through
const city3d: Recipe = (x) => {
  const { scene, pal, tier } = x, blocks = cityBlocks(x.seed, tier.cityGrid), n = blocks.length, ext = tier.cityGrid * 0.95;
  addFloor(x, 50); const dust = addDust(x, 12);
  const body = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: mixc(pal.bg1, pal.ink, 0.12), metalness: 0.55, roughness: 0.35 }), n);
  const top = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1), toneMapped: false }), n);
  blocks.forEach((b, i) => top.setColorAt(i, glow(mixc(pal.acc2, pal.acc, b.hue), 2.2))); scene.add(body, top);
  return {
    update(t, dur, cam) {
      blocks.forEach((b, i) => { const p = E.out(seg(t, 0.2 + b.dist * 0.06, 0.9)), h = Math.max(0.001, b.h * p); dummy.rotation.set(0, 0, 0); dummy.position.set(b.x, h / 2, b.z); dummy.scale.set(b.w, h, b.d); dummy.updateMatrix(); body.setMatrixAt(i, dummy.matrix); dummy.position.set(b.x, h + 0.03, b.z); dummy.scale.set(b.w * 0.92, 0.05, b.d * 0.92); dummy.updateMatrix(); top.setMatrixAt(i, dummy.matrix); });
      body.instanceMatrix.needsUpdate = true; top.instanceMatrix.needsUpdate = true; dust.rotation.y = t * 0.02;
      const u = E.inout(clamp(t / dur)), z = lerp(ext + 7, 2, u), sx = Math.sin(t * 0.35) * 1.6; cam.position.set(sx, lerp(2.4, 3.4, u), z * x.fit); cam.lookAt(sx * 0.4, 1.4, z * x.fit - 9); sway(cam, t, pal.doc);
      return [];
    }
  };
};

// 5 ───────── exploded view: layers separate and the camera circles them (technology / science / systems)
const exploded3d: Recipe = (x) => {
  const { scene, pal, params } = x, items: string[] = (params.items ?? []).slice(0, 5), N = Math.max(3, items.length), g = new THREE.Group(); scene.add(g); addDust(x, 10);
  const geo = new THREE.BoxGeometry(3.2, 0.16, 3.2), eg = new THREE.EdgesGeometry(geo);
  const slabs = Array.from({ length: N }, (_, i) => { const c = mixc(pal.acc2, pal.acc, N > 1 ? i / (N - 1) : 0.5), m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: c.clone().multiplyScalar(0.55), metalness: 0.6, roughness: 0.3, clearcoat: 0.6, emissive: c, emissiveIntensity: 0.12 })); m.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: glow(c, 1.6), toneMapped: false }))); g.add(m); return m; });
  const sp = new THREE.BufferGeometry(); sp.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)); const spine = new THREE.Line(sp, new THREE.LineBasicMaterial({ color: glow(pal.acc, 1.5), transparent: true, opacity: 0.5, toneMapped: false })); g.add(spine);
  return {
    update(t, dur, cam) {
      const e = E.inout(seg(t, 0.5, 1.4)), ys = explodedY(N, e); g.rotation.y = t * 0.3 + 0.4;
      slabs.forEach((m, i) => { m.position.set(0, ys[i], 0); m.rotation.y = i * 0.12 * e; });
      const a = sp.getAttribute('position') as THREE.BufferAttribute; a.setXYZ(0, 0, ys[0], 0); a.setXYZ(1, 0, ys[N - 1], 0); a.needsUpdate = true; spine.visible = e > 0.05;
      const u = clamp(t / dur); cam.position.set(Math.sin(0.4 + u * 0.3) * x.fit * 9.5, 4.6 + u * 0.8, Math.cos(0.4 + u * 0.3) * x.fit * 9.5); cam.lookAt(0, 2.4, 0); sway(cam, t, pal.doc);
      return items.map((s, i) => label(world(g, 1.75, ys[i], 1.75), s, 1.4 + i * 0.35));
    }
  };
};

// 6 ───────── atom / molecule (science)
const atom3d: Recipe = (x) => {
  const { scene, pal, params } = x, g = new THREE.Group(); scene.add(g); addDust(x, 9); const items: string[] = (params.items ?? []).slice(0, 3);
  const pts = nucleus(10, 0.5), nuc = new THREE.InstancedMesh(new THREE.SphereGeometry(0.27, 24, 24), new THREE.MeshStandardMaterial({ metalness: 0.2, roughness: 0.35, emissive: pal.acc.clone(), emissiveIntensity: 0.15 }), pts.length);
  pts.forEach((p, i) => { dummy.position.set(p[0], p[1], p[2]); dummy.scale.setScalar(1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); nuc.setMatrixAt(i, dummy.matrix); nuc.setColorAt(i, i % 2 ? pal.acc : pal.acc2); }); g.add(nuc);
  const radii = [1.9, 2.5, 3.1], tilts: Array<[number, number, number]> = [[Math.PI / 2.3, 0, 0], [Math.PI / 2.3, 0, Math.PI / 3], [Math.PI / 2.3, 0, -Math.PI / 3]];
  const rings = radii.map((R, k) => { const rg = new THREE.Group(); rg.rotation.set(...tilts[k]); rg.add(new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 8, 128), new THREE.MeshBasicMaterial({ color: glow(pal.acc2, 1.6), transparent: true, opacity: 0.7, toneMapped: false }))); const el = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), new THREE.MeshBasicMaterial({ color: glow(pal.ink, 2.2), toneMapped: false })); rg.add(el); g.add(rg); return { R, el, rg, sp: 1.4 - k * 0.3, ph: k * 2.1 }; });
  return {
    update(t, dur, cam) {
      g.scale.setScalar(lerp(0.001, 1, E.back(seg(t, 0, 0.8)))); g.rotation.set(0.25, t * 0.35, 0);
      for (const [k, r] of rings.entries()) { const a = t * r.sp + r.ph; r.el.position.set(Math.cos(a) * r.R, Math.sin(a) * r.R, 0); r.el.scale.setScalar(E.back(seg(t, 0.5 + k * 0.3, 0.5))); }
      const u = clamp(t / dur); cam.position.set(Math.sin(u * 0.4) * x.fit * 8.5, 1.5, Math.cos(u * 0.4) * x.fit * (8.8 - 1.2 * u)); cam.lookAt(0, 0, 0); sway(cam, t, pal.doc);
      return items.map((s, k) => label(world(rings[k].rg, Math.cos(t * rings[k].sp + rings[k].ph) * rings[k].R, Math.sin(t * rings[k].sp + rings[k].ph) * rings[k].R, 0), s, 1 + k * 0.5, undefined, true));
    }
  };
};

// 7 ───────── DNA-style double helix (health / biology)
const helix3d: Recipe = (x) => {
  const { scene, pal, tier, params } = x, n = tier.helix, H = 7, { a, b } = helixPoints(n, 2.5, 1.1, H), g = new THREE.Group(); scene.add(g); addDust(x, 9);
  const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 16, 16), new THREE.MeshStandardMaterial({ metalness: 0.3, roughness: 0.3, emissive: pal.acc.clone(), emissiveIntensity: 0.12 }), n * 2);
  for (let i = 0; i < n; i++) { for (const [j, p] of [a[i], b[i]].entries()) { dummy.position.set(p[0], p[1], p[2]); dummy.scale.setScalar(1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); inst.setMatrixAt(i * 2 + j, dummy.matrix); inst.setColorAt(i * 2 + j, j ? pal.acc2 : pal.acc); } } g.add(inst);
  const rp = new Float32Array(n * 6); for (let i = 0; i < n; i++) rp.set([...a[i], ...b[i]], i * 6); const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); const rungs = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: glow(pal.ink, 1.3), transparent: true, opacity: 0.55, toneMapped: false })); g.add(rungs);
  g.rotation.z = 0.35;
  return {
    update(t, dur, cam) {
      const p = E.out(seg(t, 0.2, 2.2)), k = Math.max(1, Math.ceil(p * n)); inst.count = k * 2; rungs.geometry.setDrawRange(0, k * 2); g.rotation.y = t * 0.6;
      const u = clamp(t / dur); cam.position.set(0, 0.4, x.fit * (10 - 1.5 * u)); cam.lookAt(0, 0, 0); sway(cam, t, pal.doc, 0.03);
      return params.label ? [label(V(0, H / 2 + 1.1, 0), params.label, 0.8, undefined, true)] : [];
    }
  };
};

// 8 ───────── ringed planet with moon and sun glow (space / science)
const planet3d: Recipe = (x) => {
  const { scene, pal, tier, params } = x, r = rng(x.seed), stars = addStars(x);
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const c2 = cv.getContext('2d')!;
  for (let y = 0; y < 256; y++) { const k = 0.5 + 0.5 * Math.sin(y * 0.09 + r() * 0.35) * Math.sin(y * 0.021 + 1.3), col = mixc(pal.bg1.clone().multiplyScalar(1.7), pal.acc, 0.25 + 0.6 * k); c2.fillStyle = `#${col.getHexString()}`; c2.fillRect(0, y, 512, 1); }
  for (let i = 0; i < 260; i++) { c2.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.05})`; c2.fillRect(r() * 512, r() * 256, 20 + r() * 90, 1 + r() * 4); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const planet = new THREE.Mesh(new THREE.SphereGeometry(2, tier.segments, tier.segments), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 })), grp = new THREE.Group(); grp.add(planet);
  grp.add(new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 32), new THREE.MeshBasicMaterial({ color: pal.acc2.clone(), transparent: true, opacity: 0.16, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false })));
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.8, 4.2, 128), new THREE.MeshBasicMaterial({ color: mixc(pal.acc, pal.ink, 0.3), transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = Math.PI / 2 - 0.45; grp.add(ring); scene.add(grp);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 24), new THREE.MeshStandardMaterial({ color: 0xbbbbbb, roughness: 0.95 })); scene.add(moon);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.6, 24, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 1.8), toneMapped: false })); sun.position.set(14, 4, -10); scene.add(sun);
  const sl = new THREE.DirectionalLight(0xfff1d6, 3.2); sl.position.copy(sun.position); scene.add(sl);
  return {
    update(t, dur, cam) {
      planet.rotation.y = t * 0.15; stars.rotation.y = t * 0.01; moon.position.set(Math.cos(t * 0.5) * 5.2, Math.sin(t * 0.5) * 0.8, Math.sin(t * 0.5) * 5.2);
      const u = E.inout(clamp(t / dur)); cam.position.set(lerp(-5, -1.5, u) * x.fit, lerp(1.2, 0.4, u), lerp(12, 8.5, u) * x.fit); cam.lookAt(0, 0, 0); sway(cam, t, pal.doc, 0.03);
      return params.label ? [label(V(0, 2.9, 0), params.label, 0.6, undefined, true)] : [];
    }
  };
};

// 9 ───────── network of nodes with travelling data packets (technology / internet / AI / data)
const network3d: Recipe = (x) => {
  const { scene, pal, tier, params } = x, gr = networkGraph(x.seed, tier.nodes, 2), n = tier.nodes, g = new THREE.Group(); scene.add(g); addDust(x, 10); const items: string[] = (params.items ?? []).slice(0, 5);
  const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1), toneMapped: false }), n);
  for (let i = 0; i < n; i++) nodes.setColorAt(i, glow(mixc(pal.acc2, pal.acc, clamp(gr.deg[i] / 6)), 2)); g.add(nodes);
  const ep = new Float32Array(gr.edges.length * 6); gr.edges.forEach(([i, j], e) => ep.set([gr.pos[i * 3], gr.pos[i * 3 + 1], gr.pos[i * 3 + 2], gr.pos[j * 3], gr.pos[j * 3 + 1], gr.pos[j * 3 + 2]], e * 6));
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3)); const edges = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: glow(pal.acc2, 1.4), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); g.add(edges);
  const rp = rng(x.seed ^ 0xabc), NP = Math.min(30, gr.edges.length), pk = Array.from({ length: NP }, () => ({ e: Math.floor(rp() * gr.edges.length), sp: 0.25 + rp() * 0.5, ph: rp() })), pa = new Float32Array(NP * 3), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pa, 3)); g.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: glow(pal.acc, 2), size: 0.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  return {
    update(t, dur, cam) {
      for (let i = 0; i < n; i++) { const s = E.back(seg(t, 0.1 + i * 0.012, 0.5)); dummy.position.set(gr.pos[i * 3], gr.pos[i * 3 + 1], gr.pos[i * 3 + 2]); dummy.scale.setScalar(Math.max(0.001, s) * (0.8 + gr.deg[i] * 0.12)); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); nodes.setMatrixAt(i, dummy.matrix); }
      nodes.instanceMatrix.needsUpdate = true; edges.geometry.setDrawRange(0, Math.floor(E.out(seg(t, 0.4, 1.6)) * gr.edges.length) * 2);
      pk.forEach((p, k) => { const [i, j] = gr.edges[p.e], s = (((t * p.sp + p.ph) % 1) + 1) % 1; for (let c = 0; c < 3; c++) pa[k * 3 + c] = lerp(gr.pos[i * 3 + c], gr.pos[j * 3 + c], s); }); (pg.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
      g.rotation.y = t * 0.18; const u = clamp(t / dur); cam.position.set(Math.sin(u * 0.4) * x.fit * 11, 2 + u, Math.cos(u * 0.4) * x.fit * (11 - 1.5 * u)); cam.lookAt(0, 0, 0); sway(cam, t, pal.doc, 0.03);
      return items.map((s, k) => { const h = gr.hubs[k] ?? 0; return label(world(g, gr.pos[h * 3], gr.pos[h * 3 + 1] + 0.35, gr.pos[h * 3 + 2]), s, 1 + k * 0.4, undefined, true); });
    }
  };
};

// 10 ───────── documentary timeline road: the camera travels along a glowing road, pillars rise at each real year in the script
const road3d: Recipe = (x) => {
  const { scene, pal, params } = x, ev: Array<{ year: number; label: string }> = (params.events ?? []).slice(0, 5), N = Math.max(1, ev.length);
  addFloor(x, 80); const dust = addDust(x, 16, 0.06);
  const ctrl = roadPath(N, x.seed).map(([px, pz]) => V(px, 0, pz)), curve = new THREE.CatmullRomCurve3(ctrl), samp = curve.getPoints(160).map((p: THREE.Vector3) => [p.x, 0.02, p.z]);
  const rb = ribbonStrip(samp, 2.2), rgeo = new THREE.BufferGeometry(); rgeo.setAttribute('position', new THREE.BufferAttribute(rb.pos, 3)); rgeo.setIndex(new THREE.BufferAttribute(rb.idx, 1)); scene.add(new THREE.Mesh(rgeo, new THREE.MeshBasicMaterial({ color: pal.acc.clone().multiplyScalar(0.5), transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })));
  const lg = new THREE.BufferGeometry().setFromPoints(curve.getPoints(160).map((p: THREE.Vector3) => V(p.x, 0.04, p.z))); scene.add(new THREE.Line(lg, new THREE.LineBasicMaterial({ color: glow(pal.acc, 1.8), toneMapped: false })));
  const uMax = eventU(N - 1, N) + 0.04, us = ev.map((_, i) => eventU(i, N));
  const pillars = ev.map((_, i) => { const at = curve.getPointAt(us[i]), g = new THREE.Group(); g.position.copy(at); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 1, 24), new THREE.MeshStandardMaterial({ color: mixc(pal.bg1, pal.ink, 0.35), metalness: 0.7, roughness: 0.3 })); const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({ color: glow(pal.acc, 2.2), toneMapped: false })); const base = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.025, 8, 48), new THREE.MeshBasicMaterial({ color: glow(pal.acc, 1.6), toneMapped: false })); base.rotation.x = Math.PI / 2; base.position.y = 0.03; g.add(body, cap, base); scene.add(g); return { g, body, cap, at }; });
  return {
    update(t, dur, cam) {
      const u = clamp(t / dur), cu = E.inout(u) * uMax, p = curve.getPointAt(clamp(cu)), tg = curve.getTangentAt(clamp(cu)), look = curve.getPointAt(clamp(cu + 0.1));
      cam.position.set(p.x - tg.x * 4.2 * x.fit, 2.4 + 0.3 * x.fit, p.z - tg.z * 4.2 * x.fit); cam.lookAt(look.x, 1.1, look.z); sway(cam, t, pal.doc); dust.position.set(p.x, 0, p.z);
      pillars.forEach((pl, i) => { const k = E.out(seg(cu, us[i] - 0.3, 0.16)), h = Math.max(0.001, k * 2.2); pl.body.scale.y = h; pl.body.position.y = h / 2; pl.cap.position.y = h + 0.25; pl.cap.scale.setScalar(Math.max(0.001, k)); });
      return ev.map((e, i) => label(V(pillars[i].at.x, 3.1, pillars[i].at.z), String(e.year), solveInOut(Math.max(0, us[i] - 0.14) / uMax) * dur, e.label, true));
    }
  };
};

export const RECIPES: Record<string, Recipe> = { coins3d, chart3d, globe3d, city3d, exploded3d, atom3d, helix3d, planet3d, network3d, road3d };
