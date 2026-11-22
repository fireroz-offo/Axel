# v0.11.0 — AI template curator (best-of-N per scene)

Studio → "Audio analyze + scenes banao" now runs a **curation pass** after the scene plan:

1. **Candidates**: for every scene, 10 different templates (20 for stat/bar/list scenes) from the 171K catalogue, stratified across
   ranges and weighted to the scene's topic family (`selector.ts: candidateMotions`). Demo-UI ranges (SaaS/Claude Motion) only for software scripts.
2. **Real render test** (`MotionProRuntime.inspect`, ~5 ms each): each candidate is built with THIS scene's headline, numbers and duration and measured:
   title slot present/overflowing, text overlap, text outside frame, English/Devanagari placeholder text, fake demo numbers and ₹/$ amounts,
   number/bar/list slots for data scenes, entrance animation length vs scene length, richness.
3. **Pixel check** (`inspectPixels`) on the top 3: rejects templates that are mostly an empty gradient on screen.
4. **Audio-aware**: speech pace (words/sec) and loudness of the scene's audio → fast voice prefers quick, energetic entrances; slow voice calmer ones.
   Each stage is built with `duration = scene length`, so camera/exit animations span exactly the voice-over.
5. **Diversity**: no template is reused; same style is not repeated back-to-back.
6. **Edit**: `smartHeadline` writes a short, clean Hindi/English headline from the sentence (number window for data lines); captions on → template subtitle off (no duplicate text).
   Template tech labels ("X / 000") and the "Fireroz Media" watermark are hidden in rendered video (`#divriz-clean` style in `motion-pro/index.html`, runtime mode only).
7. Storyboard cards show the AI score + reasons and **◀ Pichla / Agla best template ▶** to swap to the next-ranked candidate (re-rendered instantly).

Also in this release: stage cache keyed by motionId (swapping a template can never show a stale stage).
Tests: `npm test` (adds tests/unit-curator.ts). Verified in Chromium 157 (9:16 and 16:9).
