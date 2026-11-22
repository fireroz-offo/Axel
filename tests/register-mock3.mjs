import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
export async function resolve(spec, ctx, next){ if (spec === 'three') return { url: new URL('./mock-three.mjs', ${JSON.stringify(import.meta.url)}).href, shortCircuit: true }; return next(spec, ctx); }`));
