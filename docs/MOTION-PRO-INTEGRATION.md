# Motion Pro 171K integration

DIVRIZ AI now includes a deterministic Motion Pro catalogue adapter in `src/lib/motion/catalog.ts`.

- The source HTML pack declares 171,000 generated template IDs across Motion Graphic ChatGPT, SaaS Explainer, Animation ChatGPT, Advanced Motion, Image Effects, Claude Motion, ChatGPT 2 and ChatGPT 3 families.
- `chooseMotion()` selects a stable template ID from the sentence text, scene block, category and seed. It avoids random changes between preview and export.
- The selected ID/family/filter is stored in each scene's `params` by `planScenes()`; user/AI block changes reselect a matching motion.
- `drawMotion()` renders procedural vector/Canvas motion behind the scene. It uses no external images and is called by the same `renderFrame()` used by preview and MP4 export.
- The ChatGPT 3 filter names are retained: Storyboard & Scenes, Typography & Layout, Vector & Line Draw, 2D / 3D Depth, Transitions & Morph, Particles & Audio.

Important implementation detail: the source HTML pack creates 171,000 deterministic variations from reusable CSS/DOM families; it is not 171,000 independent source files. This integration ports the family-level visual language into the app's Canvas pipeline. It does not embed the HTML gallery or execute DOM/CSS animations during MP4 rendering. Image-specific effects are represented with vector/shape transitions when no image asset is available.
