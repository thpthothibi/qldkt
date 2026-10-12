/* Only a public offline page is cached. Never cache config, login, marks or API traffic. */
const CACHE='htb-offline-v13';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.add(new URL('offline.html',self.registration.scope).href)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('htb-offline-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url),scope=new URL(self.registration.scope);
 if(request.method!=='GET'||request.mode!=='navigate'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 event.respondWith(fetch(request).catch(()=>caches.open(CACHE).then(cache=>cache.match(new URL('offline.html',self.registration.scope).href))));
});
