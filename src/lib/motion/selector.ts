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
