# License and Dependency Report

## Runtime dependencies in this build (Phase 1-4)
| Package | Purpose | License |
|---|---|---|
| react, react-dom 18 | UI | MIT |
| mp4-muxer 5 | Write MP4 container from WebCodecs chunks | MIT |

## Dev dependencies
vite, @vitejs/plugin-react, typescript, @types/react(-dom): all MIT / Apache-2.0.

## Planned (added in the phase that uses them)
| Package | Phase | License |
|---|---|---|
| @mlc-ai/web-llm | 6, 8, 12 | Apache-2.0 |
| @huggingface/transformers (Whisper) | 10, 11 | Apache-2.0 (model weights: check each model card; whisper-* is MIT/Apache) |
| gsap | 14 | GSAP "Standard License": free for use incl. commercial, but not for building a competing visual animation builder. Review before shipping |
| three | 15 | MIT |
| @ffmpeg/ffmpeg + @ffmpeg/core | 17 (fallback) | MIT wrapper, FFmpeg core LGPL/GPL by build. H.264 encoder (x264) is GPL, so prefer WebCodecs; review before distribution |
| react-three-rapier | 15 (optional) | MIT |

## External public services (called from the browser, no key)
GDELT DOC API, Hacker News Algolia API, Wikipedia API, Wikimedia pageviews, HuggingFace / MLC model CDNs (later).
These are third-party services: terms, rate limits and availability can change.

## Not used
lemo-opuscar docs/films/fonts/music (CC BY-NC / third-party), Blender (GPL), Python repos.
