/* DIVRIZ AI - cross-origin isolation shim for static hosting (no backend needed).
   COEP "credentialless" keeps public no-key APIs and model CDNs working. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  const r = event.request;
  if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;
  event.respondWith(
    fetch(r).then((res) => {
      if (res.status === 0 || res.type === 'opaque') return res;
      const h = new Headers(res.headers);
      h.set('Cross-Origin-Embedder-Policy', 'credentialless');
      h.set('Cross-Origin-Opener-Policy', 'same-origin');
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
    }).catch((e) => { console.error('coi-sw fetch failed', e); throw e; })
  );
});
