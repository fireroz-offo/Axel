# Repository Inspection Report (Phase 1)

Inspected: 8 uploaded ZIPs (blueprint said 7; an 8th, `an-main`, was also included).
Method: unzip, read README / package.json / LICENSE / source layout. Nothing was executed (no network in the build sandbox).

| Repo | What it is | License | Usable in a browser-only, no-key app? | Decision |
|---|---|---|---|---|
| **web-llm** (`@mlc-ai/web-llm` 0.2.89) | In-browser LLM engine on WebGPU; ships a prebuilt model list (Llama-3.2-1B/3B, Qwen2.5/3, Phi-3.5, SmolLM2, Gemma-2-2b ...), OpenAI-style API, Web Worker engine | Apache-2.0 | **Yes**, needs WebGPU; models download from public CDN, cached locally | **Use as the AI brain** (Phase 6/8/12). Use via npm, not by copying source |
| **givemotion** (0.1.7, zero deps) | Seek-based HTML video engine: a page becomes a deterministic timeline `f(t)`; block library (bar-chart, line-chart, stat, captions, word-pop, title-card ...) | MIT | **Concept + HTML blocks: yes.** Its renderer is Node + headless Chrome + ffmpeg, so **not** runnable on a phone | **Adopt the design pattern** (scene = pure function of time, block parameters like `{{values}}`) and adapt blocks into the Phase 13/14 library. Renderer itself replaced by WebCodecs |
| **lemo-opuscar** (2.0.0) | 99 film-style recipes for coding agents, `three` + `playwright-core` | Mixed: code MIT, docs/prompts CC BY-NC 4.0, demo films CC BY 4.0, third-party assets (fonts, music, maps) keep own licences, Clawd character excluded | Partly. Styles are agent prompts, not a runtime | **Reference only** for visual-direction ideas (Phase 10 Motion Design Brain). Do not bundle NC docs, films, fonts, music or Clawd |
| **react-three-rapier** (monorepo) | Rapier physics for react-three-fiber | MIT | Yes (React + Three) | **Optional**, Phase 15 only if physics scenes (falling coins etc.) are needed. Adds weight, so deferred |
| **langgraph** | Python agent-graph framework | MIT | **No** (Python, server side) | **Not used.** Pattern only: our research to script pipeline is a small TypeScript state machine |
| **diffusers** | Python image/video diffusion models | Apache-2.0 | **No** (PyTorch, GPU server) | **Not used** (cannot run on a phone browser without a backend) |
| **blender** | Full 3D DCC (C/C++/Python) | GPL-3.0-or-later | **No** | **Not used.** GPL would also taint bundled code. Three.js covers browser 3D |
| **an** | Python animation orchestrator (Manim / Remotion executors) | MIT | **No** (Python, ElevenLabs TTS option) | **Not used**; its "director / orchestrator / executor" scene-plan idea informs Phase 12 storyboard schema |

## Conclusion
No uploaded repository is a ready-made app for this blueprint. The usable parts are:
1. `web-llm` as an npm dependency (AI brain),
2. givemotion's seekable-timeline architecture and HTML blocks (MIT),
3. react-three-rapier optionally for 3D physics.
Everything else is server-side or reference material.
