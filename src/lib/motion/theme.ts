import type { Mode } from '../brain/plan';
const FONT = '"Noto Sans Devanagari","Hind","Mukta",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
export interface Theme { name: Mode; bg0: string; bg1: string; ink: string; mut: string; acc: string; acc2: string; letterbox: boolean; vignette: number; font: string }
export const THEMES: Record<Mode, Theme> = {
  explanation: { name: 'explanation', bg0: '#0b1020', bg1: '#1a2559', ink: '#ffffff', mut: '#aab4d8', acc: '#ffb454', acc2: '#5ee0c0', letterbox: false, vignette: 0.25, font: FONT },
  documentary: { name: 'documentary', bg0: '#0a0a0c', bg1: '#1c2428', ink: '#f2ece0', mut: '#a39b8b', acc: '#d9a441', acc2: '#6fa8a0', letterbox: true, vignette: 0.55, font: FONT }
};

export interface Area { x0:number; y0:number; x1:number; y1:number; w:number; h:number; cx:number; cy:number; u:number; portrait:boolean }
