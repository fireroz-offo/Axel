/* DIVRIZ runtime — injected at the top of <head> inside the preview iframe.
 *
 * It turns ANY html animation into a deterministic, seekable "clock":
 *   - virtual performance.now / Date.now / requestAnimationFrame / setTimeout / setInterval
 *   - every CSS animation / transition / Web Animation (and GSAP, which runs on rAF) is driven by that clock
 *   - editor keyframes (#divriz-project JSON) are turned into Web Animations
 *   - frame capture: current DOM -> self-contained SVG(foreignObject) string, which the host rasterises
 *
 * Talks to the host only through postMessage. No external dependencies. Never contains a closing script tag.
 */
(function () {
  if (window.__divriz) return;
  var vt = 0; // virtual time in seconds
  var scripted = false; // page uses rAF / timers -> cannot rewind without a reload
  var rafs = [], rafId = 0, timers = [], tid = 0;
  var baseDate = Date.now();
  var inited = false, kfDone = false, initialSync = true;
  var seen = new WeakMap();
  var proj = { meta: { w: 1280, h: 720, fps: 30, dur: 10 }, kf: {} };
  var imgCache = {};

  /* ---------- virtual clock ---------- */
  try { performance.now = function () { return vt * 1000; }; } catch (e) {}
  try { Date.now = function () { return baseDate + vt * 1000; }; } catch (e) {}
  window.requestAnimationFrame = function (cb) { scripted = true; rafs.push({ id: ++rafId, cb: cb }); return rafId; };
  window.cancelAnimationFrame = function (id) { rafs = rafs.filter(function (r) { return r.id !== id; }); };
  function addTimer(fn, ms, args, every) {
    scripted = true;
    if (typeof fn === 'string') { var code = fn; fn = function () { (0, eval)(code); }; }
    var d = Math.max(0, +ms || 0) / 1000;
    var t = { id: ++tid, at: vt + d, fn: fn, a: args, every: every ? Math.max(d, 0.001) : 0 };
    timers.push(t);
    return t.id;
  }
  window.setTimeout = function (fn, ms) { return addTimer(fn, ms, [].slice.call(arguments, 2), false); };
  window.setInterval = function (fn, ms) { return addTimer(fn, ms, [].slice.call(arguments, 2), true); };
  window.clearTimeout = window.clearInterval = function (id) { timers = timers.filter(function (t) { return t.id !== id; }); };

  function step(dt) {
    var target = vt + dt, guard = 0;
    for (;;) {
      var nxt = null;
      for (var i = 0; i < timers.length; i++) if (timers[i].at <= target + 1e-9 && (!nxt || timers[i].at < nxt.at)) nxt = timers[i];
      if (!nxt || guard++ > 2000) break;
      vt = Math.max(vt, nxt.at);
      if (nxt.every) nxt.at += nxt.every; else timers = timers.filter(function (t) { return t !== nxt; });
      try { nxt.fn.apply(window, nxt.a); } catch (e) { console.error(e); }
    }
    vt = target;
    var list = rafs; rafs = [];
    for (var j = 0; j < list.length; j++) { try { list[j].cb(vt * 1000); } catch (e) { console.error(e); } }
  }

  /* ---------- editor keyframes -> Web Animations ---------- */
  var useIndiv = false;
  try { useIndiv = !!(window.CSS && CSS.supports && CSS.supports('translate', '1px') && CSS.supports('scale', '1')); } catch (e) {}
  function frameOf(k, offset) {
    var f = { offset: offset, opacity: String(k.o / 100), easing: k.e || 'ease' };
    if (useIndiv) { f.translate = k.x + 'px ' + k.y + 'px'; f.rotate = k.r + 'deg'; f.scale = String(k.s / 100); }
    else f.transform = 'translate(' + k.x + 'px,' + k.y + 'px) rotate(' + k.r + 'deg) scale(' + (k.s / 100) + ')';
    return f;
  }
  function applyKF() {
    if (kfDone) return;
    kfDone = true;
    try {
      var s = document.getElementById('divriz-project');
      if (s && s.textContent) {
        var j = JSON.parse(s.textContent);
        if (j.meta) for (var m in j.meta) proj.meta[m] = j.meta[m];
        if (j.kf) proj.kf = j.kf;
      }
    } catch (e) {}
    var dur = Math.max(0.1, proj.meta.dur || 10);
    Object.keys(proj.kf).forEach(function (id) {
      var list = (proj.kf[id] || []).slice().sort(function (a, b) { return a.t - b.t; });
      if (!list.length) return;
      var el = document.querySelector('[data-divriz-id="' + id + '"]');
      if (!el || !el.animate) return;
      var fr = list.map(function (k) { return frameOf(k, Math.min(1, Math.max(0, k.t / dur))); });
      if (fr[0].offset > 0) { var f0 = Object.assign({}, fr[0]); f0.offset = 0; fr.unshift(f0); }
      if (fr[fr.length - 1].offset < 1) { var f1 = Object.assign({}, fr[fr.length - 1]); f1.offset = 1; f1.easing = 'linear'; fr.push(f1); }
      try {
        var a = el.animate(fr, { duration: dur * 1000, fill: 'both', easing: 'linear', composite: useIndiv ? 'replace' : 'add' });
        a.pause(); a.__dk = 1; seen.set(a, 0);
      } catch (e) { console.error(e); }
    });
  }

  function syncAnims() {
    applyKF();
    if (!document.getAnimations) return;
    var list = document.getAnimations();
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (!seen.has(a)) { seen.set(a, initialSync ? 0 : vt); try { a.pause(); } catch (e) {} }
      try { a.currentTime = Math.max(0, (vt - seen.get(a)) * 1000); } catch (e) {}
    }
    initialSync = false;
  }

  function seek(t) {
    t = Math.max(0, +t || 0);
    if (t < vt - 1e-6 && scripted) return false; // host must reload, then seek forward
    if (!inited) { inited = true; syncAnims(); step(0); }
    var gap = t - vt;
    if (gap > 1e-9) {
      var dt = gap > 5 ? 1 / 30 : 1 / 60, n = Math.max(1, Math.ceil(gap / dt - 1e-9)), d = gap / n;
      for (var i = 0; i < n; i++) { step(d); if (scripted) syncAnims(); }
    }
    vt = t;
    syncAnims();
    return true;
  }

  /* ---------- info (auto duration) ---------- */
  function autoDuration() {
    var max = 0;
    try {
      applyKF();
      document.getAnimations().forEach(function (a) {
        if (a.__dk || !a.effect) return;
        var e = a.effect.getComputedTiming().endTime;
        if (isFinite(e) && e > max) max = e;
      });
      if (window.gsap && gsap.globalTimeline) {
        var gd = gsap.globalTimeline.duration();
        if (isFinite(gd) && gd < 600 && gd * 1000 > max) max = gd * 1000;
      }
    } catch (e) {}
    return max / 1000;
  }

  /* ---------- capture ---------- */
  var PROPS = ['opacity', 'transform', 'translate', 'rotate', 'scale', 'transform-origin', 'color', 'background-color', 'background-image',
    'background-position', 'background-size', 'border-color', 'border-width', 'border-radius', 'box-shadow', 'text-shadow', 'filter',
    'backdrop-filter', 'clip-path', 'width', 'height', 'top', 'left', 'right', 'bottom', 'margin-top', 'margin-right', 'margin-bottom',
    'margin-left', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'font-size', 'font-weight', 'letter-spacing',
    'line-height', 'visibility', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-dashoffset', 'outline-color',
    'mix-blend-mode', 'z-index'];

  function prepare() {
    var imgs = Array.prototype.slice.call(document.images || []);
    var jobs = imgs.map(function (im) {
      var src = im.currentSrc || im.src;
      if (!src || src.indexOf('data:') === 0 || imgCache[src]) return Promise.resolve();
      return fetch(src).then(function (r) { return r.blob(); }).then(function (b) {
        return new Promise(function (res) { var fr = new FileReader(); fr.onload = function () { imgCache[src] = String(fr.result); res(); }; fr.onerror = res; fr.readAsDataURL(b); });
      }).catch(function () {});
    });
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return Promise.all(jobs.concat([fonts.catch(function () {})]));
  }

  function snapshot(W, H) {
    var root = document.documentElement;
    var clone = root.cloneNode(true);
    var srcEls = root.querySelectorAll('*'), dstEls = clone.querySelectorAll('*');
    var idx = new Map();
    for (var i = 0; i < srcEls.length; i++) idx.set(srcEls[i], i);

    // computed values for everything that is (or was) animated
    var anims = document.getAnimations ? document.getAnimations() : [];
    var done = new Set();
    for (var k = 0; k < anims.length; k++) {
      var ef = anims[k].effect, tg = ef && ef.target;
      if (!tg || done.has(tg) || !idx.has(tg)) continue;
      done.add(tg);
      var cs = getComputedStyle(tg), dst = dstEls[idx.get(tg)];
      for (var p = 0; p < PROPS.length; p++) {
        var v = cs.getPropertyValue(PROPS[p]);
        if (v) dst.style.setProperty(PROPS[p], v);
      }
    }
    // canvas -> img, remote img -> inlined data url
    for (var c = 0; c < srcEls.length; c++) {
      var s = srcEls[c], d = dstEls[c];
      if (s.tagName === 'CANVAS') {
        try {
          var im = document.createElement('img');
          im.setAttribute('src', s.toDataURL());
          ['style', 'class', 'data-divriz-id', 'id'].forEach(function (n) { if (s.hasAttribute(n)) im.setAttribute(n, s.getAttribute(n)); });
          im.style.width = (s.style.width || s.clientWidth + 'px'); im.style.height = (s.style.height || s.clientHeight + 'px');
          d.parentNode.replaceChild(im, d);
        } catch (e) {}
      } else if (s.tagName === 'IMG') {
        var u = s.currentSrc || s.src;
        if (imgCache[u]) d.setAttribute('src', imgCache[u]);
      }
    }
    // drop scripts, kill animations in the frozen copy, :root -> html
    Array.prototype.slice.call(clone.querySelectorAll('script,noscript,iframe,video,audio')).forEach(function (n) { n.remove(); });
    Array.prototype.slice.call(clone.querySelectorAll('style')).forEach(function (st) { st.textContent = st.textContent.replace(/:root/g, 'html'); });
    var kill = document.createElement('style');
    kill.textContent = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';
    (clone.querySelector('head') || clone).appendChild(kill);

    // emulate root background propagation (body bg -> canvas)
    var hs = getComputedStyle(root), bs = document.body ? getComputedStyle(document.body) : null;
    clone.style.margin = '0';
    clone.style.width = W + 'px'; clone.style.height = H + 'px'; clone.style.overflow = 'hidden';
    if (bs && hs.backgroundColor === 'rgba(0, 0, 0, 0)' && hs.backgroundImage === 'none') {
      ['background-color', 'background-image', 'background-position', 'background-size', 'background-repeat'].forEach(function (pn) {
        clone.style.setProperty(pn, bs.getPropertyValue(pn));
      });
    }
    var xhtml = new XMLSerializer().serializeToString(clone);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><foreignObject x="0" y="0" width="' + W + '" height="' + H + '">' + xhtml + '</foreignObject></svg>';
  }

  /* ---------- host protocol ---------- */
  function reply(id, extra) {
    var m = { type: 'DIVRIZ_REPLY', id: id };
    for (var k in extra) m[k] = extra[k];
    parent.postMessage(m, '*');
  }
  window.addEventListener('message', function (e) {
    var m = e.data;
    if (!m || typeof m !== 'object' || e.source !== parent) return;
    try {
      if (m.type === 'seek') reply(m.id, { ok: seek(m.t) });
      else if (m.type === 'frame') { var ok = seek(m.t); reply(m.id, { ok: ok, svg: ok ? snapshot(m.w, m.h) : '' }); }
      else if (m.type === 'prepare') { applyKF(); prepare().then(function () { reply(m.id, { ok: true, scripted: scripted }); }); }
      else if (m.type === 'info') { applyKF(); reply(m.id, { ok: true, auto: autoDuration(), meta: proj.meta }); }
    } catch (err) { reply(m.id, { ok: false, error: String(err && err.message || err) }); }
  });
  window.__divriz = { seek: seek, snapshot: snapshot, prepare: prepare, autoDuration: autoDuration, time: function () { return vt; } };
})();
