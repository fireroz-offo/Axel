import { MotionProCompositor } from '../../src/lib/motion/htmlCompositor';
import { THEMES } from '../../src/lib/motion/theme';
import { planScenes } from '../../src/lib/brain/plan';
import { splitSentences } from '../../src/lib/brain/script';
(window as any).H = { MotionProCompositor, THEMES, planScenes, splitSentences };
