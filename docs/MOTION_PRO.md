# Motion Pro library (171,000 templates) inside DIVRIZ AI

Source: your `MOTION_PRO_171K_CHATGPT3.html`. Its generator (60 KB JS) and template CSS (61 KB) are ported 1:1 to `src/lib/motionpro/` (`gen.ts`, `motionpro.css`); only the file's own UI code was dropped.

## How the AI uses it
1. **Pick** (`auto.ts`): each scene's native block maps to template groups (stat -> Stat, steps -> Steps/Bullets, timeline -> Timeline, quote -> Quote/Paper card, hero/words -> typography, orbit/network -> network, 3D scenes -> depth/fluid/reveal ...). Choice is deterministic per project (seed) and never repeats a template within 6 scenes.
2. **Edit** (`copyFor`): every visible text is replaced from the script: headline lines, eyebrow (category), sub line, steps, quote, stat (label + number + unit), timeline years, labels, kinetic words, brand. Colours = the app theme (or the template's own, Studio option).
3. **Render**: the edited template becomes a normal asset (`mpDef`) and runs in the same sandbox as your own HTML assets (iframe `sandbox="allow-scripts"`, CSP blocks network). Frames are `f(time)`: CSS animations are seeked, then captured (computed styles baked, `::before/::after` and CSS counters re-created, SVG foreignObject -> bitmap).
4. **User control** (Studio scene card): `AI: Motion Pro template` (new pick), template number box (1-171000), headline box; the dropdown can switch back to the native block (`orig` is kept).
5. **Library tab**: browse by number or type, change colours/text, preview, download the HTML.

## Honesty rules (enforced in code)
- Only templates whose text is fully replaceable are auto-picked (automated scan, 67 allow-listed types). Templates that print random chart numbers, fixed years (Time Travel), SaaS demo copy, terminal commands, or "FILTER PACK" labels are never auto-picked.
- The random "+x%" growth pill of the Stat template is hidden; the original "Fireroz Media" slate and `TYPE / 001` tag are hidden.
- Data scenes (bars, donut, line, coins ...) keep the app's own charts, which use only numbers found in the script.

## Limits
- Capture cost is ~110-160 ms/frame on a desktop (headless Chromium); phones are slower, so MP4 export of Motion Pro scenes takes longer (a 60 s, 30 fps video with many such scenes can take several minutes).
- Templates shorter than ~2.4 s scenes are skipped (their entrance needs ~2 s).
- Pseudo-element support covers `::before/::after` (content text, counters); CSS features that SVG-foreignObject rendering cannot reproduce may differ slightly from the live browser view.
