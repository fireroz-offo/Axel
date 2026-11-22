/** Script-aware selector for the original Motion Pro HTML/CSS/JS template catalogue. */
export type MotionFamily = 'typography'|'data'|'line'|'depth'|'particles'|'transition'|'ui'|'abstract'|'saas'|'image-effects';
export const MOTION_LIBRARY = { total:171000, ranges:[
{name:'Motion Graphic ChatGPT',from:1,to:10000,family:'typography' as MotionFamily},
{name:'SaaS Explainer',from:10001,to:11000,family:'saas' as MotionFamily},
{name:'Animation ChatGPT',from:11001,to:21000,family:'abstract' as MotionFamily},
{name:'Advanced Motion',from:21001,to:31000,family:'depth' as MotionFamily},
{name:'Image Effects',from:31001,to:41000,family:'image-effects' as MotionFamily},
{name:'Claude Motion',from:41001,to:51000,family:'ui' as MotionFamily},
{name:'ChatGPT 2',from:51001,to:71000,family:'line' as MotionFamily},
{name:'ChatGPT 3',from:71001,to:171000,family:'abstract' as MotionFamily}],
chatGPT3Filters:['Storyboard & Scenes','Typography & Layout','Vector & Line Draw','2D / 3D Depth','Transitions & Morph','Particles & Audio']};
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export function familyOf(text:string, block:string):MotionFamily {
 const t=text.toLowerCase(); let family:MotionFamily='abstract';
 if(/₹|रुपय|पैसा|निवेश|ब्याज|बचत|महंगाई|profit|finance|money|revenue|%|\d/.test(t) || ['stat','bars','bars3d','line','chartcard'].includes(block)) family='data';
 else if(/कैसे काम|प्रक्रिया|स्टेप|चरण|पहले|फिर|बाद में|workflow|process|step|timeline|history|वर्ष|साल/.test(t) || ['steps','timeline','road3d'].includes(block)) family='line';
 else if(/ai|एआई|तकनीक|कंप्यूटर|चिप|इंटरनेट|डेटा|विज्ञान|परमाणु|डीएनए|space|tech|science|network|robot/.test(t) || ['network3d','atom3d','helix3d','planet3d'].includes(block)) family='depth';
 else if(/कंपनी|बिजनेस|व्यापार|बाजार|मार्केट|ग्राहक|ऐप|सॉफ्टवेयर|business|startup|saas|product/.test(t)) family='saas';
 else if(/दिमाग|मनोविज्ञान|इंसान|आदत|सोच|भावना|mind|psychology|human/.test(t)) family='particles';
 else if(/तुलना|लेकिन|जबकि|versus|compare|difference|फर्क/.test(t) || block==='compare') family='transition';
 else if(['title','hero','end','quote','words'].includes(block)) family='typography';
 return family;
}
export function chooseMotion(text:string, block:string, category='other', seed='') {
 const t=text.toLowerCase(); const family=familyOf(text,block);
 const ranges=MOTION_LIBRARY.ranges;
 const related: Record<MotionFamily,string[]> = {
   typography:['Motion Graphic ChatGPT','ChatGPT 3'], data:['Motion Graphic ChatGPT','SaaS Explainer','ChatGPT 3'],
   line:['ChatGPT 2','ChatGPT 3'], depth:['Advanced Motion','ChatGPT 3'], particles:['Animation ChatGPT','ChatGPT 3'],
   transition:['Claude Motion','ChatGPT 3'], ui:['Claude Motion','SaaS Explainer','ChatGPT 3'],
   abstract:['Animation ChatGPT','ChatGPT 3'], saas:['SaaS Explainer','Claude Motion','ChatGPT 3'], 'image-effects':['Image Effects','ChatGPT 3']
 };
 // SaaS Explainer / Claude Motion templates ship fixed English demo UI (CloudBase, Users 8.4K, MRR...). Use them only when the script is really about software/apps.
 const softwareRe=/saas|software|startup|dashboard|subscription|\bapp\b|\bapi\b|सॉफ्टवेयर|स्टार्टअप|डैशबोर्ड|सब्सक्रिप्शन|ऐप|एप्लिकेशन/i;
 const demoUi=['SaaS Explainer','Claude Motion'], allowDemoUi=softwareRe.test(t);
 const pool=ranges.filter(x=>(related[family]||[]).includes(x.name) && (allowDemoUi || !demoUi.includes(x.name)));
 const h=hash(`${seed}|${text}|${block}|${category}`), total=pool.reduce((n,x)=>n+x.to-x.from+1,0);
 let offset=h%total, r=pool[0]; for(const item of pool){const size=item.to-item.from+1;if(offset<size){r=item;break}offset-=size;}
 const motionId=r.from+offset, filter=r.name==='ChatGPT 3'?MOTION_LIBRARY.chatGPT3Filters[Math.floor((h>>>8)%6)]:r.name;
 return { motionId, motionFamily:family, motionVariant:h%48, motionFilter:filter, motionCategory:category };
}

/** Which catalogue range an id belongs to (for diversity). */
export function rangeOf(id:number):string{ const r=MOTION_LIBRARY.ranges.find(x=>id>=x.from&&id<=x.to); return r?r.name:'?' }
/** ChatGPT 3 has 6 labelled filters of 5,000 ids each (ids 71001-101000), then "Unique Composition" and "Advanced Studio" bands. */
const CG3_FILTER_BY_FAMILY:Record<MotionFamily,number>={typography:1,data:2,line:2,depth:3,particles:5,transition:4,ui:1,abstract:0,saas:1,'image-effects':3};
interface Bucket{ name:string; from:number; to:number; weight:number }
function bucketsFor(family:MotionFamily, allowDemoUi:boolean):Bucket[]{
 const related:Record<MotionFamily,string[]>={typography:['Motion Graphic ChatGPT','ChatGPT 3','Animation ChatGPT'],data:['Motion Graphic ChatGPT','SaaS Explainer','ChatGPT 3','ChatGPT 2'],line:['ChatGPT 2','ChatGPT 3','Motion Graphic ChatGPT'],depth:['Advanced Motion','ChatGPT 3','Animation ChatGPT'],particles:['Animation ChatGPT','ChatGPT 3','Advanced Motion'],transition:['Claude Motion','ChatGPT 3','Advanced Motion'],ui:['Claude Motion','SaaS Explainer','ChatGPT 3'],abstract:['Animation ChatGPT','ChatGPT 3','Advanced Motion'],saas:['SaaS Explainer','Claude Motion','ChatGPT 3'],'image-effects':['Image Effects','ChatGPT 3','Advanced Motion']};
 const out:Bucket[]=[];
 for(const r of MOTION_LIBRARY.ranges){
  if(!related[family].includes(r.name)) continue;
  if(!allowDemoUi && (r.name==='SaaS Explainer'||r.name==='Claude Motion')) continue;
  if(r.name==='ChatGPT 3'){
   const pref=CG3_FILTER_BY_FAMILY[family];
   for(let k=0;k<6;k++) out.push({name:'CG3:'+MOTION_LIBRARY.chatGPT3Filters[k],from:r.from+k*5000,to:r.from+k*5000+4999,weight:k===pref?4:1});
   out.push({name:'CG3:Unique Composition',from:r.from+30000,to:r.from+59999,weight:2});
   out.push({name:'CG3:Advanced Studio',from:r.from+60000,to:r.to,weight:2});
  } else out.push({name:r.name,from:r.from,to:r.to,weight:2});
 }
 return out;
}
const SOFTWARE_RE=/saas|software|startup|dashboard|subscription|\bapp\b|\bapi\b|सॉफ्टवेयर|स्टार्टअप|डैशबोर्ड|सब्सक्रिप्शन|ऐप|एप्लिकेशन/i;
/** n DIFFERENT template ids for one scene, stratified across the catalogue ranges (weighted to the scene's family), deterministic per seed. */
export function candidateMotions(text:string, block:string, category='other', seed='', n=10):number[]{
 const family=familyOf(text,block), buckets=bucketsFor(family,SOFTWARE_RE.test(text));
 const order:Bucket[]=[]; const maxW=Math.max(...buckets.map(b=>b.weight));
 for(let w=maxW;w>=1;w--) for(const b of buckets) if(b.weight>=w) order.push(b); // heavier buckets appear more often per cycle
 const ids:number[]=[], seen=new Set<number>();
 for(let k=0;ids.length<n && k<n*12;k++){
  const b=order[k%order.length], h=hash(`${seed}|${text}|${block}|${category}|c${k}`);
  const id=b.from+(h%(b.to-b.from+1)); if(!seen.has(id)){ seen.add(id); ids.push(id); }
 }
 return ids;
}
