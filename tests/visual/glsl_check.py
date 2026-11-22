# Compiles + links every custom shader of the advanced 3D recipes in a real WebGL2 context, using the same prelude three.js adds.
# Usage: node --import ./tests/register.mjs --import ./tests/register-mock3.mjs --experimental-strip-types <(dump SHADERS) > shaders.json ; python3 glsl_check.py shaders.json
import json, sys
from playwright.sync_api import sync_playwright
S = json.load(open(sys.argv[1]))
PAIRS = [('galaxy', 'galaxyV', 'galaxyF'), ('orb', 'orbV', 'orbF'), ('holo', 'holoV', 'holoF'), ('tunnel', 'tunnelV', 'tunnelF')]
VPRE = '#version 300 es\nprecision highp float;precision highp int;\n#define attribute in\n#define varying out\nuniform mat4 modelMatrix,modelViewMatrix,projectionMatrix,viewMatrix;uniform mat3 normalMatrix;uniform vec3 cameraPosition;\nin vec3 position;in vec3 normal;in vec2 uv;\n'
FPRE = '#version 300 es\nprecision highp float;precision highp int;\n#define varying in\nlayout(location=0) out highp vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\nuniform mat4 viewMatrix;uniform vec3 cameraPosition;\n'
with sync_playwright() as p:
    b = p.chromium.launch(args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']); pg = b.new_page(); pg.set_content('<canvas id=c></canvas>')
    res = pg.evaluate("""([pairs,S,VPRE,FPRE])=>{const gl=document.getElementById('c').getContext('webgl2'); if(!gl) return [{n:'ctx',err:'no webgl2'}]; const out=[];
      for(const [n,v,f] of pairs){const mk=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);return [s,gl.getShaderInfoLog(s)||'',gl.getShaderParameter(s,gl.COMPILE_STATUS)]};
        const [vs,vl,vo]=mk(gl.VERTEX_SHADER,VPRE+S[v]),[fs,fl,fo]=mk(gl.FRAGMENT_SHADER,FPRE+S[f]); let err=''; if(!vo)err+='VERT: '+vl; if(!fo)err+=' FRAG: '+fl;
        if(vo&&fo){const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))err+='LINK: '+gl.getProgramInfoLog(pr);}
        out.push({n,err});} return out;}""", [PAIRS, S, VPRE, FPRE])
    bad = 0
    for r in res:
        print('PASS' if not r['err'] else 'FAIL', 'GLSL', r['n'], r['err'][:300]); bad += bool(r['err'])
    b.close(); sys.exit(1 if bad else 0)
