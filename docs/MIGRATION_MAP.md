# src/lib -> naya structure (move baaki)
| Abhi | Naya |
|---|---|
| lib/brain/script.ts, plan.ts | ai/prompt-parser, ai/scene-planner, ai/motion-planner |
| lib/motion/engine.ts (322 lines) | engine/scene-engine, shape-engine, typography-engine, infographic-engine, camera-engine, transition-engine, compositing-engine |
| (naya) 3D | engine/three-engine (Three.js, Phase 15) |
| lib/audio/analyze.ts | audio/ |
| lib/render/* | renderer/export-renderer, render-queue, memory-manager |
| lib/db.ts, assets/store.ts | storage/ |
| lib/assets/* | engine/compositing-engine + storage |
| screens/Studio.tsx | screens/AI-Video, Timeline, Preview, Export (split) |
| (naya) | timeline/{tracks,keyframes,easing,synchronization} |
| native/android/* | android/{app,native-renderer,media-codec,audio-engine,background-worker} |
Rule: ek folder move -> `npm run typecheck && npm test` -> next.

## Renderer update (v0.10.3)
| Retired / active | New path |
|---|---|
| `lib/motion/engine.ts` Canvas frame renderer (removed from Studio/export) | `lib/motion/htmlCompositor.ts` browser compositor |
| Canvas motion-family painter (removed) | `lib/motion/selector.ts` chooses IDs from the original HTML catalogue |
| Old procedural pro Canvas layer (removed) | `public/motion-pro/index.html` original HTML/CSS/JS generator |
| Motion theme tokens | `lib/motion/theme.ts` |
