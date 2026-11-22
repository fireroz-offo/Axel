import type { Scene, Color, Texture, PerspectiveCamera, Vector3 } from 'three';
import type { Tier } from './quality';
export interface Pal { bg0: Color; bg1: Color; acc: Color; acc2: Color; ink: Color; doc: boolean }
/** A label glued to a 3D point; index.ts projects it to the screen and draws it as crisp 2D text (Hindi-safe). */
export interface Anchor { p: Vector3; text: string; sub?: string; at: number; fixed?: boolean }
export interface BuildCtx { scene: Scene; pal: Pal; tier: Tier; params: Record<string, any>; seed: number; aspect: number; fit: number; env: Texture | null }
export interface Built { /** t = seconds since scene start (can be slightly negative during the pre-roll) */ update(t: number, dur: number, cam: PerspectiveCamera): Anchor[] }
export type Recipe = (x: BuildCtx) => Built;
