import * as L from './lib.mjs';
const script = `क्या आप जानते हैं कि पैसा समय के साथ खुद बढ़ता है? चक्रवृद्धि ब्याज को दुनिया का आठवाँ अजूबा कहा जाता है। अगर आप 10,000 रुपये हर साल 12% ब्याज पर लगाएँ तो 10 साल में रकम काफी बढ़ जाती है। 2000 में एक निवेशक ने शुरुआत की, और 2020 में उसकी रकम 40 गुना हो गई। पहले बचत करें, फिर निवेश करें, और अंत में धैर्य रखें। सेंसेक्स 1000, 5000 और 20000 अंकों तक पहुँचा। लोग कहते हैं "जल्दी शुरू करो, देर मत करो"। जबकि बचत खाता 3% देता है, म्यूचुअल फंड 12% तक दे सकता है। यही कारण है कि शुरुआत जल्दी करना सबसे ज़रूरी है।`;
const s = L.splitSentences(script); console.log('sentences', s.length); s.forEach((x,i)=>console.log(i, x.slice(0,60)));
// synthetic audio: voiced bursts per sentence with gaps
const sr=16000, dur=40; const x=new Float32Array(sr*dur); let t=0.3;
const w=s.map(a=>[...a.replace(/\s/g,'')].length), W=w.reduce((a,b)=>a+b,0);
const gaps=[]; for(let i=0;i<s.length;i++){ const d=w[i]/W*34; for(let k=Math.floor(t*sr);k<Math.floor((t+d)*sr);k++) x[k]=0.3*Math.sin(k*0.07)*(0.6+0.4*Math.sin(k*0.0009)); t+=d; gaps.push(t+0.15); t+=0.3; }
const info=L.analyzeSamples(x,sr); console.log('silences',info.silences.length,'speech',info.speechStart.toFixed(2),info.speechEnd.toFixed(2));
const al=L.alignScript(s,info);
let maxErr=0; al.scenes.forEach((sc,i)=>{ if(i<s.length-1){ const e=Math.abs(sc.end-gaps[i]); maxErr=Math.max(maxErr,e);} });
console.log('max boundary error (s)',maxErr.toFixed(2),'flags',al.report.flags);
// contiguity
for(let i=1;i<al.scenes.length;i++) if(Math.abs(al.scenes[i].start-al.scenes[i-1].end)>1e-9) throw new Error('gap');
console.log('first',al.scenes[0].start,'last end',al.scenes.at(-1).end.toFixed(2));
const plan=L.planScenes(al.scenes,{mode:'explanation',allow3d:true,title:'चक्रवृद्धि ब्याज'});
plan.forEach(p=>console.log(p.id,p.block,'|',p.reason,'|',JSON.stringify(p.params).slice(0,90)));
const plan2=L.planScenes(al.scenes,{mode:'explanation',allow3d:true,title:'चक्रवृद्धि ब्याज'});
console.log('deterministic', JSON.stringify(plan)===JSON.stringify(plan2));
// LLM parse
const m=L.parseLLMPlan('ok [{"i":1,"block":"stat"},{"i":2,"block":"bogus"},{"i":3,"block":"timeline"}]',s.length); console.log('llm parsed',[...m]);
console.log('llm garbage',L.parseLLMPlan('no json here',5).size);
// mock ctx NaN test
let bad=0, calls=0; const mk=()=>new Proxy({}, {get:(t,k)=>{ if(k==='measureText') return (s)=>({width:String(s).length*14}); if(k==='createLinearGradient'||k==='createRadialGradient') return ()=>({addColorStop(){}}); if(k in t) return t[k]; return (...a)=>{calls++; for(const v of a) if(typeof v==='number'&&!isFinite(v)){bad++; console.log('NaN arg in',String(k),a);} }; }, set:(t,k,v)=>{t[k]=v;return true;}});
for(const b of L.BLOCKS){ for(const mode of ['explanation','documentary']) for(const [w,h] of [[1280,720],[720,1280],[720,720]]){ const sc=plan.map(p=>({...p,block:p.id===0?b:p.block})); const ctx=mk(); for(let tt=0;tt<al.scenes[1].end;tt+=0.25) { try{ L.renderFrame(ctx,w,h,L.planScenes(al.scenes,{mode,allow3d:true}).map((p,i)=>i<3?(L.changeBlock({...p},b==="title"||b==="end"?"callout":b,"T")||p):p),tt,L.THEMES[mode]); }catch(e){ bad++; console.log('ERR',b,mode,w,h,tt,e.message); break; } } } }
console.log('mock render calls',calls,'bad',bad);
