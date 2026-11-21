export interface Stage { id: string; n: number; label: string; phase: number; done: boolean }
// done=true only for stages that are really implemented in this build.
export const STAGES: Stage[] = [
  { id: 'category', n: 1, label: 'Category Selection', phase: 4, done: true },
  { id: 'news', n: 2, label: 'Live News & Trend Research', phase: 4, done: true },
  { id: 'topics', n: 4, label: 'Topic Recommendations + Approval', phase: 6, done: true },
  { id: 'vtype', n: 5, label: 'Explanation / Documentary', phase: 7, done: false },
  { id: 'script-own', n: 6, label: 'Apni Script se video (paste / likho)', phase: 4, done: true },
  { id: 'script', n: 7, label: 'AI Script: Short 30-50 sec ya Long 5-10 min', phase: 8, done: false },
  { id: 'voice', n: 7, label: 'Voiceover Upload + Analysis', phase: 10, done: true },
  { id: 'story', n: 8, label: 'Scene Storyboard', phase: 12, done: true },
  { id: 'assets', n: 9, label: 'HTML Motion Library', phase: 13, done: true },
  { id: 'm2d', n: 10, label: '2D Motion Graphics', phase: 14, done: true },
  { id: 'm3d', n: 11, label: '3D Motion Graphics', phase: 15, done: true },
  { id: 'sync', n: 12, label: 'Audio-Visual Sync', phase: 16, done: true },
  { id: 'render', n: 13, label: 'MP4 Render + Export', phase: 17, done: true }
];
