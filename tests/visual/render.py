import sys, json
from playwright.sync_api import sync_playwright
W,H = (1280,720) if sys.argv[1]=='land' else (720,1280)
mode = sys.argv[2]; out = sys.argv[3]
script = open('/tmp/script.txt',encoding='utf8').read()
times = json.loads(sys.argv[4]) if len(sys.argv)>4 else None
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':W,'height':H}); pg.set_content('<body style="margin:0;background:#222"><canvas id=c></canvas></body>')
    pg.add_script_tag(path='/tmp/harness.js')
    res = pg.evaluate("""([W,H,mode,script,times])=>{
      const {renderFrame,THEMES,planScenes,splitSentences}=window.H; const sents=splitSentences(script);
      const timed=sents.map((t,i)=>{const s=i*4,e=s+4,ws=t.split(/\\s+/);return {text:t,start:s,end:e,words:ws.map((w,k)=>({w,t0:s+0.3+k*(3.2/ws.length),t1:s+0.3+(k+1)*(3.2/ws.length)}))}});
      const sc=planScenes(timed,{mode,allow3d:true,category:'finance',title:'पैसा कैसे बढ़ता है'});
      const cv=document.getElementById('c'); cv.width=W; cv.height=H; const c=cv.getContext('2d');
      const shots=[]; const t0=performance.now(); let n=0;
      for(const t of times||[]){ renderFrame(c,W,H,sc,t,THEMES[mode],{captions:true}); shots.push(cv.toDataURL('image/jpeg',0.8)); n++; }
      return {blocks:sc.map(s=>s.block+':'+(s.params.subject||'')), ms:(performance.now()-t0)/n, shots};
    }""",[W,H,mode,script,times or [0.2]])
    print(res['blocks'], 'avg ms/frame', round(res['ms'],1))
    import base64
    for i,s in enumerate(res['shots']): open(f'{out}_{i}.jpg','wb').write(base64.b64decode(s.split(',')[1]))
    b.close()
