// This worker only controls the independent quick-note page, never the accounting apps.
const CACHE='quick-notes-v4';
const ASSETS=['./','./index.html','./app.js?v=silent-1','./manifest.webmanifest','../demo.css?v=native-1','../theme.js?v=system-bars-1','../voice-expense.js?v=silent-1','../voice-expense-parser.js?v=1','../pending-expenses.js?v=silent-1','../native-note-bridge.js?v=2','../icons/icon-192.png','../icons/icon-512.png'];
const urls=new Set(ASSETS.map(path=>new URL(path,self.location.href).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('quick-notes-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'&&url.pathname.startsWith(self.registration.scope.replace(url.origin,''))){event.respondWith(fetch(event.request).catch(()=>caches.match(new URL('./index.html',self.location.href).href)));return;}
 if(urls.has(url.href))event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}return response;}).catch(()=>caches.match(event.request)));
});
