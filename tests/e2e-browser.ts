import { splitSentences } from '/home/claude/final/divriz-ai/src/lib/brain/script';
import { planScenes } from '/home/claude/final/divriz-ai/src/lib/brain/plan';
import { analyzeSamples, alignScript } from '/home/claude/final/divriz-ai/src/lib/audio/analyze';
import { THEMES } from '/home/claude/final/divriz-ai/src/lib/motion/engine';
import { renderVideo, decodeAudioFile } from '/home/claude/final/divriz-ai/src/lib/render/renderVideo';
(window as any).run = async (script: string, aspect: any) => {
  const s = splitSentences(script);
  const sr = 22050, dur = 24, x = new Int16Array(sr * dur), w = s.map((a) => [...a.replace(/\s/g, '')].length), W = w.reduce((a, b) => a + b, 0);
  let t = 0.4; for (let i = 0; i < s.length; i++) { const d = (w[i] / W) * 20; for (let k = Math.floor(t * sr); k < Math.floor((t + d) * sr); k++) x[k] = 9000 * Math.sin(k * 0.05) * (0.6 + 0.4 * Math.sin(k * 0.0011)); t += d + 0.3; }
  const hdr = new ArrayBuffer(44), dv = new DataView(hdr), wr = (o: number, str: string) => [...str].forEach((ch, i) => dv.setUint8(o + i, ch.charCodeAt(0)));
  wr(0, 'RIFF'); dv.setUint32(4, 36 + x.length * 2, true); wr(8, 'WAVE'); wr(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); wr(36, 'data'); dv.setUint32(40, x.length * 2, true);
  const wav = new Blob([hdr, x.buffer]);
  const dec = await decodeAudioFile(wav, 48000);
  const info = analyzeSamples(dec.samples, dec.sampleRate), al = alignScript(s, info);
  const scenes = planScenes(al.scenes, { mode: 'explanation', allow3d: true, title: 'चक्रवृद्धि ब्याज' });
  let last = 0;
  const out = await renderVideo({ scenes, theme: THEMES.explanation, aspect, fps: 30, duration: info.duration, captions: true, audio: dec.samples, sampleRate: dec.sampleRate, onProgress: (p) => { last = p; } });
  return { dur: dec.duration, sr: dec.sampleRate, sil: info.silences.length, scenes: scenes.length, ms: Math.round(out.ms), frames: out.frames, note: out.note, w: out.width, h: out.height, stats: (window as any).__stats, last };
};
