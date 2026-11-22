// Safe runtime for user HTML/CSS/JS motion assets.
//  * Each asset runs in a sandboxed iframe: sandbox="allow-scripts" only (NO same-origin => no cookies, storage or parent access) + a CSP that blocks all network.
//  * Frames are captured deterministically: seek(t) -> bake computed styles -> SVG foreignObject -> ImageBitmap. frame = f(time), like the rest of the engine.
//  * Seek order: window.divrizSeek(t, vars) if the asset defines it; else GSAP global timeline, Lottie, CSS/WAAPI animations.
import type { SceneSpec } from '../brain/plan';
import type { AssetDef } from './store';

export interface AssetProvider { prime(scenes: SceneSpec[], t: number): Promise<void>; frame(s: SceneSpec, lt: number): ImageBitmap | null }
export interface AssetVars { acc: string; ink: string; bg: string }

export const CSP = "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; media-src data:; script-src 'unsafe-inline'";

const HARNESS = `(function(){
var tpl=null;
function collect(){tpl=[];var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),n;while(n=w.nextNode()){if(n.nodeValue.indexOf('{{')>=0)tpl.push([n,n.nodeValue]);}}
function fill(v){if(!tpl)collect();tpl.forEach(function(p){p[0].nodeValue=p[1].replace(/\\{\\{(\\w+)\\}\\}/g,function(_,k){return v&&v[k]!=null?String(v[k]):'';});});
 var r=document.documentElement.style;if(v)['acc','ink','bg'].forEach(function(k){if(v[k])r.setProperty('--divriz-'+k,v[k]);});}
function seek(t,v){window.DIVRIZ=v||{};
 try{if(typeof window.divrizSeek==='function'){window.divrizSeek(t,v||{});}
 else{
  if(window.gsap&&window.gsap.globalTimeline){window.gsap.globalTimeline.pause();window.gsap.globalTimeline.time(t,false);}
  if(window.__divrizLottie){window.__divrizLottie.goToAndStop(t*1000,false);}
  if(document.getAnimations){document.getAnimations().forEach(function(a){try{a.pause();a.currentTime=t*1000;}catch(e){}});}
 }}catch(e){parent.postMessage({type:'err',msg:String(e)},'*');}}
function bake(src,dst){
 if(src.tagName==='SCRIPT'||src.tagName==='STYLE')return;
 var cs=getComputedStyle(src),css='';
 for(var i=0;i<cs.length;i++){var p=cs[i];if(p.indexOf('animation')===0||p.indexOf('transition')===0)continue;css+=p+':'+cs.getPropertyValue(p)+';';}
 dst.setAttribute('style',css+'animation:none;transition:none;');
 var sc=src.children,dc=dst.children;for(var k=0;k<sc.length;k++)if(dc[k])bake(sc[k],dc[k]);
 pseudo(src,dst,'before');pseudo(src,dst,'after');}
function pseudo(src,dst,w){
 var ps=getComputedStyle(src,'::'+w),ct=ps.content;if(!ct||ct==='none'||ct==='normal')return;
 var css='';for(var i=0;i<ps.length;i++){var p=ps[i];if(p.indexOf('animation')===0||p.indexOf('transition')===0||p==='content')continue;css+=p+':'+ps.getPropertyValue(p)+';';}
 var txt=ct.replace(/^["']|["']$/g,'');
 if(ct.indexOf('counter(')===0){var nm=ct.slice(8).split(')')[0].trim(),cr=getComputedStyle(src).counterReset||'',parts=cr.split(' '),at=parts.indexOf(nm);txt=at>=0&&parts[at+1]!=null&&!isNaN(parseFloat(parts[at+1]))?String(Math.round(parseFloat(parts[at+1]))):'0';}
 else if(/^(attr|url|counters|open-quote|close-quote)/.test(ct))txt='';
 var sp=document.createElement('span');sp.setAttribute('style',css+'animation:none;transition:none;');sp.textContent=txt;
 if(w==='before')dst.insertBefore(sp,dst.firstChild);else dst.appendChild(sp);}
function capture(m){
 seek(m.t,m.vars);fill(m.vars);
 var W=m.w,H=m.h,body=document.body,clone=body.cloneNode(true);
 bake(body,clone);
 var cv=body.querySelectorAll('canvas'),cc=clone.querySelectorAll('canvas');
 for(var i=0;i<cc.length;i++){try{var im=document.createElement('img');im.setAttribute('src',cv[i].toDataURL('image/png'));im.setAttribute('style',cc[i].getAttribute('style')||'');cc[i].replaceWith(im);}catch(e){}}
 clone.querySelectorAll('script,style,noscript').forEach(function(x){x.remove();});
 var rootBg=getComputedStyle(document.documentElement).backgroundColor,bodyBg=getComputedStyle(body).backgroundColor;
 var extra=';margin:0;width:'+W+'px;height:'+H+'px;overflow:hidden;position:relative;box-sizing:border-box;';
 if(bodyBg==='rgba(0, 0, 0, 0)'&&rootBg!=='rgba(0, 0, 0, 0)')extra+='background-color:'+rootBg+';';
 clone.setAttribute('style',(clone.getAttribute('style')||'')+extra);
 var ff='';try{Array.prototype.forEach.call(document.styleSheets,function(ss){Array.prototype.forEach.call(ss.cssRules,function(r){if(r.type===5)ff+=r.cssText;});});}catch(e){}
 var xml=new XMLSerializer().serializeToString(clone);
 var svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'"><foreignObject x="0" y="0" width="'+W+'" height="'+H+'"><div xmlns="http://www.w3.org/1999/xhtml"><style>'+ff+'</style>'+xml+'</div></foreignObject></svg>';
 return new Promise(function(res,rej){var img=new Image();img.width=W;img.height=H;
  img.onload=function(){try{var oc=new OffscreenCanvas(W,H),cx=oc.getContext('2d');cx.drawImage(img,0,0,W,H);res(oc.transferToImageBitmap());}catch(e){rej(e);}};
  img.onerror=function(){rej(new Error('asset render fail'));};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});}
window.addEventListener('message',function(e){var m=e.data;if(!m||m.type!=='cap')return;
 capture(m).then(function(bm){parent.postMessage({type:'frame',id:m.id,bitmap:bm},'*',[bm]);},function(err){parent.postMessage({type:'frame',id:m.id,error:String(err)},'*');});});
window.addEventListener('error',function(e){parent.postMessage({type:'err',msg:String(e.message)},'*');});
window.addEventListener('load',function(){setTimeout(function(){parent.postMessage({type:'ready'},'*');},30);});
})();`;

/** Bundled libraries are injected only when the asset uses them (Vite ?raw imports; offline, no CDN). */
async function libSource(name: string): Promise<string> {
  try {
    if (name === 'gsap') return (await import('gsap/dist/gsap.min.js?raw')).default;
    if (name === 'lottie') return (await import('lottie-web/build/player/lottie_light.min.js?raw')).default;
  } catch { /* package missing -> asset runs without it */ }
  return '';
}
const safeScript = (s: string) => s.replace(/<\/script/gi, '<\\/script');

export async function composeSrcdoc(def: Pick<AssetDef, 'html' | 'libs'>): Promise<string> {
  let inject = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
  for (const l of def.libs) { if (l !== 'gsap' && l !== 'lottie') continue; const src = await libSource(l); if (src && !new RegExp(`window\\.${l}\\s*=`).test(def.html)) inject += `<script>${safeScript(src)}</script>`; }
  inject += `<script>${safeScript(HARNESS)}</script>`;
  return /<head[^>]*>/i.test(def.html) ? def.html.replace(/<head[^>]*>/i, (m) => m + inject) : inject + def.html;
}

export function lottieWrapper(json: string): { html: string; duration: number } {
  const d = JSON.parse(json);
  if (!d || typeof d.op !== 'number' || !d.fr) throw new Error('Ye valid Lottie JSON nahi lagta (op/fr nahi mila).');
  if (/"x"\s*:\s*"[^"]*(thisComp|time|wiggle|loopOut)/.test(json)) throw new Error('Expressions wali Lottie support nahi (security). Expression hata kar export karein.');
  const duration = Math.max(0.5, Math.min(30, (d.op - (d.ip ?? 0)) / d.fr));
  const html = `<!DOCTYPE html><html><head><meta name="divriz-duration" content="${duration.toFixed(2)}"><style>html,body{margin:0;height:100%;background:transparent}#l{width:100%;height:100%}</style></head><body><div id="l"></div><script>window.__divrizLottie=lottie.loadAnimation({container:document.getElementById('l'),renderer:'svg',loop:false,autoplay:false,animationData:${safeScript(JSON.stringify(d))}});</script></body></html>`;
  return { html, duration };
}

interface Slot { el: HTMLIFrameElement; ready: Promise<void> }
export class AssetRuntime implements AssetProvider {
  private slots = new Map<string, Slot>();
  private cur = new Map<number, ImageBitmap>();
  private pend = new Map<number, { res: (b: ImageBitmap) => void; rej: (e: Error) => void; timer: any }>();
  private seq = 0;
  failed = new Map<string, string>();
  errors: string[] = [];
  constructor(private defs: Map<string, AssetDef>, public size: { w: number; h: number }, private vars: () => AssetVars) { window.addEventListener('message', this.onMsg); }

  private onMsg = (e: MessageEvent) => {
    const m = e.data; if (!m || typeof m !== 'object') return;
    if (m.type === 'err') { if (this.errors.length < 20) this.errors.push(String(m.msg)); return; }
    if (m.type === 'frame') { const p = this.pend.get(m.id); if (!p) return; clearTimeout(p.timer); this.pend.delete(m.id); m.bitmap ? p.res(m.bitmap) : p.rej(new Error(m.error || 'capture failed')); }
  };

  private async slot(def: AssetDef): Promise<Slot> {
    let s = this.slots.get(def.id); if (s) return s;
    const el = document.createElement('iframe');
    el.setAttribute('sandbox', 'allow-scripts'); el.referrerPolicy = 'no-referrer'; el.title = def.name;
    el.style.cssText = `position:fixed;left:0;top:0;width:${this.size.w}px;height:${this.size.h}px;border:0;opacity:0.01;pointer-events:none;z-index:-1`;
    const srcdoc = await composeSrcdoc(def);
    const ready = new Promise<void>((res, rej) => {
      const t = setTimeout(() => { window.removeEventListener('message', h); rej(new Error('asset load timeout')); }, 8000);
      const h = (e: MessageEvent) => { if (e.source === el.contentWindow && e.data?.type === 'ready') { clearTimeout(t); window.removeEventListener('message', h); res(); } };
      window.addEventListener('message', h);
    });
    el.srcdoc = srcdoc; document.body.appendChild(el);
    s = { el, ready }; this.slots.set(def.id, s); return s;
  }

  async capture(def: AssetDef, t: number, vars: Record<string, any>): Promise<ImageBitmap> {
    const s = await this.slot(def); await s.ready;
    const id = ++this.seq;
    return new Promise((res, rej) => {
      const timer = setTimeout(() => { this.pend.delete(id); rej(new Error('capture timeout')); }, 6000);
      this.pend.set(id, { res, rej, timer });
      s.el.contentWindow?.postMessage({ type: 'cap', id, t, w: this.size.w, h: this.size.h, vars }, '*');
    });
  }

  private active(scenes: SceneSpec[], t: number) { return scenes.filter((s) => s.block === 'asset' && t >= s.start - 0.02 && t < s.end + 0.45); }
  async prime(scenes: SceneSpec[], t: number): Promise<void> {
    for (const s of this.active(scenes, t)) {
      const def = this.defs.get(s.params.assetId); if (!def || this.failed.has(def.id)) continue;
      const lt = Math.max(0, t - s.start), local = def.duration > 0 ? lt % def.duration : lt, th = this.vars();
      const kw = (s.text.match(/[\p{L}\p{N}]{4,}/gu) ?? [])[0] ?? '', num = /\d[\d,.]*%?/.exec(s.text)?.[0] ?? '';
      try {
        const bm = await this.capture(def, local, { text: s.text, keyword: kw, number: num, ...th });
        this.cur.get(s.id)?.close(); this.cur.set(s.id, bm);
      } catch (e: any) { this.failed.set(def.id, String(e?.message ?? e)); }
    }
    // free bitmaps of scenes that are no longer active (keeps RAM flat)
    const keep = new Set(this.active(scenes, t).map((s) => s.id));
    for (const [id, bm] of this.cur) if (!keep.has(id)) { bm.close(); this.cur.delete(id); }
  }
  /** preview: never queue frames, drop if one is already in flight */
  private busy = false;
  primeSoon(scenes: SceneSpec[], t: number) { if (this.busy) return; this.busy = true; this.prime(scenes, t).finally(() => { this.busy = false; }); }
  frame(s: SceneSpec, _lt: number): ImageBitmap | null { return this.cur.get(s.id) ?? null; }
  dispose() {
    window.removeEventListener('message', this.onMsg);
    this.cur.forEach((b) => b.close()); this.cur.clear();
    this.slots.forEach((s) => s.el.remove()); this.slots.clear();
    this.pend.forEach((p) => clearTimeout(p.timer)); this.pend.clear();
  }
}
