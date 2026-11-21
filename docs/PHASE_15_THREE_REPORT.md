# v0.10.0 - Three.js 3D engine (Phase 15 start)

## Kya naya hai (`src/engine/three-engine/`)
| File | Kaam |
|---|---|
| `layout.ts` | Pure maths (no Three.js): bar/coin/city/helix/globe-arc/network/road layouts, easing, seeded rng. Node mein test hota hai |
| `quality.ts` | 3 tiers (high/medium/low), device se tier chunna, FPS governor, export tier (sirf RAM se) |
| `stage.ts` | Ek shared WebGL renderer, scene cache (max 3, dispose), bloom + ACES tone mapping + environment reflections, context-loss handling |
| `recipes.ts` | 10 recipes (neeche) |
| `index.ts` | 2D engine se bridge: WebGL frame -> canvas, 3D points se projected glass labels (Hindi text 2D mein, crisp), documentary film grain, WebGL fail ho to 2D fallback |

## 10 recipes
| Block | Kab chunta hai | Kya dikhta hai |
|---|---|---|
| `coins3d` | paise/nivesh + growth sentence | sone ke sikkon ke columns girte hain, camera orbit. Numbers na hon to "उदाहरण (illustration)" tag |
| `bars3d` | 2+ same-unit numbers | glossy 3D bars, labels asli values ke saath |
| `sphere3d` | world/global sentence | graticule + dotted globe + chamakte arcs (stylised, land map nahi) |
| `city3d` | sheher/bazaar/economy (numbers/trend na ho) | shehar upar uthta hai, camera fly-through |
| `exploded3d` | "parat/structure/kaise kaam" ya tech/science list | layers alag hoti hain, har layer par label |
| `atom3d` | parmanu/electron | nucleus + 3 orbit + electrons |
| `helix3d` | DNA/gene/cell | double helix bante hue |
| `planet3d` | grah/antariksh | ringed planet, moon, sun glow, stars |
| `network3d` | network/internet/data/AI | nodes + edges + data packets |
| `road3d` | **Documentary** + script mein 2+ saal | camera glowing road par chalta hai, har saal par pillar uthta hai (sirf script ke saal) |

Planner sirf tabhi chunta hai jab sentence mein cue ho; "3D scenes allow" band ho to koi 3D nahi. Falling-market jaisi sentence abhi bhi chart banti hai.

## Quality / mobile
- Tier: `hardwareConcurrency`, `deviceMemory`, GPU naam se. Preview mein FPS governor: 24 frames ka average 45 ms se upar -> ek tier neeche.
- MP4 export mein tier fixed (RAM se): 8 GB+ -> high, 4 GB -> medium. `renderVideo` export ke dauran `setExportMode(true)`.
- Tier table: pixel scale 1/0.75/0.5, bloom on/on/off, particles 1400/500/120.

## TEST STATUS (ईमानदारी से)
| Cheez | Status |
|---|---|
| layout/quality/planner logic | `tests/unit-three.ts` 27/27 PASS (Node) |
| purane tests (topics, asr-align, pro-plan) | PASS; `unit-ai-storage` is sandbox mein `zod` na hone se chala nahi (is badlav se unka koi sambandh nahi) |
| TypeScript | naye/badle files `three` ke stub ke saath clean; asli `@types/three` ke saath `npm run typecheck` phone/Actions par chalana hai |
| **WebGL rendering, bloom, look, speed** | **NAHI CHALA** - is sandbox mein `three`, internet aur browser nahi. Pehla GitHub Actions build + phone hi asli test hai |
| Phone par FPS / RAM / tier governor | NAHI naapa |
| MP4 mein 3D frames (WebCodecs) | NAHI test hua |

Pehle run par jo sabse zyada tootne ki sambhavna: `three/addons/...` import paths, EffectComposer + bloom ka scene switch, label placement. Actions log ya screenshot bhejo, main fix karunga.

## Limits
- Globe par continents nahi (land texture/GeoJSON asset chahiye). Exact machine/building ke liye GLB model loader agla kaam hai.
- Labels 2D mein draw hote hain (Hindi font ke liye), 3D text nahi.
- Android native (Kotlin MediaCodec), timeline engine, folder migration: abhi shuru nahi.
