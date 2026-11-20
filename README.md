# DIVRIZ AI (Phase 1-4 build)

Browser-only Research to Video system. No backend, no API keys. Data stays on your device.

## Install on phone (GitHub only)
1. Create a GitHub repo. In Settings > Pages, set Source = **GitHub Actions**.
2. Upload this project's files (or the ZIP) to the repo root on branch `main`.
   - If you upload `divriz-ai-phaseN.zip` to the root, `unzip.yml` extracts it and starts `build.yml` automatically.
   - First time only: `.github/workflows/*.yml` must be added by hand (Actions cannot modify workflow files).
3. Open Actions > build finishes > your site is at `https://<user>.github.io/<repo>/`.
4. Open it in Chrome on Android, tap **Lab**, run the tests.

## Local
`npm install && npm run dev` (Node 20+).

## Phases done
1 Repo inspection, 2 Feasibility PoC (Lab), 3 Mobile foundation, 4 Category + live research. See `docs/`.
