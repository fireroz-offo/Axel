// v1.0 advanced tier: GPU-shader recipes (custom GLSL, not stock materials): galaxy (20k GPU particles), liquid orb (noise-displaced fresnel/iridescent),
// hologram globe (scanlines, glitch, grid) and warp tunnel. Every uniform is a pure function of time => preview and MP4 export match.
// GLSL is compile-tested in a real browser (tests/visual/glsl_check.py); the look itself must be judged on a phone.
import * as THREE from 'three';
import { E, seg, clamp, rng, orbit } from './layout';
import type { Recipe } from './types';
import { V, glow, mixc, addDust, addStars, sway, label } from './recipes';

const NOISE = `
float h31(vec3 p){ p = fract(p*0.3183099 + vec3(0.71,0.113,0.419)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x), f.y), f.z); }
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a*vnoise(p); p = p*2.03 + 7.1; a *= 0.5; } return s; }`;

export const SHADERS = {
  galaxyV: `attribute vec4 aSeed; uniform float uTime, uGrow, uPx; uniform vec3 uColA, uColB; varying vec3 vCol; varying float vA;
void main(){
  float rr = pow(aSeed.x, 1.55), arm = floor(aSeed.y*3.0), ang = arm*2.0943951 + rr*7.5 + (aSeed.z-0.5)*0.9*(0.25+rr) + uTime*(0.5/(0.35+rr*1.6));
  float R = rr*6.2*uGrow;
  vec3 p = vec3(cos(ang)*R, (aSeed.w-0.5)*0.9*(1.0-rr*0.7)*uGrow, sin(ang)*R);
  vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv;
  gl_PointSize = (0.35 + aSeed.w*1.3 + (1.0-rr)*1.4) * uPx / max(0.5, -mv.z);
  vCol = mix(uColA, uColB, rr); vA = (0.35 + 0.65*(1.0-rr)) * clamp(uGrow*1.5, 0.0, 1.0);
}`,
  galaxyF: `varying vec3 vCol; varying float vA;
void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vCol*1.7, a*a*vA); }`,
  orbV: `${NOISE}
uniform float uTime, uAmp; varying vec3 vN, vV; varying float vNoise;
void main(){
  float n = fbm(position*0.9 + vec3(0.0, uTime*0.35, uTime*0.2)); vNoise = n;
  vec3 p = position + normal*(n - 0.45)*uAmp;
  vec4 mv = modelViewMatrix*vec4(p,1.0); vN = normalize(normalMatrix*normal); vV = -mv.xyz; gl_Position = projectionMatrix*mv;
}`,
  orbF: `uniform float uTime; uniform vec3 uColA, uColB; varying vec3 vN, vV; varying float vNoise;
void main(){
  vec3 N = normalize(vN), V = normalize(vV); float fr = pow(1.0 - clamp(dot(N,V),0.0,1.0), 2.4);
  vec3 irid = 0.5 + 0.5*cos(6.2831853*(vNoise*0.9 + fr*0.7 + vec3(0.0,0.33,0.67) + uTime*0.04));
  vec3 base = mix(uColA, uColB, smoothstep(0.25,0.75,vNoise));
  vec3 col = mix(base*0.55, irid*0.9 + base*0.3, 0.55) + fr*mix(uColB,vec3(1.0),0.4)*1.4;
  col += pow(max(dot(reflect(-V,N), normalize(vec3(0.4,0.8,0.5))),0.0), 24.0)*0.9;
  gl_FragColor = vec4(col, 1.0);
}`,
  holoV: `uniform float uTime; varying vec2 vUv; varying vec3 vN, vV, vW;
void main(){
  vec3 p = position; float g = step(0.985, sin(p.y*17.0 + uTime*9.0))*step(0.5, sin(uTime*1.7)); p.x += g*0.12;
  vec4 w = modelMatrix*vec4(p,1.0); vW = w.xyz; vUv = uv; vN = normalize(normalMatrix*normal);
  vec4 mv = viewMatrix*w; vV = -mv.xyz; gl_Position = projectionMatrix*mv;
}`,
  holoF: `uniform float uTime, uGrow; uniform vec3 uColA, uColB; varying vec2 vUv; varying vec3 vN, vV, vW;
void main(){
  vec3 N = normalize(vN), V = normalize(vV); float fr = pow(1.0 - clamp(dot(N,V),0.0,1.0), 1.8);
  vec2 g = vec2(vUv.x*48.0, vUv.y*24.0); vec2 f = abs(fract(g - 0.5) - 0.5)/fwidth(g); float line = 1.0 - clamp(min(f.x,f.y), 0.0, 1.0);
  float scan = 0.5 + 0.5*sin(vW.y*38.0 - uTime*3.2), sweep = smoothstep(0.06, 0.0, abs(fract(vW.y*0.25 - uTime*0.25) - 0.5) - 0.44);
  float flick = 0.9 + 0.1*sin(uTime*47.0);
  float a = (line*0.85 + fr*0.9 + scan*0.12 + sweep*0.7) * flick * clamp(uGrow*1.4, 0.0, 1.0);
  gl_FragColor = vec4(mix(uColA, uColB, fr + sweep)*1.6, clamp(a, 0.0, 1.0));
}`,
  tunnelV: `varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  tunnelF: `${NOISE}
uniform float uTime, uGrow; uniform vec3 uColA, uColB; varying vec2 vUv; varying vec3 vP;
void main(){
  float z = vUv.y*40.0 - uTime*5.0, ring = smoothstep(0.08, 0.0, abs(fract(z*0.35) - 0.5) - 0.42);
  float ang = vUv.x*6.2831853, streak = smoothstep(0.55, 1.0, vnoise(vec3(ang*9.0, z*0.12, uTime*0.5))) ;
  float depth = clamp(1.0 - vUv.y, 0.0, 1.0);
  vec3 col = mix(uColA, uColB, vUv.x) * (ring*1.4 + streak*0.9 + 0.08);
  col += mix(uColB, vec3(1.0), 0.5) * pow(depth, 6.0) * 1.8;
  gl_FragColor = vec4(col * clamp(uGrow*1.5, 0.0, 1.0), 1.0);
}`
};

const mat = (vs: string, fs: string, u: Record<string, any>, o: Record<string, any> = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: u, ...o });

// 23 ───────── GPU spiral galaxy: 3 arms, tens of thousands of shader-animated stars
const galaxy3d: Recipe = (x) => {
  const { scene, pal, tier, params } = x, n = Math.min(40000, tier.particles * 12 + 2000), r = rng(x.seed), seeds = new Float32Array(n * 4), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { seeds.set([r(), r(), r(), r()], i * 4); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));
  const u = { uTime: { value: 0 }, uGrow: { value: 0 }, uPx: { value: 420 * tier.pixelScale }, uColA: { value: pal.acc.clone() }, uColB: { value: pal.acc2.clone() } };
  const pts = new THREE.Points(g, mat(SHADERS.galaxyV, SHADERS.galaxyF, u, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); pts.frustumCulled = false; scene.add(pts);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.6, 1.9), toneMapped: false })); scene.add(core); const stars = addStars(x, 80);
  return {
    update(t, dur, cam) {
      u.uTime.value = t; u.uGrow.value = E.out(seg(t, 0, 1.8)); core.scale.setScalar(0.6 + 0.4 * E.out(seg(t, 0.2, 1)) + 0.05 * Math.sin(t * 3)); pts.rotation.x = 0.0; stars.rotation.y = t * 0.01;
      const k = clamp(t / dur), [cx, cy, cz] = orbit(k, x.fit * (12 - 3 * E.inout(k)), -0.4, 0.5, 5.2 - 2.2 * k); cam.position.set(cx, cy, cz); cam.lookAt(0, 0, 0); sway(cam, t, pal.doc, 0.03);
      return params.label ? [label(V(0, 2.6, 0), params.label, 0.9, undefined, true)] : [];
    }
  };
};

// 24 ───────── liquid orb: noise-displaced, iridescent fresnel sphere + light halo
const orb3d: Recipe = (x) => {
  const { scene, pal, tier, params } = x, detail = tier.segments >= 48 ? 22 : tier.segments >= 32 ? 14 : 8; addDust(x, 9);
  const u = { uTime: { value: 0 }, uAmp: { value: 0 }, uColA: { value: pal.acc2.clone() }, uColB: { value: pal.acc.clone() } };
  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, detail), mat(SHADERS.orbV, SHADERS.orbF, u)); orb.position.y = 2.4; scene.add(orb);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(2.6, 32, 32), new THREE.MeshBasicMaterial({ color: glow(pal.acc, 1.4), transparent: true, opacity: 0.09, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); halo.position.y = 2.4; scene.add(halo);
  const rings = [0.5, -0.8].map((tilt) => { const m = new THREE.Mesh(new THREE.TorusGeometry(3.1, 0.012, 8, 128), new THREE.MeshBasicMaterial({ color: glow(mixc(pal.acc2, pal.ink, 0.3), 1.8), toneMapped: false })); m.position.y = 2.4; m.rotation.x = Math.PI / 2 + tilt; scene.add(m); return m; });
  return {
    update(t, dur, cam) {
      u.uTime.value = t; u.uAmp.value = 1.25 * E.back(seg(t, 0, 1.2)) * (1 + 0.15 * Math.sin(t * 1.3)); const s = Math.max(0.001, E.back(seg(t, 0, 0.9))); orb.scale.setScalar(s); halo.scale.setScalar(s * (1 + 0.04 * Math.sin(t * 2))); orb.rotation.y = t * 0.2;
      rings.forEach((m, i) => { m.rotation.z = t * (0.35 + i * 0.2); m.scale.setScalar(s); });
      const k = clamp(t / dur); cam.position.set(Math.sin(k * 0.5 - 0.25) * 9.6 * x.fit, 3.4, Math.cos(k * 0.5 - 0.25) * 9.6 * x.fit); cam.lookAt(0, 2.4, 0); sway(cam, t, pal.doc);
      const lab = String(params.label ?? params.title ?? '').trim(); return lab ? [label(V(0, 5.5, 0), lab, 0.9, undefined, true)] : [];
    }
  };
};

// 25 ───────── hologram globe: lat/long grid, scan sweep, glitch, projector beam
const holo3d: Recipe = (x) => {
  const { scene, pal, tier, params } = x; addDust(x, 10); const u = { uTime: { value: 0 }, uGrow: { value: 0 }, uColA: { value: pal.acc2.clone() }, uColB: { value: pal.acc.clone() } };
  const ma = () => mat(SHADERS.holoV, SHADERS.holoF, u, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(2.2, tier.segments + 16, tier.segments), ma()); globe.position.y = 3.2; scene.add(globe);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(1.5, 24, 24), new THREE.MeshBasicMaterial({ color: glow(pal.acc2, 0.5), wireframe: true, transparent: true, opacity: 0.18, toneMapped: false })); inner.position.y = 3.2; scene.add(inner);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.2, 0.25, 64), new THREE.MeshStandardMaterial({ color: mixc(pal.bg1, pal.bg0, 0.3), metalness: 1, roughness: 0.25 })); base.position.y = 0.12; scene.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.03, 8, 96), new THREE.MeshBasicMaterial({ color: glow(pal.acc2, 2), toneMapped: false })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; scene.add(ring);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 2.0, 3, 48, 1, true), new THREE.MeshBasicMaterial({ color: glow(pal.acc2, 1.2), transparent: true, opacity: 0.07, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); beam.position.y = 1.8; scene.add(beam);
  return {
    update(t, dur, cam) {
      const g = E.out(seg(t, 0, 1.4)); u.uTime.value = t; u.uGrow.value = g; globe.scale.setScalar(Math.max(0.001, E.back(seg(t, 0, 0.9)))); globe.rotation.y = t * 0.35; inner.rotation.y = -t * 0.5; inner.scale.setScalar(globe.scale.x); ring.rotation.z = t * 0.8; beam.scale.y = Math.max(0.001, g);
      const k = clamp(t / dur); cam.position.set(Math.sin(k * 0.4 - 0.2) * 9.5 * x.fit, 3.2, Math.cos(k * 0.4 - 0.2) * 9.5 * x.fit); cam.lookAt(0, 3, 0); sway(cam, t, pal.doc);
      return params.label ? [label(V(0, 6.0, 0), params.label, 0.9, undefined, true)] : [];
    }
  };
};

// 26 ───────── warp tunnel: shader rings + streaks rushing toward a bright core (journey / transformation / speed)
const tunnel3d: Recipe = (x) => {
  const { scene, pal, params } = x; const u = { uTime: { value: 0 }, uGrow: { value: 0 }, uColA: { value: pal.acc2.clone() }, uColB: { value: pal.acc.clone() } };
  const geo = new THREE.CylinderGeometry(3, 3, 60, 64, 40, true); geo.rotateX(Math.PI / 2);
  const tube = new THREE.Mesh(geo, mat(SHADERS.tunnelV, SHADERS.tunnelF, u, { side: THREE.BackSide })); tube.position.z = -30; scene.add(tube);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.9, 24, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.4, 1.8), toneMapped: false })); core.position.z = -58; scene.add(core);
  return {
    update(t, dur, cam) {
      u.uTime.value = t; u.uGrow.value = E.out(seg(t, 0, 1)); core.scale.setScalar(1 + 0.2 * Math.sin(t * 4));
      const k = clamp(t / dur); cam.position.set(Math.sin(t * 0.6) * 0.5, Math.cos(t * 0.8) * 0.35, 4.5); cam.lookAt(Math.sin(t * 0.3) * 0.6, 0, -20); cam.rotation.z += Math.sin(t * 0.5) * 0.08 * k;
      const lab = String(params.label ?? params.title ?? '').trim(); return lab ? [label(V(0, 1.4, -2), lab, 0.8, undefined, true)] : [];
    }
  };
};

export const RECIPES3: Record<string, Recipe> = { galaxy3d, orb3d, holo3d, tunnel3d };
