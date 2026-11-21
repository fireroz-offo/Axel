# DIVRIZ AI v0.7.0 (Phase 1-6 + Studio)

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

## Phases done
1-6 done (see docs/PHASE_6_AUDIT_AND_V0_7.md). `npm test` runs the logic tests (Node 22+).
