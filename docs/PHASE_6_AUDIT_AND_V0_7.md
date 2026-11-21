# Phase 6 Audit + v0.7.0

## A. Phase 6 verdict: logic theek, lekin "poora Phase 1-6" nahi
| Cheez | Status | Saboot |
|---|---|---|
| Topic clustering, ranking, approval gate, jhooth nahi | OK | `tests/unit-topics.ts` -> 6 topics / 10 real items, TOPICS OK (maine dobara chalaya) |
| Topic quality | Kamzor | Title = ek news headline (test mein "Show HN: A tiny SIP calculator" #2 par). AI-likhe video topic nahi hain |
| Video type suggestion | Heuristic | test mein 6 mein se 5 "explanation"; sirf keyword/years se |
| Competitor Research (Phase 5) | Hata diya | aapke kehne par; YouTube keyless possible nahi |
| Phase 7 Explanation/Documentary screen | Baaki | STAGES mein `done:false` |
| Phase 8 AI script | Pehle nahi tha | ab `src/ai/script-engine` (neeche), UI abhi judi nahi |
| Phase 10-11 speech recognition | Nahi | alignment timing-based hai, chhoota/extra shabd nahi pakadta |
| `vite build` / React screens | Kabhi nahi chala | pichhle build mein bhi nahi, mere sandbox mein bhi nahi (npm offline). Pehla GitHub Actions run hi asli test hai |
| Order | Ulta | Phase 13-17 (Studio) pehle bane, 7-9 baad mein |

Topics.tsx / Assets.tsx UI maine run nahi kiya, sirf logic modules test kiye.

## B. "Script padhne mein time" - asli bug mila
`alignScript` har shabd par saari silences 40 baar scan karta tha (O(n^2)).
Naya `VoicedMap` (prefix sums + binary search):
| Script | Pehle | Ab |
|---|---|---|
| 400 vaakya | 59 ms | 16 ms |
| 4,000 vaakya | 4,027 ms | 84 ms |
| 16,000 vaakya | 33,763 ms | 254 ms |
(desktop Node; phone 5-10x slow hota hai - phone par naapa nahi)
Purane se compare: 6,396 timings, 0 unexplained difference. Fark sirf pause ki sarhad par hai, aur ab sahi taraf: shabd pause ke baad shuru, pause se pehle khatam.
Saath mein: align ab Web Worker mein (UI freeze nahi), analysis 16 kHz par (10 min: 38 MB, pehle 115 MB), 48 kHz sirf render ke waqt decode aur turant free.
Dhyan: normal 10 min script (~100 vaakya) pehle bhi tez thi. Agar phone par abhi bhi dheema ho to batao kaun si screen / kitni badi script - tab asli profiling chahiye.

## C. GB wali problem -> 100 MB limit
- ZIP khud 4.5 MB tha (4.4 MB screenshots; ab JPEG, ~0.1 MB). GB runtime par banta tha.
- `@mlc-ai/web-llm` poora hata diya (model cache 0.4-2 GB). "Purane AI model cache hatao" button purana cache saaf karta hai.
- `storage/budget.ts`: app data (OPFS renders/audio/assets) cap 50 ya 100 MB, sabse purani MP4 pehle hatti hai. Test: PASS.
- MP4 size-cap options ab sirf 50 / 100 MB.
- Limitation: IndexedDB mein rakhe HTML assets abhi cap mein gine nahi jaate (sirf OPFS files).

## D. AI advanced, bina key/backend (`src/ai`, `src/schemas`)
- `ai/net/keyless.ts`: internet par keyless endpoint (Pollinations), timeout + retry, fail hone par `null`.
- `ai/director`: scenes ka block plan, 25 lines ke chunk (chhoti requests), Zod validation, fail chunk par rule-based.
- `ai/script-engine`: outline -> har section ki alag chhoti AI call -> validation. Facts = topic ke real sources + Wikipedia. Guard: facts mein na mile hue numbers flag, galat bhasha par sirf-sources wala fallback. AI band ho to bhi script banti hai.
- Tests (`tests/unit-ai-storage.ts`): 14/14 PASS, lekin **mock network** par. Asli endpoint maine nahi chalaya (sandbox mein internet nahi). Phone par Settings -> "AI test chalao" se pata chalega. Keyless public endpoint kabhi bhi band/rate-limit ho sakta hai - isiliye fallback hai.
- Ye "advanced" ek bade model jitna nahi hoga; Hindi quality bhi variable.

## E. Nayi structure (aapka diya hua)
Abhi sirf naye folders (`src/ai, schemas, storage, workers`) us structure mein bane. Purani `src/lib/*` ka move: docs/MIGRATION_MAP.md. Pehle build chalne ka saboot, phir move (bina build ke 40 imports todna risky hai).
Android native (Kotlin MediaCodec/MediaMuxer/WorkManager), Three.js, Timeline engine: abhi shuru nahi hue.

# v0.8.0 - Phase 7-9 (Video type + AI Script + Editor + Approval)
- `screens/ScriptWriter.tsx` (Script tab, approved topic ke baad): type (Explanation/Documentary), length (Short 30-50 s / Long 5-10 min), bhasha (Hindi/English).
- "Research + Script banao": Wikipedia (keyless) + topic ke sources se facts -> section-by-section script (progress, Roko button).
- Har hissa editable; "Ye hissa dobara likho"; warnings (facts mein na mile numbers, AI nahi mila); Copy, Download .txt; Approve / Approval hatao.
- Approve par hi `scriptApproved` + stage `voice`; Studio chetavani deta hai agar AI script approve nahi hui.
- Test: script-engine logic tests pass (mock network). Screen ka typecheck React shim ke saath clean; screen maine browser mein chalayi nahi.

# v0.9.0 - Whisper transcription + Pro motion graphics
## Whisper (Phase 10-11)
- `ai/speech/whisper.worker.ts` + `transcribe.ts`: transformers.js, Whisper tiny (~40 MB) ya base (~80 MB), q8, Worker mein. Model internet se ek baar aata hai, phir cache; Settings mein delete.
- `ai/speech/scriptAlign.ts` (asli kaam): Whisper ke word timestamps ko script ke shabdon se fuzzy-match karta hai (Hindi spelling farak chalta hai), chhoota / extra shabd pakadta hai, mismatch report deta hai, scenes pause ke beech mein katte hain. Recognition bekaar (<35% match) ho to `null` -> purana timing-based alignment.
- Test: `tests/unit-asr-align.ts` 9/9 PASS (synthetic ASR par): perfect speech, spelling variants, 3 missing + 1 extra word, junk, 9000 words ~6 s.
- **NAHI TEST HUA:** asli Whisper model ka download/chalna (sandbox mein internet/npm nahi). Model ids `onnx-community/whisper-tiny|base` aur `@huggingface/transformers ^3` ka API phone par pehli baar check hoga. Hindi mein tiny kamzor hai; base behtar. Fail hone par app timing-based par chalta hai.
## Pro motion graphics (`lib/motion/pro.ts`)
Reference videos (AutoAE) dekhkar: layered depth, glass labels, glow card + drawn line + arrows, ribbon, rack focus, spring motion.
- `hero` (title/hook + subject + ribbon + blurred far layer), `orbit` (glass labels jo bole gaye shabd par pop hote hain, glowing path, rack focus), `chartcard` (glow card, line khud banti hai, arrows). Purana `line` ab chartcard hai. Title scene bhi hero hai.
- Procedural subjects (koi image download nahi): robot, temple, coins, person, skyline, chip. Sentence se chunta hai, category se backup; do scene mein same nahi.
- Plain sentence ab "callout" nahi banta; layered scene banta hai.
- Pre-roll: naya scene cross-fade ke dauran hi animate hona shuru (khaali frame nahi). Blur: offscreen downscale (ctx.filter se ~8x tez: 320 -> 40 ms/frame software Chromium mein).
- Trend direction: aakhri cue jeetta hai ("तेज़ी से गिरा" = down).
- Test: `tests/unit-pro-plan.ts` 8/8 PASS; frames asli Chromium mein render karke dekhe: `tests/evidence/pro_*.jpg` (script: tests/visual/).
- Reference jaisa **photo-real** (stone statues) nahi hai: wo cut-out PNG images hain. Apni PNG library mein daaloge to asset system use karega; 3D (Three.js) agla phase.
- Phone par speed naapi nahi (40-70 ms/frame desktop software rendering).
- Purana `tests/unit-brain-audio-motion.mjs` ZIP mein `tests/lib.mjs` ke bina tha, isliye chal nahi sakta; `npm test` ab naye 4 tests chalata hai.
