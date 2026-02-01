// ─── SERVICE WORKER ──────────────────────────────────────────────────────
const CACHE = 'biblioteca-v1';

// Arquivos que vão pro cache no install (app shell)
const SHELL = [
  '.',
  'manifest.json',
  'sw.js'
];

// ─── INSTALL — guarda o app shell no cache ───────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// ─── ACTIVATE — limpa caches antigas ─────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH — network-first para manter dados Firebase ao vivo ────────────
self.addEventListener('fetch', e => {
  // Requisições do Firebase (Firestore/Auth) sempre vão para a rede
  if (e.request.url.includes('firebaseio.com') ||
      e.request.url.includes('googleapis.com') ||
      e.request.url.includes('firebaseapp.com')) {
    return; // deixa o browser tratar normalmente
  }

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Se foi uma GET bem-sucedida, atualiza o cache
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // Sem rede? Tenta servir do cache
        return caches.match(e.request);
      })
  );
});
