// @ts-nocheck
// Motion Pro generator (171,000 CSS-animation templates), ported 1:1 from the user's MOTION_PRO_171K file (generator code only, UI removed).
// Pure string generation: spec(i) -> stage HTML. No DOM, no network. The app edits a template by temporarily swapping the copy arrays (see index.ts).
export function makeMotionPro(): any {
const PAL=[
['#070b14','#0f1b33','#4f8cff','#7be0ff','#ffffff',1],['#0b0805','#24120a','#ff7a1a','#ffc24d','#ffffff',1],
['#04100c','#0a2a1f','#2ee59d','#b6ffd9','#ffffff',1],['#0d0716','#25104a','#9b6bff','#ff7ad9','#ffffff',1],
['#12060a','#2f0b17','#ff4d6d','#ffb3c1','#ffffff',1],['#0a0a0a','#1c1708','#f5c451','#fff1c1','#ffffff',1],
['#f6f8ff','#e4ebff','#2f5bff','#00c2a8','#0b1230',0],['#fbf6ee','#f1e5d0','#e8590c','#2b8a3e','#1f1608',0],
['#f1fff8','#d4f7e6','#0ca678','#4263eb','#06261b',0],['#0f172a','#1e293b','#38bdf8','#f472b6','#f8fafc',1],
['#031a1d','#0a3b40','#00d1c1','#ff9f43','#ffffff',1],['#000000','#141414','#ffffff','#9a9a9a','#ffffff',1],
['#fff0f6','#ffd6e8','#e64980','#7048e8','#2a0a18',0],['#1a0b2e','#4a1942','#ff6b6b','#ffd93d','#ffffff',1]];
const EASE=['cubic-bezier(.16,1,.3,1)','cubic-bezier(.34,1.4,.64,1)','cubic-bezier(.22,1,.36,1)','cubic-bezier(.5,0,.2,1)'];
const HEAD=[["अमीर बनने का","सबसे आसान","तरीका"],["महंगाई","क्यों बढ़ती है?"],["Build Your","Wealth Faster"],["Smart Money","Habits"],["AI से बदलेगी","आपकी दुनिया"],["10 हजार में","शुरू करो बिज़नेस"],["Think Different","Act Bold"],["दिमाग का","सबसे बड़ा धोखा"],["Your Growth","Starts Today"],["सच जो कोई","नहीं बताता"],["Dare to Be","Different"],["Save More","Spend Smart"],["पैसा कैसे","काम करता है"],["Level Up","Your Skills"],["नया साल","नए लक्ष्य"],["Master Your","Mindset"]];
const EYE=["Fireroz Media","Money Tips","AI Update","Fact Check","बिज़नेस आइडिया","Growth","Mindset","Learn","Trending","पर्सनल फाइनेंस"];
const SUBS=["सिर्फ 60 सेकंड में समझिए","Simple. Clear. Powerful.","आज से ही शुरू करें","Dare to Be Different!","पूरा वीडियो ज़रूर देखें","Watch till the end","Step by step guide","आसान भाषा में"];
const STATS=[["महंगाई दर","",6,"%"],["Savings Rate","",32,"%"],["Monthly SIP","₹",5000,""],["Total Users","",120,"K+"],["Growth","",3,"x"],["सालाना रिटर्न","",12,"%"],["Revenue","₹",85,"L"],["Views","",250,"K"],["Followers","",18,"K"],["कुल बचत","₹",10000,""],["Success Rate","",94,"%"],["Profit","₹",45,"K"]];
const MONTHS=[["Jan","Feb","Mar","Apr","May","Jun","Jul"],["सोम","मंगल","बुध","गुरु","शुक्र","शनि","रवि"],["Q1","Q2","Q3","Q4","Q5","Q6","Q7"]];
const YEARS=["2020","2021","2022","2023","2024","2025","2026"];
const TLYEARS=[];
const STEPS=["बजट बनाओ","बचत करो","निवेश करो","खर्च कम करो","लक्ष्य तय करो","रोज़ सीखो","Plan Ahead","Save First","Invest Early","Track Everything"];
const TITLES=["Monthly Growth","Revenue Trend","बचत का ग्राफ","Channel Views","निवेश की रफ़्तार","User Growth","Net Worth","महंगाई का असर"];
const BN=["Income","Savings","Invest","Spend","Debt","Profit"];
const IC={
chart:["M3 3v18h18M7 15l4-4 3 3 5-6","ग्रोथ"],wallet:["M3 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 7l2-3h12M16 14h2","बचत"],
shield:["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4","सुरक्षा"],bulb:["M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z","आइडिया"],
target:["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 12h.01","फोकस"],rocket:["M5 19l3-1 8-8c2-2 3-5 3-6-1 0-4 1-6 3l-8 8zM9 15l-3 3M14 10h.01","स्पीड"],
gear:["M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2","Automation"],
users:["M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 8a3 3 0 0 1 0 5M21 19c0-2-1-3-3-4","Community"],
clock:["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2","समय"],book:["M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 19V5M8 7h7","सीख"],
coin:["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9 9h6M9 12h6M11 9c4 0 4 5 0 5l4 3","पैसा"],bag:["M5 8h14l-1 12H6zM9 8a3 3 0 0 1 6 0","बिज़नेस"],
trend:["M4 16l6-6 4 4 6-8M15 6h5v5","Trend"],phone:["M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2","Mobile"],
eye:["M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z","Vision"]};
const ICN=Object.keys(IC);
const VSP=[["अमीर","मिडिल क्लास"],["Before","After"],["पहले","अब"],["Saver","Investor"],["Myth","Fact"],["मेहनत","स्मार्ट वर्क"]];
const LTS=[["Fireroz Media","Dare to Be Different!"],["Rahul Sharma","Finance Expert"],["AI Tools Review","By Fireroz"],["Priya Verma","Business Coach"],["मनी मंत्र","सरल भाषा में"],["Amit Kumar","Startup Mentor"]];
const QUO=["पैसा कमाना आसान है, रखना मुश्किल।","Small steps every day build big results.","जो रिस्क नहीं लेता, वो कुछ नहीं पाता।","Discipline beats motivation.","Your mindset is your biggest asset.","सोच बदलो, ज़िंदगी बदल जाएगी।"];
const CTAS=[["पसंद आया?","Subscribe","Subscribed"],["Enjoyed this?","Follow","Following"],["और जानना है?","Subscribe","Subscribed"],["Don't miss out","Follow","Following"]];
const PROG=[["Analyzing data","Building model","Optimizing results"],["डेटा जांच","योजना तैयार","नतीजे तैयार"]];
const TYPES=['Headline','Stat','Line chart','Bar chart','Donut','Steps','Icon grid','Versus','Lower third','Geometric','Quote','Timeline','Network','Subscribe','Progress','SaaS Dashboard','SaaS Features','SaaS Onboarding','SaaS Automation','SaaS Pricing','SaaS Analytics','SaaS CRM','SaaS Teamwork','SaaS AI Assistant','SaaS Subscription','Line Draw','Pie Chart','Time Travel','Kinetic Typography','Orbit Motion','Particle Burst','Waveform','Route Map','Morph Shapes','Radar Scan','Loading System'];
const CATS=['All','Typography','Data','Layout','Broadcast','Motion Graphic ChatGPT','Animation ChatGPT'];
const CATOF=['Typography','Data','Data','Data','Data','Layout','Layout','Layout','Broadcast','Typography','Typography','Layout','Layout','Broadcast','Data'];

function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let SEED=0;
function baseSpec(i){
  const r=rng((Math.imul(i,2654435761))^(SEED*97531+11));
  const pk=a=>a[Math.floor(r()*a.length)],rn=(a,b)=>a+r()*(b-a),ri=n=>Math.floor(r()*n);
  const s={i,t:ri(15),pal:pk(PAL),bgv:ri(8),ease:pk(EASE),ain:pk(['a0','a1','a2','a3','a4','a5','a7']),cam:'cam'+ri(4),out:'o'+ri(4)};
  s.T=+rn(5.2,7).toFixed(1);s.t0=+rn(.15,.45).toFixed(2);s.st=+rn(.1,.18).toFixed(2);
  s.cat=CATOF[s.t];s.left=r()<.35;s.hs=+rn(11,14.5).toFixed(1);s.hlv=ri(4);
  s.bs=+rn(22,30).toFixed(1);s.up=r()<.72;s.fxc=r()<.7;s.fxh=r()<.8;s.fxs=r()<.45;
  s.seed=ri(1e6);s.eye=pk(EYE);s.sub=pk(SUBS);s.head=pk(HEAD);s.hi=s.head.length-1-(r()<.3&&s.head.length>2?1:0);
  s.stat=pk(STATS);s.delta=(rn(2,24)).toFixed(1);
  return s;
}

const SAAS_NAMES=['SaaS Dashboard Explained','App Feature Walkthrough','SaaS Onboarding Flow','Automation Workflow','Pricing Plan Explainer','Analytics & Growth','CRM Pipeline Demo','Team Collaboration App','AI SaaS Assistant','Subscription Business Model'];
const SAAS_COPY=[
 ['Live overview','Monthly revenue','Active users','Conversion'],['One workspace','Everything in one place','Fast setup','Easy to use'],['Create account','Set up workspace','Invite your team','Launch your app'],['Trigger','Automation rules','Action completed','Time saved'],['Starter','Pro','Business','Choose your plan'],['Visitors','Sign ups','Activation','Revenue'],['New lead','Qualified','Proposal sent','Customer won'],['Share updates','Assign tasks','Track progress','Ship together'],['Ask AI','Get instant answer','Generate report','Save hours'],['Free trial','Convert users','Recurring revenue','Grow monthly']
];
function saasSpec(i){
 const r=rng((Math.imul(i,2246822519))^(SEED*7919+37));
 const pk=a=>a[Math.floor(r()*a.length)],rn=(a,b)=>a+r()*(b-a),ri=n=>Math.floor(r()*n);
 const t=15+((i-10001)%10);
 return {i,t,pal:pk(PAL),seed:ri(1e6),ease:pk(EASE),ain:pk(['a0','a1','a2','a3','a4']),cam:'cam'+ri(4),out:'o'+ri(4),T:+rn(6,8).toFixed(1),t0:+rn(.12,.3).toFixed(2),st:+rn(.12,.2).toFixed(2),cat:'Motion Graphic ChatGPT',left:false,hs:12,hlv:ri(4),bs:25,fxc:true,fxh:true,fxs:r()<.5,eye:'SAAS EXPLAINER',head:pk(HEAD),sub:pk(SUBS),saasIndex:(i-10001)%10,variant:Math.floor((i-10001)/10)};
}
const ANIM_NAMES=["Line Draw", "Pie Chart", "Time Travel", "Kinetic Text", "Orbit", "Particle Burst", "Waveform", "Route Path", "Shape Morph", "Radar Scan", "Click Ripple", "Mouse Pointer Click", "Running Line", "Circle Draw", "Circle Pulse", "Arrow Move", "Dotted Path", "Progress Bar", "Loading Dots", "Number Counter", "Bar Growth", "Area Chart Draw", "Donut Progress", "Map Pin Drop", "Zoom In", "Zoom Out", "Flash Highlight", "Underline Draw", "Bracket Focus", "Check Mark Draw", "Cross Mark Draw", "Equalizer", "Sound Pulse", "Rotating Ring", "Dashed Line", "Vertical Line", "Horizontal Line", "Moving Dashed Border", "Funnel Flow", "Network Connect"];
TYPES.splice(25,TYPES.length-25,...ANIM_NAMES);
function animationSpec(i){const j=i-11001,ix=j%ANIM_NAMES.length,r=rng((Math.imul(i,3266489917))^(SEED*104729+71)),pk=a=>a[Math.floor(r()*a.length)],ri=n=>Math.floor(r()*n);return {i,t:25+ix,pal:pk(PAL),seed:ri(1e6),ease:pk(EASE),ain:pk(["a0","a1","a2","a3","a4"]),cam:"cam"+ri(4),out:"o"+ri(4),T:+(5.5+r()*2.8).toFixed(1),t0:+(.1+r()*.3).toFixed(2),st:+(.1+r()*.18).toFixed(2),cat:"Animation ChatGPT",left:false,hs:12,hlv:ri(4),bs:25,fxc:false,fxh:false,fxs:false,eye:"",head:[],sub:"",animIndex:ix,variant:Math.floor(j/ANIM_NAMES.length),seed2:ri(99999)}}

function bodySaas(s,r){
 const ix=s.saasIndex,words=SAAS_COPY[ix],name=SAAS_NAMES[ix],A0=(k,h)=>A(s,k,h,'saas-in');
 const top=`<div class="saas-top"><span class=saas-brand><i class=saas-logo></i>${['FlowDesk','Launchly','OrbitOS','Nexa','CloudBase'][s.variant%5]}</span><span class=saas-pill>PRODUCT TOUR</span></div>`;
 const title=`<div class=saas-title>${name}</div><div class=saas-sub>${['A complete product walkthrough in motion.','See how the platform turns complex work into simple steps.','From first click to measurable growth.'][s.variant%3]}</div>`;
 const kpi=(label,val)=>`<div class=saas-kpi><small>${label}</small><b>${val}</b></div>`;
 const step=(n,txt,sub)=>`<div class=saas-step><span class=saas-num>${n}</span><div><b>${txt}</b><small>${sub}</small></div><span class=saas-pill>DONE</span></div>`;
 let content='';
 if(ix===0){content=`<div class=saas-panel><div class=saas-row>${kpi('MRR','$24.8K')}${kpi('Users','8,420')}${kpi('Growth','+32%')}</div><div class=saas-row style="justify-content:space-between;margin-top:3cqmin"><b style="font-size:3.3cqmin">Revenue overview</b><span class=saas-pill>+18.6%</span></div><div class=saas-bars>${[35,52,44,70,60,82,96].map((v,k)=>`<i style="--v:${v}%;--d:${dly(s,k+3)}s"></i>`).join('')}</div></div>`;}
 else if(ix===1){content=`<div class=saas-panel><div class=saas-top><b style="color:var(--f)">Everything you need</b><span>01 / 04</span></div>${[['✦','Smart dashboard','All key numbers in one view'],['↗','Powerful analytics','Understand what drives growth'],['⚡','One-click automation','Remove repetitive work'],['◎','Team workspace','Keep everyone in sync']].map((x,k)=>`<div class=saas-feature style="--d:${dly(s,k+2)}s"><span class=saas-icon>${x[0]}</span><div><b>${x[1]}</b><small>${x[2]}</small></div></div>`).join('')}</div>`;}
 else if(ix===2){content=`<div class=saas-panel style="display:flex;flex-direction:column;gap:2cqmin"><div class=saas-top><b style="color:var(--f)">Get started in minutes</b><span>SETUP</span></div>${step('1',words[0],'Your secure workspace is ready')}${step('2',words[1],'Add your brand and preferences')}${step('3',words[2],'Bring your people together')}${step('4',words[3],'You are ready to grow')}</div>`;}
 else if(ix===3){content=`<div style="display:flex;flex-direction:column;gap:1cqmin"><div class=saas-node>NEW FORM SUBMITTED</div><div class=saas-connector></div><div class=saas-node>CHECK LEAD DETAILS</div><div class=saas-connector></div><div class=saas-row><div class=saas-node style="flex:1">SEND EMAIL</div><div class=saas-node style="flex:1">UPDATE CRM</div></div><div class=saas-connector></div><div class=saas-node style="border-color:var(--a)">WORKFLOW COMPLETE ✓</div></div>`;}
 else if(ix===4){content=`<div class=saas-row style="align-items:stretch"><div class=saas-panel style="flex:1"><span class=saas-pill>STARTER</span><div class=saas-price>$9</div><div class=saas-sub>per user / month</div><p class=saas-sub>Core tools for getting started</p><div class=saas-button>Choose Starter</div></div><div class=saas-panel saas-pulse style="flex:1;border-color:var(--a)"><span class=saas-pill>POPULAR</span><div class=saas-price>$29</div><div class=saas-sub>per user / month</div><p class=saas-sub>Advanced tools to scale</p><div class=saas-button>Choose Pro</div></div></div>`;}
 else if(ix===5){content=`<div class=saas-panel><div class=saas-top><b style="color:var(--f)">Growth funnel</b><span>LAST 30 DAYS</span></div>${[['Visitors','100%'],['Sign ups','72%'],['Activated','48%'],['Paid users','26%']].map((x,k)=>`<div style="margin-top:2.5cqmin"><div class=saas-top><span>${x[0]}</span><b style="color:var(--f)">${x[1]}</b></div><div class=saas-track><i style="--w:${parseInt(x[1])}%;--d:${dly(s,k+2)}s"></i></div></div>`).join('')}</div>`;}
 else if(ix===6){content=`<div class=saas-panel style="display:flex;gap:1.5cqmin;align-items:stretch">${[['NEW','12'],['QUALIFIED','8'],['WON','4']].map((x,k)=>`<div style="flex:1;background:var(--ln);border-radius:2cqmin;padding:2cqmin"><div class=saas-top>${x[0]}</div><div class=saas-price style="font-size:7cqmin">${x[1]}</div>${[0,1].slice(0,k+1).map((_,j)=>`<div class=saas-feature><i class=saas-person>${['A','M','R'][j]}</i></div>`).join('')}</div>`).join('')}</div>`;}
 else if(ix===7){content=`<div class=saas-panel><div class=saas-top><b style="color:var(--f)">Team workspace</b><span>4 MEMBERS ONLINE</span></div>${[['A','Design system updated','2 min ago'],['M','Sprint tasks assigned','10 min ago'],['R','New release shipped','1 hr ago']].map((x,k)=>`<div class=saas-feature><i class=saas-person>${x[0]}</i><div><b>${x[1]}</b><small>${x[2]}</small></div><span class=saas-pill>✓</span></div>`).join('')}</div>`;}
 else if(ix===8){content=`<div class=saas-panel><div class=saas-row><span class=saas-icon>✦</span><b style="font-size:3.6cqmin">AI Assistant</b><span class=saas-pill>ONLINE</span></div><div class=saas-sub style="margin:3cqmin 0">How can I help your team today?</div><div class=saas-step><span class=saas-num>AI</span><div><b>Here is your weekly report</b><small>Revenue is up 18%. I found 3 growth opportunities.</small></div></div><div class=saas-track style="margin-top:3cqmin"><i style="--w:86%;--d:${dly(s,4)}s"></i></div></div>`;}
 else {content=`<div class=saas-panel><div class=saas-top><b style="color:var(--f)">Subscription growth</b><span>MONTHLY</span></div><div class=saas-row>${kpi('New trials','1,240')}${kpi('Conversions','312')}</div><div class=saas-bars>${[28,36,48,42,66,78,96].map((v,k)=>`<i style="--v:${v}%;--d:${dly(s,k+2)}s"></i>`).join('')}</div><div class=saas-row><span class=saas-pill>RECURRING REVENUE</span><b style="font-size:5cqmin">+$12.4K</b></div></div>`;}
 return `<div class=saas-wrap>${A0(0,top)}${A0(1,title)}${A0(3,content)}${A(s,8,`<div class=saas-row style="justify-content:space-between"><span class=saas-sub>${words[0]} → ${words[3]}</span><span class=saas-button>EXPLORE PRODUCT ↗</span></div>`,'saas-in')}</div>`;
}

const dly=(s,k)=>+(s.t0+k*s.st).toFixed(2);
function A(s,k,html,cls,extra){return `<div class="a ${cls||''}" style="--d:${dly(s,k)}s;${extra||''}">${html}</div>`}
function H(s,lines,k0){
  const cl=['hl','ac','gt','ul'][s.hlv];
  return `<div class=h style="--hs:${s.hs}cqmin">`+lines.map((t,j)=>{
    const d=dly(s,k0+j);
    return `<div class=ln><div class=wr style="--d:${d}s">${j===s.hi?`<span class="${cl}" style="--d:${(d+.5).toFixed(2)}s">${t}</span>`:t}</div></div>`}).join('')+'</div>';
}
function smooth(p){let d=`M${p[0][0]} ${p[0][1]}`;for(let i=0;i<p.length-1;i++){const p0=p[i-1]||p[i],p1=p[i],p2=p[i+1],p3=p[i+2]||p2;d+=`C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)} ${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)} ${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0]} ${p2[1]}`}return d}
function series(r,n,up){const p=[];let v=up?.2:.8;for(let k=0;k<n;k++){v+=(up?1:-1)*(.08+r()*.1)+(r()-.5)*.18;v=Math.max(.08,Math.min(.95,v));p.push([+(k*100/(n-1)).toFixed(1),+(56-v*50).toFixed(1)])}return p}
function chartSVG(s,r,full){
  const p=series(r,7,s.up),d=smooth(p),L=p[6],b=s.t0+.3;
  const grid=full?[8,22,36,50].map(y=>`<line class=gl x1=0 x2=100 y1=${y} y2=${y} />`).join(''):'';
  const dots=full?p.map((q,k)=>`<circle class=dot cx=${q[0]} cy=${q[1]} r=1.6 style="--d:${(b+1+k*.2).toFixed(2)}s" />`).join(''):'';
  return `<svg class=ch viewBox="0 0 100 62"><defs><linearGradient id=g${s.i} x1=0 y1=0 x2=0 y2=1><stop offset=0 style="stop-color:var(--a);stop-opacity:.42" /><stop offset=1 style="stop-color:var(--a);stop-opacity:0" /></linearGradient></defs>${grid}${full?`<path class=ar d="${d}L100 60L0 60Z" fill="url(#g${s.i})" style="--d:${b}s" />`:''}<path class=lp2 pathLength=1 d="${d}" style="--d:${b}s" />${dots}<circle class=pu cx=${L[0]} cy=${L[1]} r=2 style="--d:${(b+2.4).toFixed(2)}s" /></svg>`;
}
function icon(n,d2){return `<svg class=ic viewBox="0 0 24 24" style="--d2:${d2}s"><path pathLength=1 d="${IC[n][0]}" /></svg>`}
function cnt(v){return `<span class=cnt style="--n:${v}"></span>`}
function eyeChip(s,k){return A(s,k,`<span class=chip><i></i>${s.eye}</span>`)}

function bodyAnimation(s){
 const ix=s.animIndex,v=s.variant,accent='var(--a)',dur=1.8+(v%5)*.18;
 const svg=(inner)=>`<svg class="simple-svg" viewBox="0 0 320 180" aria-hidden="true">${inner}</svg>`;
 const path=(d)=>svg(`<path class="simple-draw" pathLength="1" d="${d}"/>`);
 let visual='';
 switch(ix){
 case 0: visual=path('M12 145 C55 140 55 30 105 65 S165 150 210 75 S270 25 308 18');break;
 case 1: visual=`<div class="simple-pie" style="--p:${35+(v*7)%60}%"></div>`;break;
 case 2: visual=`<div class="simple-timeline"><i></i><b>1995</b><b>2026</b><b>2050</b></div>`;break;
 case 3: visual=`<div class="simple-words"><b>THINK</b><b>CREATE</b><b>MOVE</b></div>`;break;
 case 4: visual=`<div class="simple-orbit"><i></i><b></b><em></em></div>`;break;
 case 5: visual=`<div class="simple-particles">${Array.from({length:28},(_,k)=>`<i style="--x:${(k*37+v*13)%96}%;--y:${(k*53+v*7)%90}%;--d:${k%8*.09}s"></i>`).join('')}</div>`;break;
 case 6: visual=`<div class="simple-wave">${Array.from({length:36},(_,k)=>`<i style="--h:${15+(k*29+v*11)%85}%;--d:${k*.025}s"></i>`).join('')}</div>`;break;
 case 7: visual=path('M15 145 Q75 15 142 90 T305 25');break;
 case 8: visual=`<div class="simple-morph"></div>`;break;
 case 9: visual=`<div class="simple-radar"><i></i><b></b></div>`;break;
 case 10: visual=`<div class="simple-click"><i></i><b></b></div>`;break;
 case 11: visual=`<div class="simple-cursor">➤</div>`;break;
 case 12: visual=`<div class="simple-runline"><i></i></div>`;break;
 case 13: visual=svg('<circle class="simple-circle" cx="160" cy="90" r="55"/>');break;
 case 14: visual=`<div class="simple-pulse-circle"></div>`;break;
 case 15: visual=svg('<path class="simple-draw" pathLength="1" d="M40 90H270 M235 55L270 90L235 125"/>');break;
 case 16: visual=svg('<path class="simple-dotted" d="M20 140 Q90 10 160 90 T300 30"/>');break;
 case 17: visual=`<div class="simple-progress"><i style="--w:${35+(v*13)%65}%"></i></div>`;break;
 case 18: visual=`<div class="simple-dots"><i></i><i></i><i></i></div>`;break;
 case 19: visual=`<div class="simple-counter">${(1200+v*37).toLocaleString('en-US')}</div>`;break;
 case 20: visual=`<div class="simple-bars">${[35,65,45,90,58,78].map((h,k)=>`<i style="--h:${h}%;--d:${k*.12}s"></i>`).join('')}</div>`;break;
 case 21: visual=path('M12 145 L55 115 L100 125 L150 60 L205 85 L260 35 L308 48');break;
 case 22: visual=`<div class="simple-donut" style="--p:${25+(v*9)%70}%"></div>`;break;
 case 23: visual=`<div class="simple-pin">●</div>`;break;
 case 24: visual=`<div class="simple-zoom">+</div>`;break;
 case 25: visual=`<div class="simple-zoom out">−</div>`;break;
 case 26: visual=`<div class="simple-highlight">IMPORTANT</div>`;break;
 case 27: visual=`<div class="simple-underline">KEY POINT</div>`;break;
 case 28: visual=svg('<path class="simple-draw" pathLength="1" d="M85 45H55V135H85 M235 45H265V135H235"/>');break;
 case 29: visual=svg('<path class="simple-check" d="M90 95L140 140L235 42"/>');break;
 case 30: visual=svg('<path class="simple-cross" d="M110 45L210 145 M210 45L110 145"/>');break;
 case 31: visual=`<div class="simple-wave">${Array.from({length:24},(_,k)=>`<i style="--h:${20+(k*31)%80}%;--d:${k*.04}s"></i>`).join('')}</div>`;break;
 case 32: visual=`<div class="simple-soundpulse"><i></i><b></b><em></em></div>`;break;
 case 33: visual=`<div class="simple-ring"></div>`;break;
 case 34: visual=svg('<path class="simple-dashed" d="M20 90H300"/>');break;
 case 35: visual=svg('<path class="simple-draw" pathLength="1" d="M160 15V165"/>');break;
 case 36: visual=svg('<path class="simple-draw" pathLength="1" d="M20 90H300"/>');break;
 case 37: visual=`<div class="simple-border"></div>`;break;
 case 38: visual=`<div class="simple-funnel"><i></i><i></i><i></i></div>`;break;
 default: visual=svg('<path class="simple-draw" pathLength="1" d="M40 90L120 35L200 120L280 45 M120 35L200 120"/>');
 }
 return `<div class="simple-animation" style="--simple-duration:${dur}s">${visual}</div>`;
}
function body(s,r){
  const pk=a=>a[Math.floor(r()*a.length)],ri=n=>Math.floor(r()*n);
  const sh=a=>a.map(v=>[r(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
  let h='';
  switch(s.t){
  case 0:
    h=eyeChip(s,0)+H(s,s.head,1)+A(s,s.head.length+1,s.sub,'sub')+A(s,s.head.length+2,'','rule','width:22cqmin');break;
  case 1:{
    const [lb,pre,v,suf]=s.stat;
    h=eyeChip(s,0)+A(s,1,lb,'lbl')+A(s,2,`<div class=big style="--bs:${s.bs}cqmin">${pre?`<small>${pre}</small>`:''}${cnt(v).replace('class=cnt','class=cnt style="--d:'+dly(s,2)+'s;--n:'+v+'"').replace(' style="--n:'+v+'"','')}${suf?`<small>${suf}</small>`:''}</div>`,'')
      +A(s,3,`<span class=pill><svg viewBox="0 0 24 24"><path d="M5 15l5-5 4 4 5-7M15 7h4v4"/></svg>+${s.delta}%</span>`)
      +A(s,4,`<div class=w style="max-width:70cqmin">${chartSVG(s,r,false)}</div>`);break;}
  case 2:{
    const m=pk(MONTHS),v=[ri(80)+20,pk(['K','%','L'])];
    h=A(s,0,`<div class=card><div class=hd><div><div class=lbl>${pk(TITLES)}</div><div class=big style="--bs:12cqmin"><span class=cnt style="--n:${v[0]};--d:${dly(s,1)}s"></span><small>${v[1]}</small></div></div><span class=pill>+${s.delta}%</span></div>${chartSVG(s,r,true)}<div class=xl>${m.map(x=>`<span>${x}</span>`).join('')}</div></div>`,'w');break;}
  case 3:{
    const n=5+ri(2),vals=[...Array(n)].map(()=>.25+r()*.75),mx=vals.indexOf(Math.max(...vals)),names=pk([YEARS.slice(2,2+n),BN.slice(0,n)]);
    h=A(s,0,`<div class=card><div class=hd><div><div class=lbl>${pk(TITLES)}</div><div class=big style="--bs:11cqmin"><span class=cnt style="--n:${Math.round(vals[mx]*100)};--d:${dly(s,1)}s"></span><small>%</small></div></div></div><div class=bars>${vals.map((v,k)=>`<div class=bc><span class=bv>${Math.round(v*100)}</span><div class="bar ${k===mx?'hi':''}" style="--h:${v.toFixed(2)};--d:${dly(s,k+2)}s"></div></div>`).join('')}</div><div class=xl>${names.map(x=>`<span style="flex:1;text-align:center">${x}</span>`).join('')}</div></div>`,'w');break;}
  case 4:{
    let a=30+ri(40),b=10+ri(25),c=100-a-b;if(c<8){c=8;b=100-a-c}
    const segs=[[a,'var(--a)',pk(["Savings","बचत","Core"])],[b,'var(--b)',pk(["Invest","निवेश","Growth"])],[c,'var(--f)',pk(["Spend","खर्च","Other"])]];
    let off=0;const arcs=segs.map((g,k)=>{const e=`<circle class=sg cx=50 cy=50 r=38 pathLength=100 stroke="${g[1]}" stroke-dasharray="${g[0]-1.4} 100" stroke-dashoffset="${-off}" style="--d:${dly(s,k+1)}s" />`;off+=g[0];return e}).join('');
    h=A(s,0,`<span class=chip><i></i>${s.eye}</span>`)+A(s,1,`<div class="card" style="display:flex;align-items:center;gap:4cqmin;flex-wrap:wrap;justify-content:center"><div class=dnw><svg viewBox="0 0 100 100"><circle class=tk cx=50 cy=50 r=38 />${arcs}</svg><div class=dc><span class=cnt style="--n:${a};--d:${dly(s,2)}s"></span><small>%</small></div></div><div class=lg>${segs.map((g,k)=>`<div class=lgr style="--d:${dly(s,k+3)}s"><i style="background:${g[1]}"></i>${g[2]}<b>${g[0]}%</b></div>`).join('')}</div></div>`,'w');break;}
  case 5:{
    const it=sh(STEPS).slice(0,4);
    h=eyeChip(s,0)+H(s,s.head.slice(0,2),1)+`<div class=w style="display:flex;flex-direction:column;gap:2.4cqmin">`+it.map((t,k)=>A(s,k+3,`<div class=row><div class=nm>${k+1}</div><div class=rt>${t}</div><svg class=ck viewBox="0 0 24 24" style="--d2:${(dly(s,k+3)+.6).toFixed(2)}s"><path pathLength=1 d="M5 12l5 5 9-10"/></svg></div>`,'','--ain:'+(k%2?'a1r':'a1'))).join('')+'</div>';break;}
  case 6:{
    const n=pk([4,4,6]),ks=sh(ICN).slice(0,n);
    h=eyeChip(s,0)+H(s,s.head.slice(0,2),1)+`<div class="tg w">`+ks.map((k,j)=>A(s,j+3,`<div class="card tile">${`<div class=icw>${icon(k,(dly(s,j+3)+.4).toFixed(2))}</div>`}<div class=tn>${IC[k][1]}</div></div>`,'','--ain:a2')).join('')+'</div>';break;}
  case 7:{
    const [x,y]=pk(VSP),va=pk(["₹5L","₹8L","20%","3x"]),vb=pk(["₹50L","₹1Cr","70%","12x"]);
    h=eyeChip(s,0)+`<div class="vs w">`+A(s,1,`<div class="card vc"><div class=vt>${x}</div><div class=vn>${va}</div></div>`,'','--ain:a1')+A(s,2,`<div class="card vc hi"><div class=vt>${y}</div><div class=vn>${vb}</div></div>`,'','--ain:a1r')+`<div class=vb style="--d:${dly(s,3)}s">VS</div></div>`;break;}
  case 8:{
    const [n,ro]=pk(LTS),v=ri(2);
    h=`<div class=lt style="align-self:flex-start"><div class=lb style="--d:${dly(s,0)}s"></div><div class=lp3 style="--d:${dly(s,1)}s"><div class=ln style="padding:0"><div class="wr ltn" style="--d:${dly(s,2)}s">${n}</div></div>${A(s,4,`<span class=ltr>${ro}</span>`,'','--ain:a0')}</div></div>`;break;}
  case 9:{
    const rings=[40,31,22].map((rr,k)=>`<circle class=rg pathLength=1 cx=50 cy=50 r=${rr} style="--d:${dly(s,k)}s" />`).join('');
    let ticks='';for(let k=0;k<48;k++){const an=k*7.5,c=Math.cos(an*Math.PI/180),sn=Math.sin(an*Math.PI/180);ticks+=`<line x1=${(50+c*44).toFixed(2)} y1=${(50+sn*44).toFixed(2)} x2=${(50+c*(k%4?45.4:47.5)).toFixed(2)} y2=${(50+sn*(k%4?45.4:47.5)).toFixed(2)} />`}
    h=`<svg class=geo viewBox="0 0 100 100">${rings}<g class="sp s1"><circle cx=50 cy=50 r=46 style="stroke-dasharray:.6 2.2" /></g><g class="sp s2 t">${ticks}</g></svg>`+eyeChip(s,1)+H(s,s.head.slice(0,2),2)+A(s,5,s.sub,'sub');break;}
  case 10:{
    const q=pk(QUO);
    h=A(s,0,`<svg class=qm viewBox="0 0 48 36"><path d="M0 36V20C0 8 6 2 18 0v6C12 8 10 12 10 16h8v20zM28 36V20C28 8 34 2 46 0v6c-6 2-8 6-8 10h8v20z"/></svg>`,'','--ain:a2')
      +`<div class=h style="--hs:${(s.hs*.62).toFixed(1)}cqmin;font-weight:750">`+q.split(' ').map((w,k)=>`<span style="display:inline-block;overflow:hidden;padding:.05em .12em .14em;vertical-align:top"><span class=wr style="display:inline-block;--d:${dly(s,k*.35+1)}s">${w}</span></span>`).join(' ')+'</div>'
      +A(s,5,`<div class=qa><i style="--d:${dly(s,5)}s"></i>${s.eye}</div>`);break;}
  case 11:{
    const it=TLYEARS.length?STEPS.slice(0,TLYEARS.length):sh(STEPS).slice(0,4),yr=ri(3)+2020;
    h=H(s,s.head.slice(0,2),0)+`<div class="tl w" style="--d:${dly(s,2)}s">`+it.map((t,k)=>A(s,k+3,`<div class=ti><small>${TLYEARS.length?TLYEARS[k]:yr+k}</small><div>${t}</div></div>`,'','--ain:a1')).join('')+'</div>';break;}
  case 12:{
    const n=5,ks=sh(ICN).slice(0,n);let ln='',nd='';
    ks.forEach((k,j)=>{const an=-90+j*72,x=50+Math.cos(an*Math.PI/180)*34,y=50+Math.sin(an*Math.PI/180)*34,d=dly(s,j+1);
      ln+=`<line pathLength=1 x1=50 y1=50 x2=${x.toFixed(1)} y2=${y.toFixed(1)} style="--d:${d}s" />`;
      nd+=`<circle class=nd cx=${x.toFixed(1)} cy=${y.toFixed(1)} r=8 style="--d:${(d+.5).toFixed(2)}s" /><text x=${x.toFixed(1)} y=${(y+1.3).toFixed(1)} style="opacity:1">${IC[k][1].slice(0,9)}</text>`});
    h=`<svg class=net viewBox="0 0 100 100"><circle class=pu cx=50 cy=50 r=11 />${ln}<circle class="nd cn" cx=50 cy=50 r=11 style="--d:${dly(s,0)}s" /><text x=50 y=51.4 style="fill:var(--on)">${pk(["AI","पैसा","Core","Hub"])}</text>${nd}</svg>`;break;}
  case 13:{
    const [q,a,b]=pk(CTAS);
    const bell='<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/></svg>',chk='<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>';
    h=H(s,[q],0)+A(s,2,`<div class=cta><i class=rp style="--d:${dly(s,2)}s"></i><div class=btn style="--d:${dly(s,2)}s"><div class=sz>${bell}${b}</div><div class=s1>${bell}${a}</div><div class=s2>${chk}${b}</div></div><svg class=curs viewBox="0 0 24 24" style="--d:${dly(s,3)}s"><path d="M4 2l16 9-7 2-3 7z"/></svg></div>`,'')+A(s,4,s.sub,'sub');
    break;}
  default:{
    const st=pk(PROG);
    h=eyeChip(s,0)+A(s,1,`<div class=big style="--bs:${s.bs}cqmin"><span class=cnt style="--n:100;--d:${dly(s,1)}s"></span><small>%</small></div>`)+A(s,2,`<div class=pbar><i style="--d:${dly(s,2)}s"></i></div>`,'w')
      +`<div class=w style="display:flex;flex-direction:column;gap:2cqmin">`+st.map((t,k)=>A(s,k+3,`<div class=row style="padding:2.4cqmin 3cqmin"><div class=rt style="font-size:3.8cqmin">${t}</div><svg class=ck viewBox="0 0 24 24" style="width:5cqmin;height:5cqmin;--d2:${(1.2+k*1.0+s.t0).toFixed(2)}s"><path pathLength=1 d="M5 12l5 5 9-10"/></svg></div>`)).join('')+'</div>';
  }
  }
  return h;
}
function bgHTML(s){
  const bl=`<i class=bl style="left:-20%;top:-15%"></i><i class="bl q" style="right:-25%;bottom:-15%"></i>`;
  const v=s.bgv;
  let x=bl;
  if(v==1)x+='<div class=gr></div>';else if(v==2)x+='<div class=dt></div>';
  else if(v==3)x='<i class=bl style="left:10%;top:-30%;width:100cqmin;height:100cqmin"></i>';
  else if(v==4)x='<div class=dg></div>'+bl;
  else if(v==5)x=bl+'<div class=rn><i style="width:50cqmin;height:50cqmin"></i><i style="width:85cqmin;height:85cqmin"></i><i style="width:125cqmin;height:125cqmin"></i><i style="width:170cqmin;height:170cqmin"></i></div>';
  else if(v==7)x=bl+'<div class=hz></div>';
  return `<div class="bgl${v==6?' au':''}">${v==6?'':x}${mbg(s)}</div>`;
}
function stage(s){
  const [b1,b2,a,b,f,dk]=s.pal,r=rng(s.seed);
  const V=dk?{mut:'rgba(255,255,255,.64)',card:'rgba(255,255,255,.07)',bd:'rgba(255,255,255,.14)',ln:'rgba(255,255,255,.07)',ln2:'rgba(255,255,255,.16)',on:b1,vg:'rgba(0,0,0,.4)'}:{mut:'rgba(0,0,0,.58)',card:'rgba(255,255,255,.72)',bd:'rgba(0,0,0,.08)',ln:'rgba(0,0,0,.05)',ln2:'rgba(0,0,0,.14)',on:'#ffffff',vg:'rgba(0,0,0,.1)'};
  const lt=s.t===8,al=s.left||lt?'flex-start':'center',ta=s.left&&!lt?'left':(lt?'left':'center');
  const st=`--bg1:${b1};--bg2:${b2};--a:${a};--b:${b};--f:${f};--mut:${V.mut};--card:${V.card};--bd:${V.bd};--ln:${V.ln};--ln2:${V.ln2};--on:${V.on};--vg:${V.vg};--ease:${s.ease};--ease2:cubic-bezier(.65,0,.35,1);--ain:${s.ain};--cam:${s.cam};--out:${s.out};--T:${s.T}s;--al:${al};--ta:${ta};--jc:${lt?'flex-end':'center'}${s.img||s.cm?';--u:url('+photo(s)+')':''}${s.cm?';--u2:url('+photo({...s,seed:s.seed+5,pal:PAL[(PAL.indexOf(s.pal)+3)%PAL.length]})+')':''}`;
  const fx=(s.fxc?'<i class="cr a1"></i><i class="cr a2"></i><i class="cr a3"></i><i class="cr a4"></i>':'')+(s.fxh?'<div class=hp><i></i></div>':'')+(s.fxs?'<div class=sl>Fireroz Media</div>':'')+`<div class=tm>${(s.tn||TYPES[s.t]).toUpperCase()} / ${String(s.i%1000).padStart(3,'0')}</div>`;
  return `<div class=stg data-i="${s.i}" data-t="${s.T}" style="${st}">${bgHTML(s)}<div class=cam><div class=scene${lt?' style="padding-bottom:16cqmin"':''}>${s.chat3?bodyChat3(s):s.chat2?bodyChat2(s):s.cm?bodyCm(s):s.adv?bodyAdv(s):s.img?bodyImg(s):s.t>=25?bodyAnimation(s):s.t>=15?bodySaas(s,r):body(s,r)}</div></div><div class=gn></div><div class=vg></div><div class=fx>${fx}</div></div>`;
}
/* ---------- v2: motion backgrounds + advanced motion + image effects ---------- */
let USERIMG='';
const WD=['MOTION','FUTURE','दुनिया','GROWTH','पैसा','NEXT','BOLD','AI','सपने','FOCUS','SMART','LEVEL UP','IDEA','सोचो','CREATE','WIN'];
const ADVN=['Tile Flip Wall','Gooey Blobs','Neon Flicker','RGB Glitch','3D Carousel','Odometer','Spiral Galaxy','Radial Burst','Gyroscope','Terminal Type','Sliced Text','Newton Cradle','Lissajous Draw','Honeycomb Pulse','Water Fill Text','Kaleidoscope','Warp Tunnel','DNA Helix','Magnet Grid','Pendulum Wave'];
const IMGN=['Ken Burns','RGB Glitch Photo','Duotone Sweep','Wipe Reveal','Blur Focus','3D Tilt Shine','Slice Reveal','Mosaic Build','Liquid Ripple','Polaroid Drop','Film Strip','Parallax Depth','Shape Morph','Shine Sweep','Hue Cycle','CRT Scanlines','Float Reflection','Opening Doors','Zoom Burst','Heartbeat Frame'];
CATS.push('Advanced Motion','Image Effects');
function mbg(s){const k=(s.i*7+(s.seed||0))%16,r=rng(s.i*31+k),n=[3,28,40,3,1,12,6,2,1,16,4,1,22,2,3,18][k];let h='';
  for(let j=0;j<n;j++)h+=`<i style="--x:${(r()*96).toFixed(0)}%;--y:${(r()*92).toFixed(0)}%;--s:${k==9?(10+r()*30).toFixed(0)+'cqmin':k==15?(10+r()*35).toFixed(0)+'%':(.6+r()*(k==5||k==14?20:2.2)).toFixed(1)+'cqmin'};--t:${(k==0||k==3?8:3+r()*6).toFixed(1)}s;--dl:${(-r()*8).toFixed(1)}s"></i>`;
  return `<div class="mbg m${k}">${h}</div>`}
function advSpec(i,img){const j=i-(img?31001:21001),r=rng((Math.imul(i,img?3037000493:2891336453))^(SEED*6007+5)),pk=a=>a[Math.floor(r()*a.length)],ri=n=>Math.floor(r()*n);
  return{i,t:0,adv:!img,img:!!img,ax:j%20,variant:j/20|0,tn:(img?IMGN:ADVN)[j%20],pal:pk(PAL),seed:ri(1e6),ease:pk(EASE),ain:'a0',cam:'cam'+ri(4),out:'o'+ri(4),T:+(6+r()*3).toFixed(1),t0:.2,st:.12,cat:img?'Image Effects':'Advanced Motion',left:false,hs:12,hlv:0,bs:25,fxc:r()<.5,fxh:true,fxs:false,bgv:ri(8)}}
function spec(i){return i>71000?chat3Spec(i):i>51000?chat2Spec(i):i>41000?cmSpec(i):i>31000?advSpec(i,1):i>21000?advSpec(i):i>11000?animationSpec(i):i>10000?saasSpec(i):baseSpec(i)}
function bodyAdv(s){const r=rng(s.seed),ri=n=>Math.floor(r()*n),pk=a=>a[ri(a.length)],w=pk(WD),fs=Math.min(22,130/w.length)-ri(3),F=(n,x)=>Array.from({length:n},x).join(''),W=(f,x,c)=>`<div class="wd ${c||''}" style="--fs:${f}">${x}</div>`;let h='';
  switch(s.ax){
  case 0:{const n=4+ri(3),c=(n-1)/2;h=`<div class=fw style="--n:${n}">`+F(n*n,(_,k)=>`<b class=ft style="--dl:${(Math.hypot(k%n-c,(k/n|0)-c)*.18).toFixed(2)}s"></b>`)+'</div>';break}
  case 1:{const n=4+ri(4);h=`<svg class=gz viewBox="0 0 100 100"><defs><filter id="goo${s.i}"><feGaussianBlur stdDeviation="3.2"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 22 -10"/></filter></defs><g filter="url(#goo${s.i})"><circle cx="50" cy="50" r="${11+ri(6)}"/>`+F(n,(_,k)=>`<g class=go style="--t:${(5+k*1.7).toFixed(1)}s"><circle class=c2 cx="${66+k*4}" cy="50" r="${4+ri(4)}"/></g>`)+'</g></svg>'+W(fs*.5,`<span style="color:var(--on)">${w}</span>`,'ov');break}
  case 2:h=W(fs,`<i class=nr></i><span class=nn>${w}</span>`);break;
  case 3:h=W(fs,`<span class=gl>${w}</span><span class="gl g1">${w}</span><span class="gl g2">${w}</span>`);break;
  case 4:{const n=6+ri(4);h=`<div class=cs style="--n:${n}">`+F(n,(_,k)=>`<b style="--k:${k}">${pk(WD)}</b>`)+'</div>';break}
  case 5:h=W(20,[...String(10000+ri(89999))].map(x=>`<span class=od style="--d:${x};--t:${(1.6+r()*1.4).toFixed(1)}s"><i>${[...'0123456789'].map(y=>`<b>${y}</b>`).join('')}</i></span>`).join(''));break;
  case 6:{const q=.28+s.variant%7*.01;h='<div class=gx>'+F(110,(_,k)=>`<i style="left:${(50+Math.cos(k*q)*k*.4).toFixed(1)}%;top:${(50+Math.sin(k*q)*k*.4).toFixed(1)}%;--dl:${(k*.03).toFixed(2)}s"></i>`)+'</div>';break}
  case 7:h=`<i class=ry style="--g:${8+ri(14)}deg"></i><i class=cr0></i>`+W(fs*.45,w,'ov');break;
  case 8:h='<div class=gy><i></i><i></i><i></i></div>'+W(fs*.4,w,'ov');break;
  case 9:{const L=['npm run build','deploy --prod','scale users x10','growth: +248%','status: LIVE'];h='<div class=tx>'+F(5,(_,k)=>`<p style="--ch:${L[k].length+3};--dl:${(k*.9).toFixed(1)}s">$ ${L[k]}</p>`)+'</div>';break}
  case 10:{const n=6+ri(4);h=`<div class=wd style="--fs:${fs}"><span style="visibility:hidden">${w}</span>`+F(n,(_,k)=>`<span class=sl2 style="--k:${k};--n:${n}">${w}</span>`)+'</div>';break}
  case 11:h='<div class=nc>'+F(5,()=>'<i></i>')+'</div>';break;
  case 12:{const a=2+ri(4),b=3+ri(4),p=r()*3;let d='';for(let k=0;k<=240;k++){const t=k/240*6.2832;d+=(k?'L':'M')+(50+42*Math.sin(a*t+p)).toFixed(1)+' '+(50+42*Math.sin(b*t)).toFixed(1)}h=`<svg class=lj viewBox="0 0 100 100"><path pathLength="1" d="${d}"/><path class=l2 pathLength="1" d="${d}"/></svg>`;break}
  case 13:h='<div class=hx>'+F(72,(_,k)=>{const c=k%9,rw=k/9|0;return`<i style="left:${(c*9.6).toFixed(1)}cqmin;top:${(rw*11+(c%2?5.5:0)).toFixed(1)}cqmin;--dl:${(Math.hypot(c-4,rw-3.5)*.12).toFixed(2)}s"></i>`})+'</div>';break;
  case 14:h=W(fs,`<span class=wt>${w}</span>`);break;
  case 15:h='<div class=kd>'+F(6,(_,k)=>`<i style="--k:${k};--m:${k%2?-1:1}"></i>`)+'</div>';break;
  case 16:h=`<div class=tn2 style="--rd:${ri(3)*25}%;--rt:${(ri(5)-2)*45}deg">`+F(10,(_,k)=>`<i style="--k:${k}"></i>`)+'</div>';break;
  case 17:h='<div class=dn>'+F(16,(_,k)=>`<p style="--dl:${(-k*.16).toFixed(2)}s"><b></b><u></u></p>`)+'</div>';break;
  case 18:h='<div class=mg>'+F(81,(_,k)=>`<i style="--dl:${(Math.hypot(k%9-4,(k/9|0)-4)*.14).toFixed(2)}s"></i>`)+'</div>';break;
  default:h='<div class=pw>'+F(14,(_,k)=>`<i style="--p:${(1.4+k*.07).toFixed(2)}s"></i>`)+'</div>'}
  return `<div class=adv>${h}</div>`}
function photo(s){if(USERIMG)return USERIMG;const[b1,b2,a,b]=s.pal,r=rng(s.seed+9),m=[0,1,2,3,4].map(k=>`${k*100} ${240+Math.round(r()*120)}`).join('L');
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 500'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='.7' stop-color='${b}'/></linearGradient></defs><rect width='400' height='500' fill='url(#g)'/><circle cx='${60+r()*280|0}' cy='${90+r()*90|0}' r='${40+r()*30|0}' fill='${b2}' opacity='.85'/><path d='M${m}V500H0Z' fill='${b1}' opacity='.7'/><path d='M0 ${400+r()*40|0}L130 ${330+r()*40|0}L260 ${410+r()*30|0}L400 ${320+r()*40|0}V500H0Z' fill='${b1}'/></svg>`;
  return 'data:image/svg+xml,'+encodeURIComponent(svg).replace(/\(/g,'%28').replace(/\)/g,'%29').replace(/'/g,'%27')}
function bodyImg(s){const r=rng(s.seed),ri=n=>Math.floor(r()*n),pk=a=>a[ri(a.length)],ix=s.ax,U='<i class=im></i>',P=c=>`<div class=pf>${c}</div>`,F=(n,x)=>Array.from({length:n},x).join('');
  const CP=pk([['inset(0 100% 0 0)','inset(0)'],['circle(0% at 50% 50%)','circle(80% at 50% 50%)'],['polygon(0 0,0 0,0 100%,0 100%)','polygon(0 0,100% 0,100% 100%,0 100%)'],['inset(50% 50% 50% 50%)','inset(0)'],['inset(0 0 100% 0)','inset(0)']]);let h='';
  switch(ix){
  case 1:h=P(U+U+U);break;
  case 2:h=P(U+'<i class=ov></i>');break;
  case 5:case 13:h=P(U+'<i class=sh></i>');break;
  case 6:h=P(F(8,(_,k)=>`<div class=sv style="--k:${k}"><i class=im style="left:calc(${k}*-100%);width:800%"></i></div>`));break;
  case 7:h=P(F(48,(_,k)=>`<i class=mt style="--c:${k%6};--r:${k/6|0};--dl:${(r()*1.2).toFixed(2)}s"></i>`));break;
  case 8:h=`<svg width="0" height="0" style="position:absolute"><filter id="lq${s.i}"><feTurbulence type="turbulence" baseFrequency=".01 .02" numOctaves="2" result="t"><animate attributeName="baseFrequency" dur="6s" values=".01 .02;.02 .05;.01 .02" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" in2="t" scale="40"/></filter></svg>`+P(`<i class=im style="filter:url(#lq${s.i});transform:scale(1.1)"></i>`);break;
  case 9:h=`<div class=po>${U}<b>${pk(WD)}</b></div>`;break;
  case 10:h='<div class=fs>'+F(10,(_,k)=>`<i style="--k:${k%5}"></i>`)+'</div>';break;
  case 11:h=P(U+U+U);break;
  case 15:h=P(U+'<i class=cr2></i>');break;
  case 17:h=P(`<b class=bw>${pk(WD)}</b><i class=dr1></i><i class=dr2></i>`);break;
  case 18:h=P(U+U+U+U);break;
  case 19:h=P(U)+'<s></s><s></s><s></s><s></s>';break;
  default:h=P(U)}
  return `<div class="ig e${ix}" style="--du:${(4+r()*3).toFixed(1)}s;--cp:${CP[0]};--ce:${CP[1]}">${h}</div>`}
/* ---------- Claude motion ---------- */
const CMN=['Click Text Swap','Click Text Scroll Down','Auto Typing Explainer','Auto Bullet Explainer','Image Slide Transition','Image Zoom Crossfade','Image Iris Transition','Image Blinds Transition','Loading Ring','Loading Steps Bar','Loading Orbit','Paper Fold Reveal','Paper Unfold Card','Page Peel Transition','Logo Line Draw','Logo Assemble','Logo Shine Reveal','SaaS Click Toast','SaaS Toggle Setup','SaaS Dashboard Click'];
const TOP=[{t:'पैसा कैसे बढ़ाएं',l:['आय का हिसाब रखो','खर्च कम करो','हर महीने SIP करो','हर 3 महीने समीक्षा']},{t:'Launch a product',l:['Find a real problem','Build a tiny version','Test with 10 users','Launch and improve']},{t:'AI से काम तेज़',l:['सही prompt लिखो','नतीजा जांचो','Automation बनाओ','रोज़ दोहराओ']},{t:'Grow on social',l:['Pick one niche','Post every day','Reply to comments','Study analytics']},{t:'सेहत की आदतें',l:['सुबह जल्दी उठो','पानी ज़्यादा पीओ','रोज़ चलो','समय पर सोओ']}];
const BR=['NOVA','Fireroz','ORBIT','काव्य','Zenith','Lumo','Pixel','अर्थ'];
const LP=['M50 8L88 29V71L50 92L12 71V29Z','M50 10L90 85H10Z','M50 6L94 50L50 94L6 50Z','M18 18H82V82H18Z M36 36H64V64H36Z','M50 8A42 42 0 1 1 49.9 8Z M50 28A22 22 0 1 0 50.1 28Z','M10 70L35 20L50 50L65 20L90 70Z'];
CATS.push('Claude motion','ChatGPT 2','ChatGPT 3');let SUB='';
const CHAT2F=['All styles','Line Draw','Typography','Transitions','3D & Depth','Particles & Energy','Audio Motion','UI & Data','Abstract Shapes'];
let CHAT3FILTER=null;
function chatFamily(ax){if([0,1,2,3,4,6,7,8].includes(ax))return 1;if([5,9,34].includes(ax))return 2;if([11,24,25,26,38].includes(ax))return 3;if([10,23,36].includes(ax))return 4;if([15,16,17,21,22,27,28,29].includes(ax))return 5;if([18,19,20,37].includes(ax))return 6;if([31,32,35].includes(ax))return 7;return 8;}
const CHAT2N=['Signature Line Draw','Continuous Stroke Reveal','Neon Tube Trace','Laser Light Trail','Blueprint Path Draw','Handwriting Reveal','Orbiting Stroke','Morphing Outline','Animated Underline','Kinetic Word Stagger','3D Cube Flip','Glass Card Reveal','Liquid Blob Morph','RGB Split Glitch','Digital Scanline','Particle Explosion','Floating Particles','Energy Shockwave','Audio Spectrum','Equalizer Bounce','Liquid Waveform','Shape Burst','Mosaic Tile Build','3D Perspective Spin','Mask Wipe Reveal','Diagonal Split Reveal','Light Sweep','Glow Pulse','Elastic Bounce','Motion Trail','Animated Route Map','Network Connection','Circular Progress','Gradient Flow','Typewriter Terminal','HUD Radar Sweep','Layered Parallax','Ribbon Wave','Logo Assemble','Cinematic Focus Pull'];
function chat2Spec(i){const j=i-51001,r=rng(Math.imul(i,2246822519)^(SEED*8191+29)),pk=a=>a[Math.floor(r()*a.length)],ri=n=>Math.floor(r()*n);return{i,t:0,chat2:1,ax:j%CHAT2N.length,variant:j/CHAT2N.length|0,tn:CHAT2N[j%CHAT2N.length],pal:pk(PAL),seed:ri(1e6),ease:pk(EASE),ain:'a0',cam:'cam'+ri(4),out:'o'+ri(4),T:+(6+r()*3).toFixed(1),t0:.18,st:.14,cat:'ChatGPT 2',family:chatFamily(j%CHAT2N.length),left:false,hs:12,hlv:0,bs:25,fxc:false,fxh:false,fxs:false,bgv:ri(8)}}

const CHAT3_FILTERS=['Storyboard & Scenes','Typography & Layout','Vector & Line Draw','2D / 3D Depth','Transitions & Morph','Particles & Audio'];
const C3_WORDS=['CREATE','IMAGINE','DIVRIZ','MOTION','FUTURE','DESIGN','STORY','VISION','ENERGY','FOCUS','BUILD','GROW','IDEA','ORBIT','NOVA','FLOW','प्रगति','सोच','बदलाव','सपने'];
const C3_SUBS=['CONCEPT → FRAME → MOTION','DESIGNED WITH INTENTION','EVERY FRAME HAS A PURPOSE','CRAFTED IN LAYERS','TIMING • RHYTHM • DEPTH','FROM IDEA TO IMPACT'];
function chat3Spec(i){const j=i-71001,r=rng(Math.imul(i,3266489917)^(SEED*104729+73)),pk=a=>a[Math.floor(r()*a.length)],ri=n=>Math.floor(r()*n),band=j<30000?0:j<60000?1:2;return{i,t:0,chat3:1,ax:ri(48),variant:j,band,family:band===0?Math.floor(j/5000):j%6,tn:band===0?CHAT3_FILTERS[Math.floor(j/5000)]:(band===1?'Unique Composition':'Advanced Studio'),pal:pk(PAL),seed:ri(2147483000),ease:pk(EASE),ain:pk(['a0','a1','a2','a3','a4','a5','a7']),cam:'cam'+ri(4),out:'o'+ri(4),T:+(5.5+r()*4.2).toFixed(1),t0:.16,st:.12,cat:'ChatGPT 3',left:false,hs:12,hlv:0,bs:25,fxc:false,fxh:false,fxs:false,bgv:ri(8),c3mode:band===0?Math.floor(j/5000):band===1?6+ri(18):24+ri(24)}}
function bodyChat3(s){const r=rng((s.seed^Math.imul(s.i,668265263))|0),ri=n=>Math.floor(r()*n),pk=a=>a[ri(a.length)],F=(n,fn)=>Array.from({length:n},(_,k)=>fn(k)).join(''),word=pk(C3_WORDS),sub=pk(C3_SUBS),mode=s.c3mode,shapes=F(3+ri(5),k=>{const x=7+ri(80),y=8+ri(70),w=5+ri(19),h=5+ri(22),rad=pk(['50%','2cqmin','45% 12%','10% 50% 10% 50%']),delay=(.12+k*(.12+r()*.18)).toFixed(2);return `<i class=c3shape style="--x:${x}%;--y:${y}%;--w:${w}%;--h:${h}%;--rad:${rad};--sx:${ri(70)-35}cqmin;--sy:${ri(70)-35}cqmin;--rot:${ri(150)-75}deg;--delay:${delay}s;--dur:${(.65+r()*.75).toFixed(2)}s"></i>`});
 const particles=F(24+ri(30),k=>`<i class=c3particle style="--x:${(r()*100).toFixed(1)}%;--y:${(r()*100).toFixed(1)}%;--size:${(.6+r()*1.8).toFixed(1)}cqmin;--dx:${(-8+r()*16).toFixed(1)}cqmin;--delay:${(r()*2).toFixed(2)}s;--dur:${(1.5+r()*2.4).toFixed(2)}s"></i>`),pts=Array.from({length:8},()=>[10+ri(80),8+ri(80)]),start=pts[0],route=`M${start[0]} ${start[1]} C ${20+ri(60)} ${ri(35)} ${150+ri(90)} ${10+ri(100)} ${220+ri(85)} ${20+ri(70)} L ${220+ri(85)} ${100+ri(65)} C ${260+ri(25)} ${155+ri(20)} ${120+ri(80)} ${170-ri(60)} ${100+ri(100)} ${170-ri(60)} L ${100+ri(100)} ${10+ri(25)}`;
 const routeSvg=`<svg class=c3route viewBox="0 0 320 180" preserveAspectRatio="none"><path pathLength=1 d="${route}"/></svg>`;
 const nodes=F(pts.length,(k)=>`<i class=c3node style="left:${pts[k][0]}%;top:${pts[k][1]}%;--delay:${(.35+k*.22).toFixed(2)}s"></i>`);
 const lineSvg=(d)=>`<svg class=c3line viewBox="0 0 320 180" preserveAspectRatio="none"><path pathLength=1 d="${d}"/></svg>`;
 const tileCount=12+ri(17),tiles=`<div class=c3tiles style="--cols:${3+ri(4)}">${F(tileCount,k=>`<i style="--k:${k};border-radius:${ri(4)+1}cqmin"></i>`)}</div>`;
 const bars=`<div class=c3bars>${F(12+ri(15),()=>`<i style="--bw:${(1.3+r()*2.4).toFixed(1)}%;--bh:${(18+r()*78).toFixed(1)}%;--delay:${(r()*.8).toFixed(2)}s;--bdur:${(.35+r()*.8).toFixed(2)}s"></i>`)}</div>`;
 const panel=`<div class=c3panel><h3>${word}</h3><p>${sub}</p><p>${pk(['Plan the visual rhythm','Separate every asset into layers','Build anticipation before impact','Refine timing and spacing','Create a clear visual hierarchy'])}</p><b></b></div>`;
 let visual='';
 if(mode===0){visual=`<div class=c3frame data-step="STORYBOARD / CONCEPT → FRAME → ACTION"></div><div class=c3scenes>${F(4,k=>`<i style="--k:${k}"></i>`)}</div>${routeSvg}${nodes}<div class=c3story>${F(4,k=>`<i style="--k:${k}"></i>`)}</div>`}
 else if(mode===1){visual=`<div class=c3frame data-step="TYPOGRAPHY / HIERARCHY"></div><div class=c3letters>${[...word].map((ch,k)=>`<i style="--k:${k}">${ch}</i>`).join('')}</div><div class=c3sub>${sub}</div><div class=c3motion></div>`}
 else if(mode===2){visual=`${lineSvg(`M${8+ri(30)} ${120+ri(35)} C${45+ri(40)} ${ri(50)} ${100+ri(70)} ${150+ri(20)} ${155+ri(30)} ${60+ri(30)} S${260+ri(30)} ${ri(80)} ${300-ri(20)} ${70+ri(40)}`)}<div class=c3word>${word}</div>${shapes}`}
 else if(mode===3){visual=`<div class=c3frame data-step="2D / 3D DEPTH STACK"></div><div class=c3orbit style="--w:${48+ri(35)}cqmin;--h:${26+ri(40)}cqmin;--tilt:${ri(100)-50}deg;--dur:${(4+r()*5).toFixed(1)}s"></div>${tiles}${shapes}<div class="c3caption">PARALLAX • PERSPECTIVE • LAYERS</div>`}
 else if(mode===4){visual=`<div class=c3frame data-step="TRANSITION / MORPH SEQUENCE"></div><div class=c3shape style="--x:24%;--y:24%;--w:52%;--h:52%;--rad:${pk(['50%','8%','50% 12%'])};--sx:-32cqmin;--sy:0cqmin;--rot:120deg;--delay:.1s"></div>${panel}<div class=c3motion></div>`}
 else if(mode===5){visual=`${particles}${bars}<div class=c3word>${pk(['SOUND','RHYTHM','PULSE','WAVE'])}</div><div class="c3caption">PARTICLES • BEAT SYNC • DYNAMIC RANGE</div>`}
 else if(mode===6){visual=`<div class=c3frame data-step="UNIQUE COMPOSITION ${String(s.variant%30000+1).padStart(5,'0')}"></div>${shapes}${routeSvg}<div class=c3word>${word}</div><div class=c3sub>${sub}</div>${nodes}`}
 else if(mode%6===1){visual=`<div class=c3orbit style="--w:${40+ri(30)}cqmin;--h:${25+ri(35)}cqmin;--tilt:${ri(75)-35}deg;--dur:${(4+r()*6).toFixed(1)}s"></div><div class=c3orbit style="--w:${65+ri(25)}cqmin;--h:${30+ri(45)}cqmin;--tilt:${ri(120)}deg;--dur:${(5+r()*7).toFixed(1)}s"></div>${shapes}<div class=c3word>${word}</div>`}
 else if(mode%6===2){visual=`${lineSvg(`M10 ${20+ri(130)} Q${40+ri(70)} ${ri(170)} ${100+ri(60)} ${20+ri(140)} T${300-ri(20)} ${20+ri(140)}`)}<div class=c3word>${word}</div><div class=c3sub>${sub}</div>${shapes}`}
 else if(mode%6===3){visual=`${tiles}<div class=c3motion></div><div class="c3caption">STAGGER • DEPTH • FOLLOW THROUGH</div>`}
 else if(mode%6===4){visual=`${panel}${routeSvg}${shapes}`}
 else{visual=`${bars}<div class="c3caption">AUDIO REACTIVE / DYNAMIC RANGE</div>`}
 const flowDur=(2+r()*3.8).toFixed(2),delay=(r()*.45).toFixed(2),ease=pk(['cubic-bezier(.16,1,.3,1)','cubic-bezier(.22,1,.36,1)','cubic-bezier(.34,1.4,.64,1)','cubic-bezier(.65,0,.35,1)']);
 if(s.band>0 && mode%5===0)visual+=particles;
 return `<div class="c3stage" style="--c3dur:${flowDur}s;--c3delay:${delay}s;--c3ease:${ease};--routedur:${(2+r()*3).toFixed(2)}s"><div class=c3canvas>${visual}<div class=c3motion></div></div><div class=c3caption>${s.band===0?'FILTER PACK / '+CHAT3_FILTERS[s.family].toUpperCase():s.band===1?'ORIGINAL COMPOSITION / '+String(s.variant%30000+1).padStart(5,'0'):'ADVANCED MOTION SYSTEM / '+String(s.variant%40000+1).padStart(5,'0')}</div></div>`;
}

function bodyChat2(s){const r=rng(s.seed),ri=n=>Math.floor(r()*n),pk=a=>a[ri(a.length)],F=(n,fn)=>Array.from({length:n},fn).join(''),word=pk(['CREATE','MOTION','DIVRIZ','FUTURE','DESIGN','ENERGY','FLOW','VISION']),sub=pk(['DRAW EVERY DETAIL','PRECISION IN MOTION','BUILT TO MOVE','NEXT LEVEL VISUALS']);let h='';
 const path=(d,extra='')=>`<svg class="c2-svg" viewBox="0 0 320 180"><path pathLength="1" class="c2-stroke ${extra}" d="${d}"/>`;
 const dots=F(32,()=>`<i style="--x:${(r()*100).toFixed(1)}%;--y:${(r()*100).toFixed(1)}%;--s:${(.5+r()*1.7).toFixed(1)}cqmin;--d:${(-r()*2.5).toFixed(2)}s;--t:${(1.8+r()*2.4).toFixed(1)}s;--dx:${(-3+r()*6).toFixed(1)}cqmin"></i>`);
 switch(s.ax){
 case 0:h=`<div style="width:100%;height:75%;display:flex;align-items:center;justify-content:center">${path('M35 112 C55 20 100 20 115 85 S175 160 190 75 S250 20 282 88','c2-glow')}</div><div class=c2-label>${sub}</div>`;break;
 case 1:h=path('M28 130 C42 30 85 25 110 90 C132 145 160 145 176 75 C190 20 238 28 290 110','c2-wide c2-glow');break;
 case 2:h=`<div class=c2-word style="color:var(--a);text-shadow:0 0 2cqmin var(--a),0 0 7cqmin var(--a)">NEON</div><div class=c2-ring></div><div class=c2-ring></div>`;break;
 case 3:h=`<svg class=c2-svg viewBox="0 0 320 180"><path class="c2-stroke c2-glow" style="stroke-width:5" d="M15 140 Q90 10 150 90 T305 40"/><path class="c2-stroke" style="stroke:var(--b);stroke-width:1" d="M15 150 Q90 20 150 100 T305 50"/></svg>`;break;
 case 4:h=`<div class=c2-grid></div>${path('M35 30 H285 V150 H35 Z M65 60 H255 V120 H65 Z','c2-thin')}`;break;
 case 5:h=`<div class="c2-word" style="font-family:cursive;font-style:italic">${word}</div><div class=c2-underline></div>`;break;
 case 6:h=`<div class=c2-orbit></div><div class=c2-orbit style="width:78cqmin;height:30cqmin;transform:rotate(55deg)"></div><div class=c2-blob style="width:7cqmin;height:7cqmin"></div>`;break;
 case 7:h=`<div class="c2-word" style="-webkit-text-stroke:.35cqmin var(--a);color:transparent">${word}</div><div class=c2-ring></div>`;break;
 case 8:h=`<div class="c2-word">${word}<i class=c2-underline></i></div>`;break;
 case 9:h=`<div class="c2-word" style="display:flex;gap:1cqmin">${[...word].map((c,k)=>`<span style="display:inline-block;animation:c2Word .7s ${k*.08}s both">${c}</span>`).join('')}</div>`;break;
 case 10:h=`<div class=c2-3d></div><div class="c2-label">3D OBJECT ROTATION</div>`;break;
 case 11:h=`<div class="c2-card"><div class=c2-kicker>CREATIVE WORKSPACE</div><div class="c2-title">${word}</div><div class=c2-cardline><i style="--w:86%"></i></div><div class=c2-mask></div></div>`;break;
 case 12:h='<div class=c2-blob></div>';break;
 case 13:h=`<div class="c2-split">${word}</div>`;break;
 case 14:h=`<div class=c2-grid></div><div class="c2-title">SYSTEM ONLINE</div><div class="c2-label">SCANNING • 01 / 04</div>`;break;
 case 15:case 16:h=`<div class="c2-particles">${dots}</div><div class="c2-title">${s.ax===15?'BURST':'PARTICLES'}</div>`;break;
 case 17:h='<div class="c2-wave"></div><div class="c2-wave"></div><div class="c2-wave"></div><div class="c2-title">ENERGY</div>';break;
 case 18:case 19:case 20:h=`<div class="c2-bars">${F(31,(_,k)=>`<i style="--h:${15+ri(85)}%;--d:${(r()*.8).toFixed(2)}s"></i>`)}</div>`;break;
 case 21:h=`<div class="c2-tile">${F(16,(_,k)=>`<i style="--i:${k}"></i>`)}</div>`;break;
 case 22:h=`<div class="c2-tile">${F(32,(_,k)=>`<i style="--i:${(Math.abs(k%4-1.5)+Math.abs((k/4|0)-3.5))*.09}"></i>`)}</div>`;break;
 case 23:h='<div class=c2-3d></div><div class=c2-ring></div>';break;
 case 24:h=`<div class="c2-title">${word}</div><div class=c2-wipe></div>`;break;
 case 25:h=`<div class="c2-title">${word}</div><div class=c2-mask></div>`;break;
 case 26:h=`<div class="c2-card"><div class=c2-kicker>LIGHT PASS</div><div class="c2-title">${word}</div><div class=c2-mask></div></div>`;break;
 case 27:h=`<div class=c2-blob></div><div class=c2-ring></div>`;break;
 case 28:h='<div class=c2-bounce></div>';break;
 case 29:h=`<svg class=c2-svg viewBox="0 0 320 180"><path class="c2-stroke c2-glow" d="M25 90 Q80 10 140 90 T295 90"/></svg><div class="c2-label">MOTION TRAIL</div>`;break;
 case 30:h=`<div class=c2-grid></div>${path('M28 140 L85 40 L150 110 L215 35 L292 130','c2-wide c2-glow')}`;break;
 case 31:h=`<svg class=c2-svg viewBox="0 0 320 180"><path class="c2-stroke" d="M160 90 L65 35 M160 90 L255 35 M160 90 L65 145 M160 90 L255 145"/>${F(5,(_,k)=>`<circle class=c2-dot cx="${[160,65,255,65,255][k]}" cy="${[90,35,35,145,145][k]}" r="7"/>`)}</svg>`;break;
 case 32:h=`<svg class=c2-svg viewBox="0 0 120 120"><circle cx=60 cy=60 r=42 fill="none" stroke="var(--bd)" stroke-width=8/><circle class="c2-stroke c2-glow" pathLength=1 cx=60 cy=60 r=42 stroke-width=8 style="transform:rotate(-90deg);transform-origin:60px 60px"/></svg><div class="c2-title">78%</div>`;break;
 case 33:h=`<div class=c2-blob style="width:78cqmin;height:38cqmin;border-radius:50%;filter:blur(1cqmin)"></div>`;break;
 case 34:h=`<div class="c2-card"><div class=c2-kicker>TERMINAL / DIVRIZ</div><div class="c2-type">$ npm run create-motion</div><div class="c2-cardline"><i style="--w:100%"></i></div></div>`;break;
 case 35:h=`<div class=c2-ring></div><div class=c2-ring></div><div class=c2-ring></div><div class="c2-title">RADAR</div>`;break;
 case 36:h=`<div class=c2-grid></div><div class="c2-word">DEPTH <em>01</em></div><div class=c2-orbit></div>`;break;
 case 37:h=`<svg class=c2-svg viewBox="0 0 320 180"><path class="c2-stroke c2-wide" d="M5 90 C55 0 95 180 155 90 S255 0 315 90"/><path class="c2-stroke c2-thin" style="stroke:var(--b)" d="M5 105 C55 15 95 195 155 105 S255 15 315 105"/></svg>`;break;
 case 38:h=`<div class="c2-tile">${F(4,(_,k)=>`<i style="--i:${k*.18}"></i>`)}</div><div class="c2-title">${pk(['NOVA','ORBIT','DIVRIZ','FLOW'])}</div>`;break;
 default:h=`<div class="c2-title">${word}</div><div class=c2-ring></div><div class=c2-mask></div>`;
 }
 // Every template receives its own vector route: left-to-right, then down, then upward.
 const x1=8+ri(18), y1=35+ri(110), x2=245+ri(55), y2=95+ri(55), x3=215+ri(70), y3=12+ri(38);
 const bend=18+ri(42), route=`M ${x1} ${y1} C ${x1+bend} ${y1-ri(35)} ${x2-bend} ${y1+ri(35)} ${x2} ${y1} L ${x2} ${y2} C ${x2} ${y2+ri(24)} ${x3+ri(25)} ${y2+ri(18)} ${x3} ${y2} L ${x3} ${y3}`;
 const route2=`M ${x1} ${Math.min(168,y1+10)} Q ${x1+ri(90)} ${Math.max(5,y1-ri(45))} ${x2} ${Math.min(170,y1+8)} L ${x2-5} ${Math.max(5,y2-8)} L ${x3+6} ${Math.max(5,y3+7)}`;
 const flow=`<svg class="c2-flow" viewBox="0 0 320 180" preserveAspectRatio="none"><path pathLength="1" d="${route}"/><path pathLength="1" d="${route2}"/><circle cx="${x3}" cy="${y3}" r="2.4"/></svg>`;
 return `<div class="c2fx" style="--cdur:${(1.8+r()*2.8).toFixed(1)}s;--delay:${(.08+r()*.55).toFixed(2)}s;--flowdur:${(2.1+r()*2.8).toFixed(1)}s;--flowdelay:${(.08+r()*.45).toFixed(2)}s;--flowdot:${(2.4+r()*2.5).toFixed(2)}s;filter:hue-rotate(${ri(36)*10}deg)">${h}${flow}</div>`;
}

function cmSpec(i){const j=i-41001,r=rng(Math.imul(i,2654435761)^(SEED*131+17)),pk=a=>a[Math.floor(r()*a.length)],ri=n=>Math.floor(r()*n);
  return{i,t:0,cm:1,ax:j%20,variant:j/20|0,tn:CMN[j%20],pal:pk(PAL),seed:ri(1e6),ease:pk(EASE),ain:'a0',cam:'cam'+ri(4),out:'o'+ri(4),T:+(7+r()*1.5).toFixed(1),t0:.2,st:.12,cat:'Claude motion',left:false,hs:12,hlv:0,bs:25,fxc:r()<.4,fxh:true,fxs:false,bgv:ri(8)}}
function bodyCm(s){const r=rng(s.seed),ri=n=>Math.floor(r()*n),pk=a=>a[ri(a.length)],F=(n,x)=>Array.from({length:n},x).join(''),tp=pk(TOP),L=tp.l,K='<svg class=cu viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z"/></svg>',lab=`<div class=cm-t>${tp.t}</div>`,bn=pk(BR),fr=c=>`<div class="cf t${s.ax}" style="--dx:${r()<.5?1:-1};--ox:${20+ri(60)}%;--oy:${20+ri(60)}%">${c}</div>`+lab;let h='';
  switch(s.ax){
  case 0:h=lab+'<div class=sw>'+L.map((x,k)=>`<b style="--k:${k}">${x}</b>`).join('')+`</div><div class=cw><span class=cb>${pk(['Next','Click','अगला'])}</span>${K}</div>`;break;
  case 1:h=lab+'<div class=rl><div>'+[...L].reverse().map(x=>`<b style="display:block;height:16cqmin">${x}</b>`).join('')+`</div></div><div class=cw style="--cd:.65s"><span class=cb>↓</span>${K}</div>`;break;
  case 2:h=`<div class=tp><h3>${tp.t}</h3>`+L.map((x,k)=>`<p style="--k:${k};--ch:${x.length+3}">${k+1}. ${x}</p>`).join('')+'</div>';break;
  case 3:h=`<div class=bu><h3>${tp.t}</h3>`+L.map((x,k)=>`<div style="--k:${k}">${x}</div>`).join('')+'</div>';break;
  case 4:case 5:case 6:h=fr('<i></i><i></i>');break;
  case 7:h=fr('<i></i>'+F(8,(_,k)=>`<s style="--k:${k}"></s>`));break;
  case 8:h=`<div class=lrw><svg viewBox="0 0 100 100"><circle class=tk2 cx="50" cy="50" r="42"/><circle class=lr cx="50" cy="50" r="42" pathLength="100"/></svg><b><span class=cnt style="--n:100;--d:.2s"></span>%</b></div><div class=cm-t>${pk(['Loading…','लोड हो रहा है','Please wait'])}</div>`;break;
  case 9:h='<div class=lbt><i></i></div><div class=ls>'+['Preparing','Building','Done'].map((x,k)=>`<b style="--k:${k}">${x}</b>`).join('')+'</div>';break;
  case 10:h='<div class=od2>'+F(8,(_,k)=>`<i style="--k:${k}"></i>`)+'</div><div class=cm-t style="margin-top:22cqmin">Loading…</div>';break;
  case 11:h='<div class=pfd>'+F(4,(_,k)=>`<i style="--k:${k}"></i>`)+'</div>';break;
  case 12:h=`<div class=pu><i></i><b>${bn}</b><i></i></div>`+lab;break;
  case 13:h='<div class=pe><i></i><i></i></div>'+lab;break;
  case 14:h=`<div class=lgw><svg viewBox="0 0 100 100"><path pathLength="1" d="${pk(LP)}"/></svg><div class=lgn>${bn}</div></div>`;break;
  case 15:h=`<div class=aw><div class=as style="--rd:${ri(3)*25}%">`+F(4,(_,k)=>`<i style="--k:${k};--tx:${k%2?'30cqmin':'-30cqmin'};--ty:${k<2?'-30cqmin':'30cqmin'}"></i>`)+`</div><i class=fr></i></div><div class=lgn>${bn}</div>`;break;
  case 16:h=`<div class=lw>${bn}</div>`;break;
  case 17:h=`<div class=sa><h3>${bn} Projects</h3>`+L.slice(0,3).map((x,k)=>`<div class=rw style="--k:${k}"><span>${x}</span><span>●</span></div>`).join('')+`<div class=cw style="--cp:4s;--cd:0s"><span class=cb>+ New project</span>${K}</div><div class=toast>✓ Created</div></div>`;break;
  case 18:h=lab+'<div class=tg2>'+L.slice(0,3).map((x,k)=>`<div>${x}<u style="--k:${k}"></u></div>`).join('')+'</div>';break;
  default:h='<div class=db><div class=kp>'+[['Users','8.4K'],['MRR','$24K'],['Growth','+32%']].map(x=>`<div>${x[0]}<b>${x[1]}</b></div>`).join('')+'</div><div class=br>'+F(7,(_,k)=>`<i style="--k:${k};--h:${30+ri(65)}%"></i>`)+'<svg class=cu viewBox="0 0 24 24" style="left:76%;top:20%;--cp:4s;--cd:2s"><path d="M4 2l16 9-7 2-3 7z"/></svg></div></div>'}
  return `<div class=cmx>${h}</div>`}

  return { spec: spec as (i: number) => any, stage: stage as (s: any) => string, TYPES, CATS, PAL, rng, setSeed: (n) => { SEED = n; }, setUserImg: (u) => { USERIMG = u; },
    copy: { TLYEARS, HEAD, EYE, SUBS, STATS, STEPS, QUO, VSP, LTS, TITLES, BN, YEARS, WD, C3_WORDS, C3_SUBS, CTAS, PROG, TOP, BR },
    names: { ANIM_NAMES, ADVN, IMGN, CMN, CHAT2N, CHAT3_FILTERS } };
}
