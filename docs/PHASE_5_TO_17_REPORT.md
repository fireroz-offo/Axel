# Naya build (v0.5.0): Studio = Script + Voiceover -> Motion Graphics -> 720p MP4

## Kya badla
- Competitor Research hata diya gaya (user ke kehne par). Research tab ab sirf live news/trends ke liye hai.
- Naya **Studio** tab: Script + audio upload -> audio analysis -> script/audio alignment -> auto scene plan -> 2D/3D motion graphics preview -> MP4.
- Max resolution 720p (1280x720, 720x1280, 720x720), 24/30 fps, H.264 + AAC (AAC na mile to Opus fallback).

## Modules (src/lib)
| Module | Kaam |
|---|---|
| brain/script.ts | Hindi/English vaakya split, numbers/%/years/quotes/steps/compare/growth pehchanna (rule-based) |
| brain/plan.ts | Motion Design Brain: har scene ke liye block chunta hai (13 blocks), repeat se bachta hai, deterministic; LLM plan ke liye prompt + strict validation |
| brain/llm.ts | OPTIONAL in-browser LLM (web-llm, WebGPU). Off by default. Bekaar jawab aaye to rule plan chalta hai |
| audio/analyze.ts | RMS envelope, silence detection, script->audio alignment (voiced-time weights + silence snapping), mismatch report |
| motion/engine.ts | Canvas engine: frame = f(time). 11 2D blocks + 2 software-3D blocks (3D bars, 3D globe), transitions (fade/slide/zoom/wipe), camera zoom/pan, word-level captions, 2 themes (Explanation, Documentary) |
| render/renderVideo.ts | WebCodecs H.264 + AAC/Opus -> mp4-muxer, backpressure, cancel, progress |

## Repos se kya liya (sach)
Koi code copy nahi kiya; sirf tareeke/ideas apne code mein likhe.
- **givemotion (MIT):** "same input -> same video" seek-based rendering idea (frame = function of time), aur block catalog (bar-chart, stat, steps, compare, quote, word-pop, callout, timeline). Uska renderer headless Chrome + FFmpeg (desktop) par chalta hai, isliye phone par seedha nahi use ho sakta.
- **lemo-opuscar (code MIT; kuch art/data assets alag license):** directing rules (pehle 3 second mein hook, ending echo, ek consistent style, Explanation aur Documentary ka alag look). Uski 99 styles Claude Code agent ke liye hain, app mein nahi chalti.
- **web-llm (Apache-2.0):** optional in-browser AI plan.
- **react-three-rapier, blender, diffusers, langgraph, an:** is build mein use nahi hue (React-Three/Python/desktop/backend wale). 3D ke liye abhi Three.js ki jagah chhota software projection use hua (kisi bhi phone par chalta hai). Three.js baad ka upgrade hai.

## Jo test hua (is sandbox mein, asli headless Chromium)
- Unit: vaakya split, alignment (synthetic audio par boundary error 0.01 s), contiguous scenes (no gaps), deterministic plan, LLM-JSON validation, har block x 2 theme x 3 aspect ratio par NaN/crash test (0 bad).
- Visual: contact sheets tests/evidence/*.png (16:9, documentary, 9:16) dekhe gaye.
- End-to-end browser: WAV decode -> analysis -> align -> plan -> 720 frames render -> H.264 encode (12 keyframes, timestamps 0..23.97 s) -> audio encode (Opus, 1201 chunks, 0..24 s). 24 s ka 720p video desktop software-Chromium par ~11 s mein bana.

## Jo TEST NAHI hua (ईमानदारी से)
1. **Final MP4 mux (mp4-muxer) aur playback:** sandbox mein npm offline hai, isliye muxer ki jagah stand-in lagaya. Asli mux pehle GitHub Actions build + phone par check hoga.
2. **AAC:** is Chromium mein AAC encoder nahi tha, to AAC path nahi chala; Opus path chala. Android Chrome par AAC aam taur par hota hai par verify karna hai.
3. **Poora `vite build` aur Studio.tsx UI:** React/Vite install nahi ho sake; Studio ka typecheck shim ke saath hua. Asli build Actions mein hoga.
4. **Android phone par speed/RAM:** koi phone test nahi hua. 10 min audio decode (mono 48 kHz float) ~115 MB RAM leta hai.
5. **web-llm AI plan:** WebGPU sandbox mein nahi, to llm.ts kabhi chala nahi.

## Known limitations
- Alignment timing-based hai, speech recognition nahi: chhoota/extra shabd nahi pakadta (Whisper baad ke phase mein).
- Scene planner script ke numbers/years/words dekhta hai; abstract baaton ke liye generic callout aata hai. Synthetic growth curve par "उदाहरण (illustration)" likha aata hai (koi nakli data nahi).
- Bars sirf ek hi unit ke numbers se bante hain (rupaye ke saath % mix nahi hota).
- Audio abhi memory mein rehti hai, project reload par dobara upload karni padegi.
- Phase 6-9 (topic recommendations, AI script) aur Phase 13 (HTML/CSS/JS asset library, sandbox) abhi baaki hain.
