# Test Report (Phase 1-4)
| Item | Result |
|---|---|
| Repo inspection (8 ZIPs) | Done by reading files |
| YAML validity of build.yml, unzip.yml | Parsed OK with a YAML parser |
| `npm install`, `vite build`, `tsc` | NOT RUN (sandbox has no network) |
| Live research APIs | NOT RUN here; run Lab on device |
| WebCodecs MP4 PoC | NOT RUN here; run Lab on device |
Please paste the first GitHub Actions log / Lab results back so Phase 5 can fix real issues.


## v1.0.0 additions
See docs/V1_REPORT.md. Commands: `npm test` (all logic + mock-three), `python3 tests/visual/glsl_check.py shaders.json` (GLSL compile in WebGL2).
