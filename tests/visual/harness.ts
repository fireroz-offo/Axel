import { renderFrame, THEMES } from '/home/claude/w/divriz-ai/src/lib/motion/engine';
import { planScenes } from '/home/claude/w/divriz-ai/src/lib/brain/plan';
import { splitSentences } from '/home/claude/w/divriz-ai/src/lib/brain/script';
(window as any).H = { renderFrame, THEMES, planScenes, splitSentences };
