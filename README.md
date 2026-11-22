# DIVRIZ After Motion V0.3 — HTML → MP4

Android-ready React + Vite + Capacitor app. **HTML code do → on-device MP4 video banao**, aur video ko apne hisab se edit karo.

## Kya kar sakte ho
- **HTML paste / import**: code tab me paste karo, ya `.html` / `.zip` (index.html + css/js/images/fonts) import karo. Zip ke assets automatically inline ho jaate hain.
- **Live canvas**: project ke exact size (720p / 1080p / 9:16 / 1:1 / 4:5 / custom) me preview.
- **Real MP4 export (H.264)**: har frame ko deterministic time pe render karke phone ke hardware encoder se encode hota hai. Share sheet se Gallery / Drive / WhatsApp me bhejo.
- **Deterministic timeline**: CSS animations, transitions, Web Animations, JS `requestAnimationFrame` / `setTimeout` / `setInterval` aur GSAP — sab ek virtual clock se chalte hain, isliye scrub / play / export frame-accurate hai.
- **Keyframe editor**: layer chuno → X, Y, Scale, Rotate, Opacity + easing (Linear, Smooth, Ease In/Out, Bounce) → "Set keyframe". Presets: Fade In/Out, Slide Up, Zoom In, Pop, Spin In. Keyframes HTML ke andar JSON me save hote hain (`#divriz-project`).
- **Layer editing**: text, text color, background, font size, opacity.
- **Auto duration**: animations ki length se duration detect.
- Undo / Redo (drag ko ek step maana jaata hai), Save, Monaco editor (offline bundle) + Simple editor (phone ke liye).

## Limitations (honest list)
- Frame capture browser ke SVG `foreignObject` se hota hai: **external fonts / remote CSS background-images / `<video>` / `<iframe>` / WebGL** frame me nahi aate. Fonts aur images ko `data:` URI me embed karo (zip import ye khud kar deta hai).
- `::before/::after` pseudo-elements ki animation video me frozen (base state) dikhti hai.
- Audio abhi nahi hai (video-only MP4).
- Export app khula rakhkar hota hai (screen on). 1080p60 lambe videos phone par slow ho sakte hain — pehle 720p/30fps try karo.
- Imported HTML untrusted hai: preview `sandbox="allow-scripts"` (no same-origin) me chalta hai, native bridge expose nahi hai.

## Build
```bash
npm install
npm run dev          # browser me
npm run build        # production web build
npm run typecheck    # optional type check
```
Android:
```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android   # Android Studio -> Build APK
```
Requirements: Node 20+, JDK 21, Android Studio / SDK.

## GitHub Actions (zip se APK tak)
`.github/workflows/` me teen files hain (ye files ek baar repo me manually add karo):
| File | Kaam |
|---|---|
| `unzip.yml` | Repo root me zip upload karo → khud unzip + commit + APK build trigger |
| `build.yml` | Web build + typecheck |
| `apk.yml` | Debug APK build → Actions → Artifacts me `DIVRIZ-After-Motion-apk` |

## Runtime ka design (developers ke liye)
`src/runtime.js` preview iframe me inject hota hai (project file me save nahi hota). Ye `performance.now`, `Date.now`, rAF, timers ko virtual clock se replace karta hai, `document.getAnimations()` ko pause karke `currentTime` set karta hai, editor keyframes ko `Element.animate()` me convert karta hai, aur `frame` message pe DOM ko self-contained SVG string me serialize karta hai. `src/exporter.ts` us SVG ko canvas pe draw karke `VideoEncoder` + `mp4-muxer` se MP4 banata hai. (Note: SVG ko `data:` URL se load karna zaroori hai — `blob:` URL canvas ko taint kar deta hai.)

## Roadmap
- Audio track (WebCodecs AudioEncoder), multi-scene timeline, transitions, templates, WebM fallback, pseudo-element animation support.
