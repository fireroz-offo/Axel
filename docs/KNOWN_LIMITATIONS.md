# v0.10.0
Three.js 3D engine + 10 recipes: docs/PHASE_15_THREE_REPORT.md (WebGL abhi phone par untested).

# v0.6.0
Phase 6 + Library + size fixes ke limitations: docs/PHASE_6_REPORT.md (section 4 aur 5).

# Known Limitations

Phase 5-17 ka naya hissa (Studio): docs/PHASE_5_TO_17_REPORT.md dekhein. Competitor Research hata diya gaya hai.

# Known Limitations (this build: Phase 1-4)
- Not built/typechecked in the authoring sandbox (no npm registry access). First GitHub Actions run is the first real build; check the Actions log.
- Topic AI aur AI script abhi implement nahi hue. Voiceover analysis, storyboard, 2D/3D motion, sync aur MP4 render Studio tab mein hain (test status: PHASE_5_TO_17_REPORT.md).
- Research sources are keyless public APIs only; GDELT may rate-limit.
- Wikipedia trending is global, not filtered by category.
- Only the Lab render test produces an MP4; it is a test animation, not a user video.
- coi-sw.js service worker needs HTTPS (GitHub Pages is fine) and one reload on first visit.
- Android APK: normal download links do not work in the WebView; MP4 export uses the Share sheet (src/lib/saveFile.ts).
- Cross-origin isolation (SharedArrayBuffer) shows a warning on the device; not needed while WebCodecs works. Only matters if the FFmpeg.wasm fallback is used.
- Language: research defaults to Hindi (Google News RSS hi, GDELT sourcelang:hindi, Hindi Wikipedia). Google News RSS needs the APK's native HTTP (CORS); in a plain browser tab it shows "failed".
- Hindi quality of small in-browser LLMs (Phase 6+) is lower than large cloud models; scripts will need user editing.
- Hindi news is world-oriented: Google News (Hindi) is steered with world keywords, GDELT uses sourcelang:hindi (global), BBC News Hindi feed is general (not category-filtered). English-only global stories are not translated yet (planned with the in-browser LLM).
- "Apni Script" screen (Phase 4 addition) only stores the script and estimates duration. Voiceover analysis, storyboard and render for it come in Phases 10-17.
- Translating non-Hindi world news into Hindi is planned for Phase 6 (in-browser model; quality moderate). Not implemented yet.
