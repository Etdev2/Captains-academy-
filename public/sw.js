// Offline support for every page on the site: the game at /play (DECISIONS.md
// G4) and the sea-time log at /log (A3). Each page caches its own files on
// first load (see src/offline/offline.ts); this worker serves them when the
// network is gone.
// Built files have content hashes in their names, so a cached copy never goes
// stale: pages are fetched fresh when online and fall back to the cache.

// Must match CACHE_NAME in src/offline/offline.ts. Activating a new name
// deletes the old cache, so old copies never linger.
const CACHE = 'captains-academy-offline-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
