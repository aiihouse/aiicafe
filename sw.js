var CACHE = 'aiicafe-v2';
var PRE = [
  '/', '/index.html',
  '/assets/images/Asset_6.png', '/assets/images/Asset_9.png',
  '/assets/videos/opt/hero.mp4',
  '/assets/videos/opt/poster1.jpg', '/assets/videos/opt/poster2.jpg',
  '/assets/videos/opt/poster3.jpg', '/assets/videos/opt/poster4.jpg'
];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(PRE) }).then(function() { return self.skipWaiting() }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(k) {
    return Promise.all(k.filter(function(n) { return n !== CACHE }).map(function(n) { return caches.delete(n) }));
  }).then(function() { return self.clients.claim() }));
});

self.addEventListener('fetch', function(e) {
  var u = new URL(e.request.url);

  // Videos, images: cache-first (serve from cache instantly, update in background)
  if (u.pathname.match(/\.(mp4|png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    e.respondWith(caches.open(CACHE).then(function(c) {
      return c.match(e.request).then(function(r) {
        var net = fetch(e.request).then(function(res) { if (res.ok) c.put(e.request, res.clone()); return res }).catch(function() { return r });
        return r || net;
      });
    }));
    return;
  }

  // Fonts: cache-first
  if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(CACHE).then(function(c) {
      return c.match(e.request).then(function(r) {
        if (r) return r;
        return fetch(e.request).then(function(res) { if (res.ok) c.put(e.request, res.clone()); return res });
      });
    }));
    return;
  }

  // HTML: network-first
  e.respondWith(fetch(e.request).then(function(res) {
    if (res.ok) { var cl = res.clone(); caches.open(CACHE).then(function(c) { c.put(e.request, cl) }) }
    return res;
  }).catch(function() { return caches.match(e.request) }));
});
