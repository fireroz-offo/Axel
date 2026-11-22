# DIVRIZ AI — original HTML motion rendering (v0.10.3)

## Rendering architecture

- `public/motion-pro/index.html` is the supplied Motion Pro HTML/CSS/JavaScript generator. Its original template families, generator functions, filters and 171,000 generated IDs remain bundled.
- The script planner chooses a stable `motionId` from the original catalogue for each scene. Scene text, scene duration, theme colors, title and subtitle are passed into the generator; the generated HTML stage is customized for that scene.
- The Studio preview and MP4 exporter now use `MotionProCompositor`. It loads the original generator in a same-origin hidden iframe, samples its CSS/Web Animations at the requested timestamp, snapshots the computed HTML layout through SVG `foreignObject`, and composites the resulting frame into the H.264 encoder.
- Scene transitions, captions, vignette and documentary letterboxing are composited after the HTML template frame. Audio remains encoded through WebCodecs and mp4-muxer.
- The previous Canvas motion-family layer and old Canvas scene renderer are no longer used by Studio preview or MP4 export. The old motion catalogue painter has been removed; the remaining `selector.ts` only selects IDs from the HTML catalogue.

## Important technical boundaries

- The 171,000 entries are generated variants from reusable source families, not 171,000 independent hand-authored HTML files. The original generator is used to produce each selected template.
- The HTML snapshot path relies on Chromium's SVG `foreignObject` support and browser-computed styles. It is intended for current Android Chrome / modern Chromium WebView. Some advanced CSS filters, fonts, blend modes or pseudo-element effects may rasterize differently across browsers.
- HTML-to-frame capture is substantially heavier than the former Canvas renderer. Export is intentionally frame-by-frame and may take longer on phones; 720p is the recommended mobile setting. Do not assume real-time export speed.
- AI currently selects a source template and edits its generated scene content, palette, timing and category using script-derived metadata. It does not write arbitrary executable JavaScript from an unconstrained language model; template editing is constrained to avoid unsafe script injection.
- Full build and device export validation must be run in the target Android/Chrome environment before production release.
