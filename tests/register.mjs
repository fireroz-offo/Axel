import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
import fs from 'node:fs'; import { fileURLToPath } from 'node:url';
export async function resolve(spec, ctx, next){
  try { return await next(spec, ctx); } catch(e){
    if (e.code==='ERR_MODULE_NOT_FOUND' && (spec.startsWith('.')||spec.startsWith('/'))) {
      const base = new URL(spec, ctx.parentURL);
      for (const ext of ['.ts','/index.ts']) { const u = new URL(base.href+ext); if (fs.existsSync(fileURLToPath(u))) return next(u.href, ctx); }
    } throw e; } }`));
