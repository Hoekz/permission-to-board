var CACHE_NAME = 'permission-to-board-v1';
var urlsToCache = [
    '/',
    '/css/colors.css',
    '/css/style.css',
    '/img/background.jpg',
    '/img/city.jpg',
    '/img/icon.jpg',
    '/img/map.jpg',
    '/img/title.jpg',
    '/img/train_overlay.jpg',
    '/js/app.js',
    '/js/api.js',
    '/js/authorize.js',
    '/js/bind.js',
    '/js/calc.js',
    '/js/db.js',
    '/js/draw.js',
    '/js/show-error.js',
    '/js/show-game.js',
];

self.addEventListener('install', function(event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(urlsToCache); })
    );
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request).then(function(response) { return response || fetch(event.request); })
    );
});
