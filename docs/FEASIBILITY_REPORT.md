# Technical Feasibility Report (Phase 2) - status: partially verified

Legend: VERIFIED = a test exists in the in-app **Lab** screen and must be run on your phone; the sandbox that built this ZIP had no internet or browser, so nothing below was executed by me.

| Blueprint question | Verdict | Basis |
|---|---|---|
| 1. Live research without backend/key | **Likely yes, limited** | GDELT, Hacker News, Wikipedia, Wikimedia expose CORS. Lab tests each. Limits: GDELT rate-limits (about 1 req/5 s); no Google News / most RSS (no CORS) |
| 2. Competitor (YouTube) research | **Not possible directly** | youtube.com sends no CORS headers. Options to test in Phase 5: public Invidious/Piped instances (unreliable, may violate ToS), user pasting channel/video URLs and transcripts, YouTube oEmbed (title/author only, CORS-enabled, no stats). Must be reported as partial, never as full analysis |
| 3. Advanced script generation | **Possible but small-model quality** | WebLLM runs 1-4B models on WebGPU. Needs WebGPU phone (recent Chrome on Android with enough RAM, roughly 6 GB+). Long scripts need chunked generation. Quality below large cloud models |
| 4. Voiceover transcription + alignment | **Likely yes** | Whisper tiny/base via Transformers.js (ONNX, WASM or WebGPU) gives word timestamps. Hindi accuracy on tiny/base is mediocre; small is better but heavy. Forced alignment against the script is done by our own text matcher |
| 5. Browser 2D/3D motion graphics | **Yes** | Canvas/SVG/GSAP/Three.js are standard. Mobile quality adaptation needed |
| 6. Real MP4 on a phone | **Likely yes** | WebCodecs H.264 + mp4-muxer implemented as a real PoC (Lab, "Render test MP4"). Fallback FFmpeg.wasm for devices without AAC/H.264 encoders. 1080p60 on low-end phones is not guaranteed |

## Hard limits (be aware)
- "No key, no backend" means no GPT/Claude-class reasoning and no stats-rich YouTube analytics.
- Model downloads (hundreds of MB to GB) happen on first use; needs Wi-Fi and storage.
- iOS Safari support for WebGPU/WebCodecs is partial; target is Android Chrome.
