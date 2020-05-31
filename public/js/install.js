var CACHE_NAME = 'permission-to-board-v1';
var urlsToCache = [
    '/',
    '/__/firebase/3.8.0/firebase-app.js',
    '/__/firebase/3.8.0/firebase-auth.js',
    '/__/firebase/3.8.0/firebase-database.js',
    '/__/firebase/init.js',
    '/css/colors.css',
    '/css/style.css',
    '/img/background.jpg',
    '/img/city.png',
    '/img/icon.png',
    '/img/map.png',
    '/img/title.png',
    '/img/train_overlay.png',
    '/img/train-count.png',
    '/js/router.js',
    '/js/api.js',
    '/js/authorize.js',
    '/js/calc.js',
    '/js/db.js',
    '/js/draw.js',
    '/js/drag.js',
    '/js/game.js',
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
