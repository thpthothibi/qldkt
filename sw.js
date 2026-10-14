const CACHE='htb-public-htb-release-20261014-r1';
const PUBLIC=new Set(['app.js','style.css','clean.css','ui.css','school-logo.png','transport.js','pwa.js','xlsx.full.min.js','manifest.webmanifest','favicon.png','favicon.ico','icons/icon-192.png','icons/icon-512.png','offline.html']);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.add(new URL('offline.html',self.registration.scope))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>(k.startsWith('htb-public-')||k.startsWith('htb-offline-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url),scope=new URL(self.registration.scope);
 if(e.request.method!=='GET'||u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname))return;
 const relative=u.pathname.slice(scope.pathname.length);
 if(PUBLIC.has(relative)){e.respondWith(caches.open(CACHE).then(async c=>{const cached=await c.match(e.request);if(cached)return cached;const response=await fetch(e.request);if(response.ok)c.put(e.request,response.clone());return response;}));return;}
 if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>caches.open(CACHE).then(c=>c.match(new URL('offline.html',scope).href))));
});
