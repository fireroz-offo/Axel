// Minimal ZIP reader (stored + deflate) using the browser's native DecompressionStream. No dependency, with zip-bomb limits.
export async function readZip(buf: ArrayBuffer, limits = { maxFiles: 500, maxTotal: 60e6 }): Promise<Map<string, Uint8Array>> {
  const u8 = new Uint8Array(buf), dv = new DataView(buf);
  let e = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('Ye valid ZIP nahi hai.');
  const n = dv.getUint16(e + 10, true); let off = dv.getUint32(e + 16, true);
  if (n > limits.maxFiles) throw new Error(`ZIP mein ${n} files hain (limit ${limits.maxFiles}).`);
  const out = new Map<string, Uint8Array>(); let total = 0;
  for (let k = 0; k < n; k++) {
    if (dv.getUint32(off, true) !== 0x02014b50) throw new Error('ZIP directory kharab hai.');
    const flags = dv.getUint16(off + 8, true), method = dv.getUint16(off + 10, true), csize = dv.getUint32(off + 20, true), usize = dv.getUint32(off + 24, true);
    const nl = dv.getUint16(off + 28, true), el = dv.getUint16(off + 30, true), cl = dv.getUint16(off + 32, true), lho = dv.getUint32(off + 42, true);
    const name = new TextDecoder().decode(u8.subarray(off + 46, off + 46 + nl)).replace(/\\/g, '/');
    off += 46 + nl + el + cl;
    if (name.endsWith('/') || name.startsWith('__MACOSX') || name.includes('..')) continue;
    if (flags & 1) throw new Error('Password-wali ZIP support nahi.');
    total += usize; if (total > limits.maxTotal) throw new Error('ZIP kholne par bahut bada ho jata hai (zip-bomb guard).');
    const lnl = dv.getUint16(lho + 26, true), lel = dv.getUint16(lho + 28, true), start = lho + 30 + lnl + lel;
    const data = u8.subarray(start, start + csize);
    if (method === 0) out.set(name, data.slice());
    else if (method === 8) {
      const ab = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
      if (ab.byteLength > usize + 16) throw new Error('ZIP entry size mismatch.');
      out.set(name, new Uint8Array(ab));
    }
  }
  return out;
}
