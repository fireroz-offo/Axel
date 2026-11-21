/** Motion Pro 171K-compatible procedural catalogue. The source pack generates 171,000
 * deterministic variants from reusable families; this runtime maps those families to
 * Canvas primitives so preview and MP4 export use the exact same renderer. */
import type { SceneSpec } from '../brain/plan';
import type { Theme, Area } from './engine';
export type MotionFamily = 'typography'|'data'|'line'|'depth'|'particles'|'transition'|'ui'|'abstract'|'saas'|'image-effects';
export const MOTION_LIBRARY = {
  total: 171000,
  ranges: [
    { name:'Motion Graphic ChatGPT', from:1, to:10000, family:'typography' as MotionFamily },
    { name:'SaaS Explainer', from:10001, to:11000, family:'saas' as MotionFamily },
    { name:'Animation ChatGPT', from:11001, to:21000, family:'abstract' as MotionFamily },
    { name:'Advanced Motion', from:21001, to:31000, family:'depth' as MotionFamily },
    { name:'Image Effects', from:31001, to:41000, family:'image-effects' as MotionFamily },
    { name:'Claude Motion', from:41001, to:51000, family:'ui' as MotionFamily },
    { name:'ChatGPT 2', from:51001, to:71000, family:'line' as MotionFamily },
    { name:'ChatGPT 3', from:71001, to:171000, family:'abstract' as MotionFamily }
  ],
  chatGPT3Filters: ['Storyboard & Scenes','Typography & Layout','Vector & Line Draw','2D / 3D Depth','Transitions & Morph','Particles & Audio']
};
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export function chooseMotion(text:string, block:string, category='other', seed='') {
 const t=text.toLowerCase(); let family:MotionFamily='abstract';
 if(/₹|रुपय|पैसा|निवेश|ब्याज|बचत|महंगाई|profit|finance|money|revenue|%|\d/.test(t) || ['stat','bars','bars3d','line','chartcard'].includes(block)) family='data';
 else if(/कैसे काम|प्रक्रिया|स्टेप|चरण|पहले|फिर|बाद में|workflow|process|step|timeline|history|वर्ष|साल/.test(t) || ['steps','timeline','road3d'].includes(block)) family='line';
 else if(/ai|एआई|तकनीक|कंप्यूटर|चिप|इंटरनेट|डेटा|विज्ञान|परमाणु|डीएनए|space|tech|science|network|robot/.test(t) || ['network3d','atom3d','helix3d','planet3d'].includes(block)) family='depth';
 else if(/कंपनी|बिजनेस|व्यापार|बाजार|मार्केट|ग्राहक|ऐप|सॉफ्टवेयर|business|startup|saas|product/.test(t)) family='saas';
 else if(/दिमाग|मनोविज्ञान|इंसान|आदत|सोच|भावना|mind|psychology|human/.test(t)) family='particles';
 else if(/तुलना|लेकिन|जबकि|versus|compare|difference|फर्क/.test(t) || block==='compare') family='transition';
 else if(['title','hero','end','quote','words'].includes(block)) family='typography';
 const ranges=MOTION_LIBRARY.ranges;
 const related: Record<MotionFamily,string[]> = {
   typography:['Motion Graphic ChatGPT','ChatGPT 3'], data:['Motion Graphic ChatGPT','SaaS Explainer','ChatGPT 3'],
   line:['ChatGPT 2','ChatGPT 3'], depth:['Advanced Motion','ChatGPT 3'], particles:['Animation ChatGPT','ChatGPT 3'],
   transition:['Claude Motion','ChatGPT 3'], ui:['Claude Motion','SaaS Explainer','ChatGPT 3'],
   abstract:['Animation ChatGPT','ChatGPT 3'], saas:['SaaS Explainer','Claude Motion','ChatGPT 3'], 'image-effects':['Image Effects','ChatGPT 3']
 };
 const pool=ranges.filter(x=>(related[family]||[]).includes(x.name));
 const h=hash(`${seed}|${text}|${block}|${category}`), total=pool.reduce((n,x)=>n+x.to-x.from+1,0);
 let offset=h%total, r=pool[0]; for(const item of pool){const size=item.to-item.from+1;if(offset<size){r=item;break}offset-=size;}
 const motionId=r.from+offset, filter=r.name==='ChatGPT 3'?MOTION_LIBRARY.chatGPT3Filters[Math.floor((h>>>8)%6)]:r.name;
 return { motionId, motionFamily:family, motionVariant:h%48, motionFilter:filter, motionCategory:category };
}
function path(c:CanvasRenderingContext2D, pts:number[][]){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke()}
/** Draws a subtle, lightweight animated motif behind the main composition. */
export function drawMotion(c:CanvasRenderingContext2D,w:number,h:number,a:Area,s:SceneSpec,t:number,th:Theme){
 const p=s.params as any, fam=(p.motionFamily||'abstract') as MotionFamily, v=Number(p.motionVariant||0), seed=Number(s.id||0)+v*17;
 const u=Math.min(w,h)/720, alpha=th.name==='documentary'?.20:.26, acc=th.acc, acc2=th.acc2;
 c.save(); c.globalAlpha=alpha; c.lineWidth=Math.max(1,u*2.2); c.strokeStyle=acc; c.fillStyle=acc;
 const phase=t*.8+seed*.13, cx=a.cx, cy=a.cy;
 if(fam==='data'){
   const n=7, base=a.y1-a.h*.08, bw=a.w/(n*1.7), gap=bw*.7;
   for(let i=0;i<n;i++){const val=.18+((hash(`${seed}-${i}`)%70)/100), pulse=.8+.2*Math.sin(phase+i), bh=a.h*.36*val*pulse,x=cx-(n*(bw+gap)-gap)/2+i*(bw+gap); c.globalAlpha=alpha*(.45+i*.055); c.fillStyle=i%3===0?acc2:acc; c.fillRect(x,base-bh,bw,bh); c.beginPath();c.arc(x+bw/2,base-bh,u*3,0,Math.PI*2);c.fill();}
   c.globalAlpha=alpha*.65; c.strokeStyle=acc2; path(c,Array.from({length:40},(_,i)=>[a.x0+i*a.w/39,base-a.h*(.15+.08*Math.sin(i*.28+phase))]));
 } else if(fam==='line'){
   for(let j=0;j<3;j++){c.globalAlpha=alpha*(.8-j*.18);c.strokeStyle=j%2?acc2:acc; const pts=Array.from({length:42},(_,i)=>{const x=a.x0+i*a.w/41;return [x,cy+Math.sin(i*.19+phase+j)*a.h*(.08+j*.025)+Math.cos(i*.07-phase)*a.h*.035]});path(c,pts);}
   const x=a.x0+((t*90+seed*7)%(a.w)); c.globalAlpha=alpha*1.6;c.beginPath();c.arc(x,cy+Math.sin((x-a.x0)/a.w*8+phase)*a.h*.1,u*7,0,Math.PI*2);c.fill();
 } else if(fam==='depth'){
   for(let j=0;j<5;j++){c.save();c.translate(cx,cy);c.rotate(phase*.12+j*Math.PI/5);c.strokeStyle=j%2?acc2:acc;c.globalAlpha=alpha*(.8-j*.1);c.beginPath();c.ellipse(0,0,a.w*(.18+j*.055),a.h*(.12+j*.045),0,0,Math.PI*2);c.stroke();c.restore();}
   for(let i=0;i<18;i++){const ang=i*2.399+phase*.25, r=a.w*(.08+(i%6)*.045);c.globalAlpha=alpha*.8;c.beginPath();c.arc(cx+Math.cos(ang)*r,cy+Math.sin(ang)*r,u*(2+i%3),0,Math.PI*2);c.fill();}
 } else if(fam==='particles'){
   for(let i=0;i<54;i++){const x=((hash(`${seed}x${i}`)%1000)/1000*w+t*(8+i%5)*u)%w,y=(hash(`${seed}y${i}`)%1000)/1000*h+Math.sin(phase+i)*u*14;c.globalAlpha=alpha*(.3+.7*Math.abs(Math.sin(phase+i)));c.fillStyle=i%4?acc:acc2;c.beginPath();c.arc(x,y,u*(1.5+i%4),0,Math.PI*2);c.fill();}
 } else if(fam==='saas'||fam==='ui'){
   const cardW=a.w*.22, cardH=a.h*.14;
   for(let i=0;i<4;i++){const x=a.x0+i*(cardW+u*14),y=a.y0+a.h*.12+(i%2)*a.h*.55;c.globalAlpha=alpha*.55;c.strokeStyle=acc;c.fillStyle='rgba(255,255,255,.025)';c.beginPath();c.roundRect(x,y,cardW,cardH, u*10);c.fill();c.stroke();c.fillStyle=acc2;c.fillRect(x+u*10,y+u*12,cardW*(.35+.1*Math.sin(phase+i)),u*4);c.fillRect(x+u*10,y+u*24,cardW*.7,u*3);}
   c.globalAlpha=alpha;c.strokeStyle=acc2;for(let i=0;i<3;i++){const y=a.y0+a.h*(.28+i*.2);c.beginPath();c.moveTo(a.x0,y);c.lineTo(a.x0+a.w,y+Math.sin(phase+i)*u*8);c.stroke();}
 } else if(fam==='transition'||fam==='image-effects'){
   const n=8;for(let i=0;i<n;i++){const x=a.x0+i*a.w/n, q=.5+.5*Math.sin(phase+i*.7);c.globalAlpha=alpha*(.2+q*.5);c.fillStyle=i%2?acc:acc2;c.fillRect(x,a.y0,a.w/n-u*2,a.h*(.12+q*.16));c.fillRect(x,a.y1-a.h*(.1+q*.14),a.w/n-u*2,a.h*(.1+q*.14));}
   c.globalAlpha=alpha*.6;c.strokeStyle=acc;c.beginPath();c.arc(cx,cy,Math.min(a.w,a.h)*(.18+.03*Math.sin(phase)),0,Math.PI*2);c.stroke();
 } else {
   // Kinetic typography / geometric pack: orbit rings, corner lines and pulsing geometry.
   for(let i=0;i<4;i++){c.globalAlpha=alpha*(.65-i*.12);c.strokeStyle=i%2?acc2:acc;c.beginPath();c.arc(cx,cy,Math.min(a.w,a.h)*(.16+i*.09)+Math.sin(phase+i)*u*5,0,Math.PI*2);c.stroke();}
   for(let i=0;i<12;i++){const ang=i*Math.PI/6+phase*.25,r=Math.min(a.w,a.h)*.42,x=cx+Math.cos(ang)*r,y=cy+Math.sin(ang)*r;c.globalAlpha=alpha*.8;c.fillStyle=i%3?acc:acc2;c.save();c.translate(x,y);c.rotate(ang);c.fillRect(-u*3,-u*3,u*6,u*6);c.restore();}
 }
 c.restore();
}
