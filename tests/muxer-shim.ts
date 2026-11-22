export class ArrayBufferTarget { buffer = new ArrayBuffer(8); }
export class FileSystemWritableFileStreamTarget { constructor(public s: any) {} }
export class Muxer {
  v: any[] = []; a: any[] = []; o: any;
  constructor(o: any) { this.o = o; (window as any).__stats = { cfg: JSON.stringify(o.video) + (o.audio ? JSON.stringify(o.audio) : ' noaudio'), v: 0, a: 0, vBytes: 0, aBytes: 0, vLast: 0, aLast: 0, key: 0 }; }
  addVideoChunk(c: any, m: any) { const s = (window as any).__stats; s.v++; s.vBytes += c.byteLength; s.vLast = c.timestamp / 1e6; if (c.type === 'key') s.key++; s.hasDesc = !!m?.decoderConfig?.description; }
  addAudioChunk(c: any, m: any) { const s = (window as any).__stats; s.a++; s.aBytes += c.byteLength; s.aLast = c.timestamp / 1e6; s.aDesc = !!m?.decoderConfig?.description; }
  finalize() {}
}
