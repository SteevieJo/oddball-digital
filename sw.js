const CACHE='oddball-v1553';
const ASSETS=['./','./index.html','./style.css','./cards.js','./app.js','./court_texture.jpg','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin===self.location.origin && (event.request.mode==='navigate'||url.pathname.endsWith('/index.html'))){
    event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));
});

self.addEventListener('message',event=>{if(event.data&&event.data.type==='SKIP_WAITING')self.skipWaiting();});
