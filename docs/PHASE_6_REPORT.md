# v0.6.0 — Phase 6 (Topic Recommendations + Approval) + HTML Library + GB fixes

## 1. GB wali problem: asli kaaran aur fix
| Kaaran (code mein mila) | Fix |
|---|---|
| AI plan model `Qwen3-1.7B` ~2 GB GPU/RAM (web-llm config: 2036 MB) aur cache mein bhi 1-2 GB padta tha | Default **Off**. 3 tiers: SmolLM2-360M (376 MB), Qwen2.5-0.5B (945 MB), Qwen3-1.7B (2037 MB). Use ke turant baad `engine.unload()`. Settings mein model cache delete button. |
| MP4 poori RAM mein (`ArrayBufferTarget`, fastStart in-memory) | MP4 seedha **OPFS file mein stream** hoti hai (`FileSystemWritableFileStreamTarget`). RAM flat. Fallback: purana in-memory. |
| Share karte waqt poori file ka ek base64 string (RAM x2-3) | `shareFile` ab 768 KB chunks mein `writeFile` + `appendFile` karta hai. |
| Bitrate sirf resolution se, file-size ki koi limit nahi | `budget.ts`: bitrate = min(quality, size-cap). Cap 50/100/200/400 MB. 10 min ≤100 MB, 1 ghanta ≤200 MB (tested numbers below). |
| Purane renders OPFS mein jama hote the | Har naye render se pehle purane delete; Settings mein "saaf karo". |

Test (Chromium): 10 min, balanced, cap 100 MB -> 1.10 Mbps, andaza 90 MB. 10 min high, cap 200 MB -> 180 MB. 1 ghanta high, cap 200 MB -> 304 kbps, 180 MB.

## 2. Phase 6: Topics + Approval (`lib/topics.ts`, `screens/Topics.tsx`)
- Research ke asli items ko keyword-cluster karke 5-10 topics. Har topic mein: title, summary, kyun zaroori, taazgi, audience interest (sirf asli HN points / Wikipedia views), news coverage (kitne sources), content-gap note, suggested type (Explanation/Documentary), sources + dates.
- Jhooth nahi: 5 se kam mile to 5 tak nahi bharta; Wikipedia global trending (category-filtered nahi) hata deta hai jab tak user ne na chuna ho. YouTube competitor data keyless possible nahi — UI mein saaf likha hai.
- Approval gate: Approve ke bina "approved" nahi banta; naya angle (title edit), approval hatana, topics dobara banana, research par wapas jana.
- Test: `tests/unit-topics.ts` (clusters, ranking, noise drop, history->documentary, picked topic first, empty research -> 0 topics). PASS.

## 3. HTML/CSS/JS/ZIP/Lottie Library (`lib/assets/*`, `screens/Assets.tsx`) — Phase 13
- Upload: .html, ZIP (HTML+CSS+JS+images), Lottie .json. ZIP native `DecompressionStream` se khulti hai (zip-bomb limits). Sab kuch ek self-contained HTML mein inline; network links hata kar warning.
- Auto inspection: libraries (gsap/lottie/three/pixi), seek hook, duration, tags, category, warnings.
- **Sandbox**: `iframe sandbox="allow-scripts"` (same-origin nahi) + CSP `default-src 'none'`. Test mein asset ne `parent.document`, `localStorage`, `fetch` try kiya: teeno blocked.
- Deterministic frames: `seek(t)` -> computed styles bake -> SVG foreignObject -> ImageBitmap. Seek order: `window.divrizSeek(t, vars)` > GSAP global timeline > Lottie > CSS/WAAPI animations. Placeholders `{{text}} {{keyword}} {{number}}`, CSS vars `--divriz-acc/ink/bg`.
- Matching (`match.ts`): scene ke text/tags/block-affinity/category se score; threshold ke upar to library asset, warna **AI ka apna naya graphic**. Studio mein har scene ke dropdown mein "🧩 asset" ya koi bhi AI block chun sakte hain (apni marzi).
- Test (Chromium, `tests/asset-runtime-test.ts`): ZIP -> bundle -> inspect -> frame t=0 aur t=1 par box ki jagah badli (deterministic), Hindi text placeholder, matcher ne sirf fit wale scene ko asset diya. `tests/e2e-assets.ts`: 6 s ka render, 144 frames, library asset scene ke saath, 0 failures, OPFS streaming sink use hua.

## 4. Jo TEST NAHI hua (ईमानदारी से)
1. **Asli `mp4-muxer` + `FileSystemWritableFileStreamTarget`**: sandbox mein npm offline, stand-in muxer se pipeline chala (frames/chunks sahi). Asli MP4 ka playback pehle GitHub Actions build + phone par check karein. Agar `fastStart:false` ke saath target koi error de to `output.ts` ka fallback (memory) chalega.
2. **GSAP / Lottie injection** (`gsap`, `lottie-web` ab package.json mein): `?raw` import offline verify nahi hua. Na mile to asset bina library ke chalta hai (warning). CSS-animation aur `divrizSeek` wale assets tested hain.
3. React UI (Topics/Assets/Studio) ka `vite build` aur phone par chalna; typecheck sirf shim ke saath (logic errors 0).
4. AAC encoder, phone speed/RAM, web-llm tiers (WebGPU sandbox mein nahi).

## 5. Jo aapne maanga par is build mein NAHI hai (abhi)
- **Three.js (advanced 3D), WebGPU renderer, native MediaCodec, FFmpeg export**: ye alag-alag bade kaam hain aur inka sandbox mein test sambhav nahi (npm offline, GPU nahi). 3D abhi software projection se hai. Plan: Phase 15 mein Three.js WebGLRenderer (ek shared offscreen context, frame=f(t)), WebGPU sirf feature-detect + WebGL fallback; MediaCodec ke liye native plugin (Android) tabhi jab WebCodecs phone par fail ho.
- Library assets ka WebGL/canvas content foreignObject mein nahi aata jab tak asset `divrizSeek` mein canvas ko DOM mein na rakhe (canvas -> PNG copy hota hai, WebGL canvas khaali aa sakta hai).
- Pseudo-elements (::before/::after) capture nahi hote.
- Asset mein infinite loop tab freeze kar sakta hai (6 s capture timeout use rokta nahi).
