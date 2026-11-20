// Phase 2: real capability probes. Nothing here is mocked - each test touches the actual browser API or network.
import { opfsSupported, opfsWrite, opfsRead, opfsRemove } from './db';

export type Status = 'pass' | 'warn' | 'fail';
export interface TestResult { id: string; group: string; label: string; status: Status; detail: string }

type Probe = () => Promise<Omit<TestResult, 'id' | 'group' | 'label'>>;
interface Def { id: string; group: string; label: string; run: Probe }

const ok = (detail: string) => ({ status: 'pass' as Status, detail });
const warn = (detail: string) => ({ status: 'warn' as Status, detail });
const fail = (detail: string) => ({ status: 'fail' as Status, detail });

async function net(url: string) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    return r.ok ? ok('CORS + HTTP ' + r.status) : warn('HTTP ' + r.status);
  } catch (e) {
    return fail('Blocked/failed: ' + (e as Error).message);
  } finally { clearTimeout(t); }
}

const defs: Def[] = [
  { id: 'secure', group: 'Platform', label: 'Secure context (HTTPS)', run: async () => (window.isSecureContext ? ok('yes') : fail('needs HTTPS/localhost for WebCodecs, OPFS, WebGPU')) },
  { id: 'coi', group: 'Platform', label: 'Cross-origin isolated (SharedArrayBuffer)', run: async () => (crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined' ? ok('yes - multithreaded WASM possible') : warn('no - first load registers coi-sw; reload once. Single-thread WASM still works.')) },
  { id: 'mem', group: 'Platform', label: 'Device memory / CPU cores', run: async () => warn(`${(navigator as any).deviceMemory ?? '?'} GB RAM (approx), ${navigator.hardwareConcurrency ?? '?'} cores`) },
  { id: 'gpu', group: 'AI + 3D', label: 'WebGPU (WebLLM needs it)', run: async () => {
      const gpu = (navigator as any).gpu;
      if (!gpu) return fail('navigator.gpu missing - WebLLM unavailable; use WASM fallback (slower, smaller models)');
      const a = await gpu.requestAdapter();
      return a ? ok('adapter available') : fail('no adapter');
  } },
  { id: 'gl2', group: 'AI + 3D', label: 'WebGL2 (Three.js)', run: async () => (document.createElement('canvas').getContext('webgl2') ? ok('yes') : fail('no WebGL2')) },
  { id: 'wasm', group: 'AI + 3D', label: 'WebAssembly SIMD', run: async () => {
      try {
        const simd = WebAssembly.validate(new Uint8Array([0,97,115,109,1,0,0,0,1,5,1,96,0,1,123,3,2,1,0,10,10,1,8,0,65,0,253,15,253,98,11]));
        return simd ? ok('yes') : warn('no SIMD - slower Whisper/FFmpeg');
      } catch { return warn('could not test'); }
  } },
  { id: 'venc', group: 'Rendering', label: 'WebCodecs H.264 encoder (720p30)', run: async () => {
      const VE = (window as any).VideoEncoder;
      if (!VE) return fail('VideoEncoder missing - need FFmpeg.wasm fallback');
      const r = await VE.isConfigSupported({ codec: 'avc1.42001f', width: 1280, height: 720, bitrate: 3_000_000, framerate: 30 });
      return r.supported ? ok('avc1.42001f supported') : fail('H.264 720p not supported');
  } },
  { id: 'v1080', group: 'Rendering', label: 'WebCodecs H.264 1080p30', run: async () => {
      const VE = (window as any).VideoEncoder;
      if (!VE) return fail('no VideoEncoder');
      const r = await VE.isConfigSupported({ codec: 'avc1.640028', width: 1920, height: 1080, bitrate: 6_000_000, framerate: 30 });
      return r.supported ? ok('supported') : warn('1080p H.264 not supported - cap export at 720p on this device');
  } },
  { id: 'aenc', group: 'Rendering', label: 'WebCodecs AAC encoder', run: async () => {
      const AE = (window as any).AudioEncoder;
      if (!AE) return fail('AudioEncoder missing - need FFmpeg.wasm for AAC');
      const r = await AE.isConfigSupported({ codec: 'mp4a.40.2', sampleRate: 44100, numberOfChannels: 1, bitrate: 96000 });
      return r.supported ? ok('mp4a.40.2 supported') : warn('AAC not supported - fallback: FFmpeg.wasm AAC encode');
  } },
  { id: 'mr', group: 'Rendering', label: 'MediaRecorder MP4', run: async () => (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/mp4') ? ok('video/mp4 supported') : warn('records WebM only on this browser')) },
  { id: 'opfs', group: 'Storage', label: 'OPFS read/write', run: async () => {
      if (!opfsSupported()) return fail('OPFS not available');
      try {
        await opfsWrite('probe', 't.txt', 'divriz');
        const f = await opfsRead('probe', 't.txt');
        const txt = await f.text();
        await opfsRemove('probe', 't.txt');
        return txt === 'divriz' ? ok('round-trip OK') : fail('content mismatch');
      } catch (e) { return fail((e as Error).message); }
  } },
  { id: 'idb', group: 'Storage', label: 'IndexedDB', run: async () => (typeof indexedDB !== 'undefined' ? ok('yes') : fail('missing')) },
  { id: 'quota', group: 'Storage', label: 'Storage quota', run: async () => {
      const e = await navigator.storage?.estimate?.();
      return e?.quota ? ok(`${Math.round((e.usage ?? 0) / 1e6)} MB used of ~${Math.round(e.quota / 1e6)} MB`) : warn('unknown');
  } },
  { id: 'actx', group: 'Audio', label: 'Web Audio + decodeAudioData', run: async () => ((window.AudioContext || (window as any).webkitAudioContext) ? ok('yes (MP3/WAV/M4A decode depends on browser codecs)') : fail('no AudioContext')) },
  { id: 'sr', group: 'Audio', label: 'Browser SpeechRecognition (live mic only)', run: async () => (((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) ? warn('exists, but cannot transcribe uploaded files and may use a vendor server - NOT used. Whisper (Transformers.js) planned for Phase 10.') : warn('absent - fine, Whisper planned')) },
  { id: 'n-gdelt', group: 'Research APIs', label: 'GDELT news (keyless)', run: () => net('https://api.gdeltproject.org/api/v2/doc/doc?query=economy&mode=artlist&maxrecords=1&format=json') },
  { id: 'n-hn', group: 'Research APIs', label: 'Hacker News Algolia', run: () => net('https://hn.algolia.com/api/v1/search_by_date?query=ai&tags=story&hitsPerPage=1') },
  { id: 'n-wiki', group: 'Research APIs', label: 'Wikipedia API', run: () => net('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=finance&format=json&origin=*&srlimit=1') },
  { id: 'n-yt', group: 'Research APIs', label: 'YouTube direct (expected to be blocked)', run: async () => {
      const r = await net('https://www.youtube.com/feeds/videos.xml?channel_id=UC_x5XG1OV2P6uZZ5FSM9Ttw');
      return r.status === 'pass' ? ok('reachable (unexpected)') : warn('No CORS => competitor research cannot call YouTube from browser. See FEASIBILITY_REPORT.md');
  } },
  { id: 'n-hf', group: 'AI model hosting', label: 'HuggingFace model CDN reachable', run: () => net('https://huggingface.co/api/models/onnx-community/whisper-tiny/tree/main') }
];

export async function runFeasibility(onResult: (r: TestResult) => void): Promise<TestResult[]> {
  const out: TestResult[] = [];
  for (const d of defs) {
    let r: TestResult;
    try {
      r = { id: d.id, group: d.group, label: d.label, ...(await d.run()) };
    } catch (e) {
      r = { id: d.id, group: d.group, label: d.label, status: 'fail', detail: (e as Error).message };
    }
    out.push(r);
    onResult(r);
  }
  return out;
}
