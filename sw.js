// Service worker: lets PokéInfo open without internet and be installed as an app.
// It keeps a copy of the site's own files. Data from PokeAPI, TCGdex and the news file is saved by the page
// itself (see api() in js/app.js), which falls back to saved copies when offline.
//
// Site files are fetched from the network first, so a new version shows up right away; the saved copy is
// only used when the network fails. Bump SHELL when the list of files below changes.
const SHELL = 'pokeinfo-shell-v2';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'js/theme.js', 'js/data.js', 'js/guides.js', 'js/names.js', 'js/i18n.js', 'js/icons.js',
  'js/cards.js', 'js/collection.js', 'js/news.js', 'js/app.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('pokeinfo-shell-') && k !== SHELL).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // other sites: let the browser handle them
  event.respondWith(fetch(req)
    .then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(SHELL).then(cache => cache.put(req, copy)); }
      return res;
    })
    .catch(() => caches.match(req, { ignoreSearch: true }).then(saved => saved || caches.match('index.html'))));
});
