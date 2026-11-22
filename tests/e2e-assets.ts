import { MotionProCompositor } from '../src/lib/motion/htmlCompositor';
import { THEMES } from '../src/lib/motion/theme';
import { planBitrate } from '../src/lib/render/budget';
import { planScenes } from '../src/lib/brain/plan';
(window as any).run = async () => {
  const timed = [{ text: 'DIVRIZ AI builds a better visual story with animated data and motion.', start: 0, end: 4, words: [] as any }];
  const scenes = planScenes(timed, { mode: 'explanation', allow3d: true, category: 'technology' });
  const compositor = new MotionProCompositor(720, 1280);
  try {
    const frame = await compositor.renderFrame(scenes, 1.2, THEMES.explanation, true);
    return { width: frame.width, height: frame.height, templateId: scenes[0].params.motionId, budget: planBitrate({ width: 720, height: 1280, fps: 24, duration: 4, quality: 'balanced', maxMB: 100, hasAudio: false }) };
  } finally { await compositor.dispose(); }
};
