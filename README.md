# DIVRIZ AI v1.0.0

Browser-only Research to Video system. No backend, no API keys. Data stays on your device.

## Install on phone (GitHub only)
1. Create a GitHub repo. In Settings > Pages, set Source = **GitHub Actions**.
2. Upload this project's files (or the ZIP) to the repo root on branch `main`.
   - If you upload `divriz-ai-phaseN.zip` to the root, `unzip.yml` extracts it and starts `build.yml` automatically.
   - First time only: `.github/workflows/*.yml` must be added by hand (Actions cannot modify workflow files).
3. Open Actions > build finishes > your site is at `https://<user>.github.io/<repo>/`.
4. Open it in Chrome on Android, tap **Lab**, run the tests.

## Local
`npm install && npm run dev` (Node 20+). APK: Actions > Build Android APK > Run workflow, phir Releases se divriz-ai-debug.apk.

## What's new in v1.0.0 (see docs/V1_REPORT.md)
- **+12 advanced 3D recipes** (donut, rocket, shield, pipeline, market terrain, neural net, bank, gears, balance scale, clock, heart+ECG, crystal) and **+4 GPU-shader recipes** (galaxy, liquid orb, hologram globe, warp tunnel): 26 in total (16 new).
- **+8 pro 2D blocks** (donut, progress ring, gauge, process flow, funnel, versus, candlesticks, checklist).
- **Motion Pro library (171,000 templates)** from your MOTION_PRO file: the AI picks a template per scene and rewrites its text/numbers/years/colours from the script (docs/MOTION_PRO.md). Library tab can preview/edit/download any of them.
- Workflows: `build.yml` (web + tests), `apk.yml` (APK, every run gets its own release), `unzip.yml` (upload ZIP -> auto-extract -> auto-build).

## Phases done
1-10 done and extended through 17 (see docs/V1_REPORT.md for exactly what is verified and what is not). `npm test` runs all logic tests (Node 22+).
