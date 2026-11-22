# v1.0.0 report: what was added, what was verified, what was not

## Added
| Area | Count | Where |
|---|---|---|
| 3D recipes (Three.js, stock materials) | +12 | `src/engine/three-engine/recipes2.ts` |
| 3D recipes (custom GLSL shaders) | +4 | `src/engine/three-engine/recipes3.ts` |
| Pro 2D blocks | +8 | `src/lib/motion/pro2.ts` |
| Motion Pro templates (AI-editable) | 171,000 | `src/lib/motionpro/` |
| Block catalogue | 24 -> 48 | `src/lib/brain/plan.ts` |

3D total: 26 recipes (donut, rocket, shield, pipeline, terrain, neural net, bank, gears, balance scale, clock, heart+ECG, crystal, galaxy, liquid orb, hologram globe, warp tunnel + the previous 10). Each is chosen by the planner only when the sentence supports it (e.g. 3D donut needs real percentages; the scale never implies a verdict).

## Verified in this sandbox (real evidence)
- `tsc` strict: no errors in all new/changed modules (three.js typed via a shim, React via a loose shim).
- Logic tests PASS: `unit-v1` (layout maths incl. gear meshing at 200 rotations, planner picks, no-fake-data rules), `unit-motionpro` (13,154 sampled templates across all 171K), earlier suites.
- `unit-recipes-mock`: all 26 recipes build and update at 7 times in landscape+portrait against a mock three.js: no crash, valid label anchors (102 builds).
- **GLSL**: all 4 custom shaders compile and link in a real WebGL2 context (`tests/visual/glsl_check.py`).
- **2D blocks**: rendered in headless Chromium (landscape); no errors; visually reviewed.
- **Motion Pro**: rendered through the real `AssetRuntime` in Chromium: count-up numbers, Hindi text, theme colours, timeline, bullets, 3D CSS scenes; 67 allow-listed templates auto-checked for visible content.

## NOT verified here (needs your phone / first CI run)
- The three.js WebGL look of the 26 recipes (three is not installable offline). The code runs and the shaders compile; composition, lighting, speed need your eyes. Tell me which scene looks wrong and I will tune it.
- `npm run build` (Vite) and the APK: the workflows do this on GitHub.
- MP4 export speed with many Motion Pro scenes on a phone.

## Still not done (honest)
- Kotlin `MediaCodec/MediaMuxer`, `WorkManager`, `native-renderer`: export still uses WebCodecs + mp4-muxer in the WebView.
- Folder migration to `engine/ renderer/ audio/` (see docs/MIGRATION_MAP.md) and a separate `Timeline` screen/engine.
- Competitor (YouTube) research: no keyless public API.
