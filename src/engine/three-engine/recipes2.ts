// v1.0: 12 more cinematic 3D recipes (donut, rocket, shield, pipeline, terrain, brain, bank, gears, scale, clock, heart, crystal).
// Same contract as recipes.ts: build objects once, then update(t) poses them => frame = f(time). Labels are projected to crisp 2D (Hindi-safe).
import * as THREE from 'three';
import { E, seg, clamp, lerp, rng, orbit, donutArcs, terrainH, neuralNet, gearOutline, gearRadius, gearRot, heartOutline, heartbeat, ecgY } from './layout';
import type { Recipe } from './types';
import { V, mixc, glow, dummy, world, addFloor, addDust, addStars, sway, label } from './recipes';

const pf = (x: { aspect: number }, k = 1.28) => (x.aspect < 1 ? k : 1); // wider framing on portrait phones

// 11 ───────── 3D donut (parts of a whole; real values only)
const donut3d: Recipe = (x) => {
  const { scene, pal, params, tier } = x, vals: number[] = (params.values ?? []).slice(0, 6), arcs = donutArcs(vals), N = arcs.length, Ro = 2.6, Ri = 1.3, depth = 0.9;
  addFloor(x); const dust = addDust(x, 10); const g = new THREE.Group(); g.rotation.x = -Math.PI / 2; scene.add(g);
  let hi = 0; arcs.forEach((a, i) => { if (a.frac > arcs[hi].frac) hi = i; });
  const segs = arcs.map((a, i) => {
    const sh = new THREE.Shape(); sh.absarc(0, 0, Ro, a.a0, a.a1, false); sh.absarc(0, 0, Ri, a.a1, a.a0, true); sh.closePath();
    const big = a.a1 - a.a0 > 0.25, geo = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: big, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: Math.max(8, Math.round(tier.segments * 0.6)) });
    const col = mixc(pal.acc2, pal.acc, N > 1 ? i / (N - 1) : 0.5), m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: col, metalness: 0.35, roughness: 0.28, clearcoat: 1, emissive: col, emissiveIntensity: 0.2 }));
    g.add(m); return m;
  });
  return {
    update(t, dur, cam) {
      segs.forEach((m, i) => { const k = E.back(seg(t, 0.3 + i * 0.22, 0.7)), pop = i === hi ? E.out(seg(t, 1.0 + N * 0.2, 0.7)) * 0.3 : 0; m.scale.z = Math.max(0.001, k); m.position.set(Math.cos(arcs[i].mid) * pop, Math.sin(arcs[i].mid) * pop, 0); });
      g.rotation.z = t * 0.12; g.updateMatrixWorld(true); dust.rotation.y = t * 0.03;
      const u = clamp(t / dur), [cx, cy, cz] = orbit(u, x.fit * 10.5 * pf(x), -0.55, 0.45, 6.4); cam.position.set(cx, cy, cz); cam.lookAt(0, 0.4, 0); sway(cam, t, pal.doc);
      return arcs.map((a, i) => label(world(g, Math.cos(a.mid) * (Ro + 0.75), Math.sin(a.mid) * (Ro + 0.75), depth + 0.3), `${Math.round(a.frac * 100)}%`, 0.9 + i * 0.22, params.labels?.[i] || undefined, true));
    }
  };
};

// 12 ───────── rocket launch (startup / launch / take-off)
const rocket3d: Recipe = (x) => {
  const { scene, pal, params, tier } = x, stars = addStars(x, 80), dust = addDust(x, 10); addFloor(x, 60);
  const body = new THREE.Group(); scene.add(body);
  const white = new THREE.MeshPhysicalMaterial({ color: 0xf4f6ff, metalness: 0.6, roughness: 0.25, clearcoat: 1 }), accM = new THREE.MeshPhysicalMaterial({ color: pal.acc.clone(), metalness: 0.5, roughness: 0.3, clearcoat: 1, emissive: pal.acc.clone(), emissiveIntensity: 0.15 });
  body.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 2.4, 32), white));
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 32), accM); nose.position.y = 1.75; body.add(nose);
  const win = new THREE.Mesh(new THREE.SphereGeometry(0.26, 20, 20), new THREE.MeshBasicMaterial({ color: glow(pal.acc2, 1.8), toneMapped: false })); win.position.set(0, 0.5, 0.5); win.scale.z = 0.5; body.add(win);
  const finGeo = new THREE.BoxGeometry(0.1, 0.9, 0.7); for (let k = 0; k < 3; k++) { const a = (k * Math.PI * 2) / 3, f = new THREE.Mesh(finGeo, accM); f.position.set(Math.sin(a) * 0.7, -1.0, Math.cos(a) * 0.7); f.rotation.y = a; body.add(f); }
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.9, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.6, 0.4), toneMapped: false, transparent: true, opacity: 0.92 })); flame.rotation.x = Math.PI; flame.position.y = -2.1; body.add(flame);
  const core = new THREE.Mesh(new THREE.ConeGeometry(0.22, 1.2, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 3, 2.6), toneMapped: false })); core.rotation.x = Math.PI; core.position.y = -1.8; body.add(core);
  const NP = tier.particles > 400 ? 160 : 70, pa = new Float32Array(NP * 3), pg = new THREE.BufferGeometry(), r = rng(x.seed), seeds = Array.from({ length: NP }, () => [r() - 0.5, r() - 0.5, r()]);
  pg.setAttribute('position', new THREE.BufferAttribute(pa, 3)); scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: new THREE.Color(3, 1.8, 0.6), size: 0.2, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  return {
    update(t, dur, cam) {
      const p = Math.pow(clamp((t - 0.4) / Math.max(0.5, dur - 0.4)), 1.7), py = 1.9 + p * 17; body.position.set(0, py, 0); body.rotation.z = Math.sin(t * 2.1) * 0.03 * (0.3 + p); body.rotation.y = t * 0.5;
      const fl = 1 + 0.15 * Math.sin(t * 40) + 0.1 * Math.sin(t * 23); flame.scale.set(1, fl * (0.5 + 0.7 * E.out(seg(t, 0.3, 0.5))), 1);
      for (let i = 0; i < NP; i++) { const age = (((t * 1.3 + seeds[i][2]) % 1) + 1) % 1; pa[i * 3] = seeds[i][0] * (0.4 + age * 2.4); pa[i * 3 + 1] = py - 2.4 - age * 5.5; pa[i * 3 + 2] = seeds[i][1] * (0.4 + age * 2.4); }
      (pg.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true; stars.rotation.y = t * 0.01; dust.position.y = 0;
      cam.position.set(Math.sin(t * 0.35) * 8 * x.fit * pf(x), py * 0.85 + 2.4, Math.cos(t * 0.35) * 9.5 * x.fit * pf(x)); cam.lookAt(0, py + 0.6, 0); sway(cam, t, pal.doc);
      return params.label ? [label(V(0, py + 3.4, 0), params.label, 0.9, undefined, true)] : [];
    }
  };
};

// 13 ───────── shield (security / insurance / risk protection)
const shield3d: Recipe = (x) => {
  const { scene, pal, params } = x; addFloor(x, 30); const dust = addDust(x, 10);
  const sh = new THREE.Shape(); sh.moveTo(0, 1.8); sh.lineTo(1.5, 1.3); sh.lineTo(1.5, 0.2); sh.quadraticCurveTo(1.4, -1.1, 0, -1.9); sh.quadraticCurveTo(-1.4, -1.1, -1.5, 0.2); sh.lineTo(-1.5, 1.3); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.45, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3, curveSegments: 12 }); geo.translate(0, 0, -0.22);
  const g = new THREE.Group(); g.position.y = 2.7; scene.add(g);
  g.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: mixc(pal.bg1, pal.acc2, 0.35), metalness: 0.9, roughness: 0.22, clearcoat: 1, emissive: pal.acc2.clone(), emissiveIntensity: 0.1 })));
  const ckM = new THREE.MeshBasicMaterial({ color: glow(pal.ink, 2), toneMapped: false }), ck = new THREE.Group(); const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.7, 0.12), ckM), a2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.3, 0.12), ckM);
  a1.position.set(-0.4, -0.1, 0.4); a1.rotation.z = Math.PI / 4; a2.position.set(0.3, 0.1, 0.4); a2.rotation.z = -Math.PI / 4; ck.add(a1, a2); g.add(ck);
  const fieldM = new THREE.MeshBasicMaterial({ color: glow(pal.acc2, 1.5), wireframe: true, transparent: true, opacity: 0.18, toneMapped: false }); g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(3.3, 2), fieldM));
  const rings = [0.5, -0.7].map((tilt) => { const m = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.02, 8, 96), new THREE.MeshBasicMaterial({ color: glow(pal.acc, 1.7), toneMapped: false })); m.rotation.x = Math.PI / 2 + tilt; g.add(m); return m; });
  const r = rng(x.seed), NT = 36, dirs = Array.from({ length: NT }, () => { const th = r() * 6.283, c = 2 * r() - 1, s = Math.sqrt(1 - c * c); return [Math.cos(th) * s, c, Math.sin(th) * s, r(), 0.35 + r() * 0.4]; });
  const pa = new Float32Array(NT * 3), pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pa, 3)); scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: new THREE.Color(3, 0.7, 0.6), size: 0.24, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  return {
    update(t, dur, cam) {
      g.scale.setScalar(Math.max(0.001, E.back(seg(t, 0, 0.9)))); g.rotation.y = Math.sin(t * 0.7) * 0.45; g.position.y = 2.7 + Math.sin(t * 1.2) * 0.12; ck.scale.setScalar(Math.max(0.001, E.back(seg(t, 1.0, 0.5))));
      rings.forEach((m, i) => { m.rotation.z = t * (0.5 + i * 0.25); });
      for (let i = 0; i < NT; i++) { const d = dirs[i], p = (((t * d[4] + d[3]) % 1) + 1) % 1, dist = lerp(9, 3.4, p); const on = E.out(seg(t, 0.8, 0.8)); pa[i * 3] = d[0] * dist * on; pa[i * 3 + 1] = 2.7 + d[1] * dist * on; pa[i * 3 + 2] = d[2] * dist * on; }
      (pg.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true; fieldM.opacity = 0.14 + 0.1 * Math.abs(Math.sin(t * 3.1)); dust.rotation.y = t * 0.03;
      const u = clamp(t / dur); cam.position.set(Math.sin(u * 0.4 - 0.2) * 9.5 * x.fit * pf(x), 3.6, Math.cos(u * 0.4 - 0.2) * 9.5 * x.fit * pf(x)); cam.lookAt(0, 2.7, 0); sway(cam, t, pal.doc);
      return params.label ? [label(V(0, 5.6, 0), params.label, 0.8, undefined, true)] : [];
    }
  };
};

// 14 ───────── pipeline: steps as machines joined by pipes with data packets
const pipeline3d: Recipe = (x) => {
  const { scene, pal, params } = x, items: string[] = (params.items ?? []).slice(0, 5), N = Math.max(2, items.length), gap = 3.4, x0 = -((N - 1) * gap) / 2, Y = 0.8;
  addFloor(x, 50); const dust = addDust(x, 14); const boxGeo = new THREE.BoxGeometry(1.9, 1.3, 1.3), eg = new THREE.EdgesGeometry(boxGeo);
  const nodes = Array.from({ length: N }, (_, i) => { const c = mixc(pal.acc2, pal.acc, N > 1 ? i / (N - 1) : 0.5), m = new THREE.Mesh(boxGeo, new THREE.MeshPhysicalMaterial({ color: c.clone().multiplyScalar(0.6), metalness: 0.5, roughness: 0.28, clearcoat: 0.8, emissive: c, emissiveIntensity: 0.16 })); m.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: glow(c, 1.8), toneMapped: false }))); m.position.set(x0 + i * gap, Y, 0); scene.add(m); return m; });
  const tubes = Array.from({ length: N - 1 }, (_, i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, gap - 1.9, 12), new THREE.MeshBasicMaterial({ color: glow(pal.acc, 1.5), toneMapped: false })); m.rotation.z = Math.PI / 2; m.position.set(x0 + i * gap + gap / 2, Y, 0); scene.add(m); return m; });
  const NP = 20, pa = new Float32Array(NP * 3), pg = new THREE.BufferGeometry(), r = rng(x.seed), ph = Array.from({ length: NP }, () => r()); pg.setAttribute('position', new THREE.BufferAttribute(pa, 3));
  scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: glow(pal.ink, 2), size: 0.24, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  const L = (N - 1) * gap;
  return {
    update(t, dur, cam) {
      nodes.forEach((m, i) => { const k = E.back(seg(t, 0.3 + i * 0.5, 0.6)); m.scale.setScalar(Math.max(0.001, k)); m.position.y = Y + 0.08 * Math.sin(t * 1.5 + i); });
      tubes.forEach((m, i) => { m.scale.y = Math.max(0.001, E.out(seg(t, 0.6 + i * 0.5, 0.5))); });
      const reveal = E.out(seg(t, 0.5, N * 0.5));
      for (let i = 0; i < NP; i++) { const f = (((t * 0.3 + ph[i]) % 1) + 1) % 1, vis = f <= reveal; pa[i * 3] = x0 + f * L; pa[i * 3 + 1] = vis ? Y : -50; pa[i * 3 + 2] = 0; }
      (pg.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true; dust.rotation.y = t * 0.02;
      const u = clamp(t / dur), d = x.fit * (6.5 + N * 1.5) * pf(x, 1.3); cam.position.set(Math.sin(u * 0.9 - 0.45) * 2.5, 3.4 + u, d); cam.lookAt(0, Y, 0); sway(cam, t, pal.doc);
      return items.map((s, i) => label(V(x0 + i * gap, 2.2, 0), s, 0.6 + i * 0.5));
    }
  };
};

// 15 ───────── market terrain: a living wireframe landscape (volatility / cycles)
const terrain3d: Recipe = (x) => {
  const { scene, pal, tier, params } = x, S = Math.min(56, tier.segments + 12), SZ = 16;
  const geo = new THREE.PlaneGeometry(SZ, SZ, S, S); geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute, n = pos.count, col = new Float32Array(n * 3); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.4, roughness: 0.5, flatShading: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: glow(pal.acc2, 1.4), wireframe: true, transparent: true, opacity: 0.22, toneMapped: false })));
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshBasicMaterial({ color: glow(pal.acc, 2.4), toneMapped: false })); scene.add(dot);
  const c0 = pal.bg1.clone().multiplyScalar(1.6), c1 = pal.acc2.clone(), c2 = pal.acc.clone(), tmp = new THREE.Color();
  return {
    update(t, dur, cam) {
      const amp = E.out(seg(t, 0, 1.2));
      for (let i = 0; i < n; i++) { const px = pos.getX(i), pz = pos.getZ(i), y = terrainH(px, pz, t) * amp; pos.setY(i, y); const k = clamp((y + 1.6) / 3.2); if (k < 0.5) tmp.copy(c0).lerp(c1, k * 2); else tmp.copy(c1).lerp(c2, (k - 0.5) * 2); col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b; }
      pos.needsUpdate = true; (geo.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
      const u = clamp(t / dur), mx = lerp(-6.5, 6.5, E.inout(u)), my = terrainH(mx, 0, t) * amp + 0.3; dot.position.set(mx, my, 0);
      const [cx, cy, cz] = orbit(u, x.fit * 13 * pf(x), -0.7, 0.7, 4.6); cam.position.set(cx, cy, cz); cam.lookAt(0, 0.2, 0); sway(cam, t, pal.doc);
      return params.label ? [label(V(mx, my + 1.1, 0), params.label, 0.8, undefined, true)] : [];
    }
  };
};

// 16 ───────── neural network / mind (AI, psychology, learning)
const brain3d: Recipe = (x) => {
  const { scene, pal, params } = x, net = neuralNet(x.seed, [4, 7, 7, 4]), L = 4, n = net.pos.length / 3, items: string[] = (params.items ?? []).slice(0, 3);
  const g = new THREE.Group(); scene.add(g); addDust(x, 10);
  const nodes = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 14, 14), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1), toneMapped: false }), n);
  for (let i = 0; i < n; i++) nodes.setColorAt(i, glow(mixc(pal.acc2, pal.acc, net.layer[i] / (L - 1)), 2)); g.add(nodes);
  const ep = new Float32Array(net.edges.length * 6); net.edges.forEach(([i, j], e) => ep.set([net.pos[i * 3], net.pos[i * 3 + 1], net.pos[i * 3 + 2], net.pos[j * 3], net.pos[j * 3 + 1], net.pos[j * 3 + 2]], e * 6));
  const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3)); g.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: glow(pal.acc2, 1.3), transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(4.2, 2), new THREE.MeshBasicMaterial({ color: glow(pal.acc, 1.3), wireframe: true, transparent: true, opacity: 0.07, toneMapped: false })); shell.scale.set(1.45, 0.95, 1); g.add(shell);
  const NS = net.edges.length, sa = new Float32Array(NS * 3), sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sa, 3));
  g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: glow(pal.acc, 2), size: 0.22, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  const CYC = 1.8, SPD = 0.9, STEP = 0.45, wv = (t: number, l: number) => (((t * SPD - l * STEP) % CYC) + CYC) % CYC;
  return {
    update(t, dur, cam) {
      const on = E.out(seg(t, 0.2, 0.8));
      for (let i = 0; i < n; i++) { const l = net.layer[i], w = wv(t, l - 1), pulse = l === 0 ? Math.exp(-Math.pow(wv(t, 0) / 0.15, 2)) : Math.exp(-Math.pow((w - STEP) / 0.12, 2)); dummy.position.set(net.pos[i * 3], net.pos[i * 3 + 1], net.pos[i * 3 + 2]); dummy.scale.setScalar(Math.max(0.001, on * (1 + 0.9 * pulse))); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); nodes.setMatrixAt(i, dummy.matrix); }
      nodes.instanceMatrix.needsUpdate = true;
      net.edges.forEach(([i, j], e) => { const l = net.layer[i], w = wv(t, l), k = w < STEP ? w / STEP : -1; if (k < 0 || on < 0.5) { sa[e * 3 + 1] = -50; return; } for (let c = 0; c < 3; c++) sa[e * 3 + c] = lerp(net.pos[i * 3 + c], net.pos[j * 3 + c], k); });
      (sg.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true; g.rotation.y = t * 0.22; g.updateMatrixWorld(true);
      const u = clamp(t / dur); cam.position.set(Math.sin(u * 0.5) * 11 * x.fit * pf(x), 2 + u, Math.cos(u * 0.5) * 11 * x.fit * pf(x)); cam.lookAt(0, 0, 0); sway(cam, t, pal.doc, 0.03);
      return items.map((s, k) => label(world(g, net.xs[Math.min(L - 1, k)] ?? 0, 2.3, 0), s, 1 + k * 0.6));
    }
  };
};

// 17 ───────── institution: classical bank / government building with a gold seal
const bank3d: Recipe = (x) => {
  const { scene, pal, params } = x; addFloor(x, 40); const dust = addDust(x, 12);
  const marble = new THREE.MeshPhysicalMaterial({ color: mixc(pal.ink, pal.bg1, 0.25), metalness: 0.15, roughness: 0.35, clearcoat: 0.5 }), gold = new THREE.MeshStandardMaterial({ color: pal.acc.clone(), metalness: 1, roughness: 0.28, emissive: pal.acc.clone(), emissiveIntensity: 0.2 });
  const g = new THREE.Group(); scene.add(g);
  const steps = [8.6, 8, 7.4].map((w, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, 3.4 - i * 0.3), marble); g.add(m); return m; });
  const NC = 6, xs = Array.from({ length: NC }, (_, i) => (i - (NC - 1) / 2) * 1.3), BASE = 0.75, CH = 3.2;
  const cols = xs.map((cx) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, CH, 24), marble), a = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.95), gold), b = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.95), gold); g.add(m, a, b); return { m, a, b, cx }; });
  const ent = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 1.9), marble); g.add(ent);
  const tri = new THREE.Shape(); tri.moveTo(-4, 0); tri.lineTo(4, 0); tri.lineTo(0, 1.4); tri.closePath();
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 1.5, bevelEnabled: false }), marble); g.add(ped);
  const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 40), gold); seal.rotation.x = Math.PI / 2; g.add(seal);
  return {
    update(t, dur, cam) {
      steps.forEach((m, i) => { const k = E.out(seg(t, 0.1 + i * 0.15, 0.5)); m.scale.y = Math.max(0.001, k); m.position.set(0, 0.125 * k + i * 0.25, 0); });
      cols.forEach((c, i) => { const k = E.out(seg(t, 0.5 + i * 0.14, 0.7)), h = Math.max(0.001, k); c.m.scale.y = h; c.m.position.set(c.cx, BASE + (CH * h) / 2, 0); c.a.position.set(c.cx, BASE + CH * h + 0.09, 0); c.b.position.set(c.cx, BASE - 0.09 + 0.18, 0); c.b.scale.y = k; c.a.scale.y = k; });
      const k2 = E.out(seg(t, 1.5, 0.8)), k3 = E.out(seg(t, 1.9, 0.8)); ent.position.set(0, BASE + CH + 0.38 + (1 - k2) * 4, 0); ent.scale.y = Math.max(0.001, k2); ped.position.set(0, BASE + CH + 0.58 + (1 - k3) * 4, -0.75); ped.scale.setScalar(Math.max(0.001, k3));
      seal.position.set(0, BASE + CH + 1.35 + (1 - k3) * 4, 0.8); seal.rotation.z = t * 1.2; dust.rotation.y = t * 0.02;
      const u = clamp(t / dur), [cx, , cz] = orbit(u, x.fit * 13.5 * pf(x), 0.5, -0.3, 0); cam.position.set(cx, 3.6 + u * 0.8, cz); cam.lookAt(0, 3, 0); sway(cam, t, pal.doc);
      return params.label ? [label(V(0, BASE + CH + 3.1, 0), params.label, 1.9, undefined, true)] : [];
    }
  };
};

// 18 ───────── meshing gears (systems, mechanisms, how it works)
const gears3d: Recipe = (x) => {
  const { scene, pal, params } = x, T = [12, 18, 10], R = T.map(gearRadius), items: string[] = (params.items ?? []).slice(0, 3);
  const P: Array<[number, number]> = [[0, 0], [R[0] + R[1], 0], [R[0] + R[1], R[1] + R[2]]], g = new THREE.Group(); scene.add(g); addDust(x, 12);
  const meshes = T.map((tc, i) => {
    const pts = gearOutline(tc, R[i] - 0.2, R[i] + 0.2), sh = new THREE.Shape(pts.map((p) => new THREE.Vector2(p[0], p[1]))), hole = new THREE.Path(); hole.absarc(0, 0, R[i] * 0.28, 0, Math.PI * 2, true); sh.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2, curveSegments: 16 }); geo.translate(0, 0, -0.27);
    const col = mixc(pal.acc2, pal.acc, i / 2), m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: col.clone().multiplyScalar(0.75), metalness: 0.95, roughness: 0.28, clearcoat: 0.4, emissive: col, emissiveIntensity: 0.08 }));
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(R[i] * 0.2, R[i] * 0.2, 0.9, 24), new THREE.MeshStandardMaterial({ color: 0x20242e, metalness: 1, roughness: 0.3 })); hub.rotation.x = Math.PI / 2; m.add(hub);
    m.position.set(P[i][0], P[i][1], 0); g.add(m); return m;
  });
  return {
    update(t, dur, cam) {
      const r0 = t * 0.7, r1 = gearRot(r0, T[0], T[1], 0), r2 = gearRot(r1, T[1], T[2], Math.PI / 2);
      [r0, r1, r2].forEach((r, i) => { const m = meshes[i]; m.rotation.z = r; m.scale.setScalar(Math.max(0.001, E.back(seg(t, i * 0.25, 0.7)))); });
      g.updateMatrixWorld(true);
      const u = clamp(t / dur), [cx, , cz] = orbit(u, x.fit * 12.5 * pf(x), -0.3, 0.3, 0); cam.position.set(2.2 + cx, 2.8, cz); cam.lookAt(2.2, 1.6, 0); sway(cam, t, pal.doc);
      return items.map((s, i) => label(V(P[i][0], P[i][1] + R[i] + 0.9, 0), s, 1 + i * 0.5));
    }
  };
};

// 19 ───────── balance scale (compare / trade-off). It swings and settles level: no verdict is implied.
const scale3d: Recipe = (x) => {
  const { scene, pal, params } = x; addFloor(x, 30); const dust = addDust(x, 10);
  const metal = new THREE.MeshPhysicalMaterial({ color: mixc(pal.acc, pal.ink, 0.25), metalness: 1, roughness: 0.25, clearcoat: 0.6 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.8, 0.3, 40), metal); base.position.y = 0.15; scene.add(base);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 5, 16), metal); pillar.position.y = 2.8; scene.add(pillar);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 20), metal); cap.position.y = 5.3; scene.add(cap);
  const beam = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.14, 0.22), metal); beam.position.y = 5.3; scene.add(beam);
  const mkPan = (c: THREE.Color) => { const gp = new THREE.Group(), d = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.9, 0.14, 36), metal), o = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 24), new THREE.MeshStandardMaterial({ color: c, metalness: 0.4, roughness: 0.25, emissive: c, emissiveIntensity: 0.5 })); o.position.y = 0.55; gp.add(d, o); scene.add(gp); return gp; };
  const panL = mkPan(pal.acc), panR = mkPan(pal.acc2);
  const sa = new Float32Array(12 * 3), sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sa, 3)); scene.add(new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ color: glow(pal.ink, 1.2), transparent: true, opacity: 0.7, toneMapped: false })));
  return {
    update(t, dur, cam) {
      const k = E.back(seg(t, 0, 0.8)), s0 = Math.max(0.001, k); [base, pillar, cap, beam, panL, panR].forEach((o) => o.scale.setScalar(s0));
      const tt = Math.max(0, t - 0.5), ang = tt <= 0 ? 0.5 : 0.5 * Math.exp(-1.3 * tt) * Math.cos(5 * tt); beam.rotation.z = ang;
      const ends = [-3.1, 3.1].map((px) => V(px * Math.cos(ang) * s0, 5.3 + px * Math.sin(ang) * s0, 0)), pans = [panL, panR];
      pans.forEach((p, i) => p.position.set(ends[i].x, ends[i].y - 2.4 * s0, 0));
      const sp: Array<[number, number]> = [[-0.8, 0], [0.8, 0], [0, 0.8]]; let q = 0;
      for (let i = 0; i < 2; i++) for (const [dx, dz] of sp) { const e = ends[i], p = pans[i].position; sa.set([e.x, e.y, 0, p.x + dx * s0, p.y + 0.05, dz * s0], q * 6); q++; }
      (sg.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true; dust.rotation.y = t * 0.03;
      const u = clamp(t / dur), [cx, cy, cz] = orbit(u, x.fit * 13 * pf(x), -0.35, 0.35, 4.4); cam.position.set(cx, cy, cz); cam.lookAt(0, 3, 0); sway(cam, t, pal.doc);
      const out: Array<ReturnType<typeof label>> = []; if (params.left) out.push(label(V(ends[0].x, ends[0].y - 0.9, 0), String(params.left), 0.9, undefined, true)); if (params.right) out.push(label(V(ends[1].x, ends[1].y - 0.9, 0), String(params.right), 1.2, undefined, true)); return out;
    }
  };
};

// 20 ───────── clock with motion-blur ghost hands (time, patience, compounding years)
const clock3d: Recipe = (x) => {
  const { scene, pal, params } = x; addDust(x, 10); const stars = addStars(x, 60);
  const g = new THREE.Group(); g.position.y = 2.2; scene.add(g);
  const faceG = new THREE.CylinderGeometry(3, 3, 0.35, 64); faceG.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(faceG, new THREE.MeshPhysicalMaterial({ color: mixc(pal.bg1, pal.bg0, 0.4), metalness: 0.6, roughness: 0.3, clearcoat: 0.6 })));
  g.add(new THREE.Mesh(new THREE.TorusGeometry(3.05, 0.12, 16, 96), new THREE.MeshStandardMaterial({ color: pal.acc.clone(), metalness: 1, roughness: 0.25, emissive: pal.acc.clone(), emissiveIntensity: 0.25 })));
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, 0.4, 0.1), new THREE.MeshBasicMaterial({ color: glow(pal.ink, 1.6), toneMapped: false }), 60);
  for (let i = 0; i < 60; i++) { const a = (i * Math.PI * 2) / 60, big = i % 5 === 0; dummy.position.set(Math.sin(a) * 2.6, Math.cos(a) * 2.6, 0.22); dummy.rotation.set(0, 0, -a); dummy.scale.set(big ? 1.7 : 0.7, big ? 1.5 : 0.8, 1); dummy.updateMatrix(); ticks.setMatrixAt(i, dummy.matrix); } g.add(ticks);
  const hand = (len: number, w: number, c: THREE.Color, op = 1) => { const geo = new THREE.BoxGeometry(w, len, 0.1); geo.translate(0, len / 2, 0); const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, transparent: op < 1, opacity: op, toneMapped: false, depthWrite: op >= 1 })); m.position.z = 0.3; g.add(m); return m; };
  const hour = hand(1.5, 0.2, glow(pal.ink, 1.8)), minute = hand(2.3, 0.12, glow(pal.acc, 2)), ghosts = Array.from({ length: 6 }, (_, k) => hand(2.3, 0.1, glow(pal.acc, 1.6), 0.3 - k * 0.045));
  const centre = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshBasicMaterial({ color: glow(pal.acc, 2), toneMapped: false })); centre.position.z = 0.35; g.add(centre);
  return {
    update(t, dur, cam) {
      g.scale.setScalar(Math.max(0.001, E.back(seg(t, 0, 0.9)))); g.rotation.y = Math.sin(t * 0.4) * 0.35; g.rotation.x = -0.08;
      const m = -t * 2.6; minute.rotation.z = m; hour.rotation.z = m / 12; ghosts.forEach((h, k) => { h.rotation.z = m + (k + 1) * 0.07; }); stars.rotation.y = t * 0.01;
      const u = clamp(t / dur); cam.position.set(Math.sin(u * 0.3) * 1.2, 2.5, x.fit * 11 * pf(x, 1.2)); cam.lookAt(0, 2.2, 0); sway(cam, t, pal.doc);
      return params.label ? [label(V(0, 6.0, 0), params.label, 0.8, undefined, true)] : [];
    }
  };
};

// 21 ───────── beating heart with ECG trace (health / fitness)
const heart3d: Recipe = (x) => {
  const { scene, pal, params } = x; addFloor(x, 30); addDust(x, 10);
  const sh = new THREE.Shape(heartOutline(72, 2.8).map((p) => new THREE.Vector2(p[0], p[1])));
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.35, bevelSize: 0.3, bevelSegments: 6, curveSegments: 24 }); geo.translate(0, 0, -0.45);
  const red = new THREE.Color(0xe0314b), mat = new THREE.MeshPhysicalMaterial({ color: red, metalness: 0.2, roughness: 0.22, clearcoat: 1, emissive: red.clone(), emissiveIntensity: 0.25 });
  const g = new THREE.Group(); g.position.y = 2.9; g.add(new THREE.Mesh(geo, mat)); scene.add(g);
  const rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.025, 8, 80), new THREE.MeshBasicMaterial({ color: glow(pal.acc2, 1.8), transparent: true, opacity: 0, toneMapped: false, depthWrite: false })); m.position.y = 2.9; scene.add(m); return m; });
  const NE = 160, ea = new Float32Array(NE * 3), eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ea, 3)); const ecg = new THREE.Line(eg, new THREE.LineBasicMaterial({ color: glow(pal.acc2, 2), toneMapped: false })); scene.add(ecg);
  return {
    update(t, dur, cam) {
      const b = heartbeat(t), s = Math.max(0.001, E.back(seg(t, 0, 0.9))) * (1 + 0.16 * b); g.scale.setScalar(s); g.rotation.y = Math.sin(t * 0.8) * 0.5; mat.emissiveIntensity = 0.25 + 0.5 * b;
      rings.forEach((m, k) => { const ph = (((t * 1.1 - 0.06 - k * 0.33) % 1) + 1) % 1; m.scale.setScalar(1 + ph * 2.2); (m.material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.7 * E.out(seg(t, 0.8, 0.5)); });
      for (let i = 0; i < NE; i++) { const u = i / (NE - 1), px = (u - 0.5) * 10, ph = ((((u * 2) - t * 0.55) % 1) + 1) % 1; ea[i * 3] = px; ea[i * 3 + 1] = 0.9 + ecgY(ph) * 0.9; ea[i * 3 + 2] = -0.5; }
      (eg.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true; eg.setDrawRange(0, Math.max(2, Math.floor(E.out(seg(t, 0.6, 1.4)) * NE)));
      const u = clamp(t / dur); cam.position.set(Math.sin(u * 0.4 - 0.2) * 1.5, 3.2, x.fit * 10.5 * pf(x)); cam.lookAt(0, 2.4, 0); sway(cam, t, pal.doc);
      return params.label ? [label(V(0, 5.4, 0), params.label, 0.8, undefined, true)] : [];
    }
  };
};

// 22 ───────── crystal: abstract concept scene with orbiting shards (generic 3D for plain concept sentences)
const crystal3d: Recipe = (x) => {
  const { scene, pal, params, tier } = x, r = rng(x.seed); addDust(x, 12); const stars = addStars(x, 60);
  const g = new THREE.Group(); g.position.y = 2.6; scene.add(g);
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 0), new THREE.MeshPhysicalMaterial({ color: mixc(pal.acc2, pal.bg1, 0.4), metalness: 1, roughness: 0.12, flatShading: true, clearcoat: 1, emissive: pal.acc2.clone(), emissiveIntensity: 0.12 })));
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.52, 0)), new THREE.LineBasicMaterial({ color: glow(pal.acc, 1.8), toneMapped: false })));
  const NS = Math.min(36, Math.round(tier.particles / 20) + 10), shards = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshStandardMaterial({ color: pal.acc.clone(), metalness: 1, roughness: 0.25, emissive: pal.acc.clone(), emissiveIntensity: 0.3 }), NS);
  const sd = Array.from({ length: NS }, () => ({ rad: 2.4 + r() * 1.6, sp: 0.3 + r() * 0.5, ph: r() * 6.283, tilt: (r() - 0.5) * 1.6, s: 0.6 + r() })); g.add(shards);
  const rings = [0.4, -0.5].map((tilt) => { const m = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.015, 8, 120), new THREE.MeshBasicMaterial({ color: glow(pal.acc2, 1.6), toneMapped: false })); m.rotation.x = Math.PI / 2 + tilt; g.add(m); return m; });
  return {
    update(t, dur, cam) {
      const e = Math.max(0.001, E.back(seg(t, 0, 0.9))); g.scale.setScalar(e); g.rotation.set(t * 0.18, t * 0.4, 0);
      sd.forEach((s, i) => { const a = t * s.sp + s.ph, px = Math.cos(a) * s.rad, py0 = Math.sin(a * 0.7) * s.rad * 0.35, pz0 = Math.sin(a) * s.rad; dummy.position.set(px, py0 * Math.cos(s.tilt) - pz0 * Math.sin(s.tilt), py0 * Math.sin(s.tilt) + pz0 * Math.cos(s.tilt)); dummy.rotation.set(a * 2, a * 1.3, 0); dummy.scale.setScalar(s.s); dummy.updateMatrix(); shards.setMatrixAt(i, dummy.matrix); });
      shards.instanceMatrix.needsUpdate = true; rings.forEach((m, i) => { m.rotation.z = t * (0.3 + i * 0.2); }); stars.rotation.y = t * 0.01;
      const u = clamp(t / dur); cam.position.set(Math.sin(u * 0.5 - 0.25) * 10.5 * x.fit * pf(x), 3.4, Math.cos(u * 0.5 - 0.25) * 10.5 * x.fit * pf(x)); cam.lookAt(0, 2.6, 0); sway(cam, t, pal.doc);
      const lab = String(params.label ?? params.title ?? '').trim(); return lab ? [label(V(0, 5.6, 0), lab, 0.8, undefined, true)] : [];
    }
  };
};

export const RECIPES2: Record<string, Recipe> = { donut3d, rocket3d, shield3d, pipeline3d, terrain3d, brain3d, bank3d, gears3d, scale3d, clock3d, heart3d, crystal3d };
