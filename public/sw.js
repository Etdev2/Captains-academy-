// Offline support for every page on the site: the game at /play (DECISIONS.md
// G4) and the sea-time log at /log (A3). Each page caches its own files on
// first load (see src/offline/offline.ts); this worker serves them when the
// network is gone.
// Built files have content hashes in their names, so a cached copy never goes
// stale: pages are fetched fresh when online and fall back to the cache.

// Must match CACHE_NAME in src/offline/offline.ts. When the name changes,
// activate moves what the old caches hold into the new one, then deletes them.
// A page cached under the old name, such as /play from before the sea-time
// log, still opens offline even if the visitor's first visit after the change
// is to another page.
const CACHE = 'captains-academy-offline-v1';

async function carryOverOldCaches() {
  const current = await caches.open(CACHE);
  for (const name of await caches.keys()) {
    if (name === CACHE) continue;
    if (name.startsWith('captains-academy-')) {
      const old = await caches.open(name);
      for (const request of await old.keys()) {
        if (await current.match(request)) continue;
        const response = await old.match(request);
        if (response) await current.put(request, response);
      }
    }
    await caches.delete(name);
  }
}

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    carryOverOldCaches()
      .catch(() => {
        // Storage trouble only costs the old offline copies.
      })
      .then(() => self.clients.claim()),
  );
});

// The internal prototype review gallery at /prototypes (issue #72) works
// online only. Its review images add up to tens of megabytes, so neither the
// page nor anything it loads goes into the offline cache.
function isPrototypeReview(request) {
  const under = (url) => Boolean(url) && new URL(url).pathname.startsWith('/prototypes/');
  return under(request.url) || under(request.referrer);
}

// Offline navigation fallback. Exact match first; /rules/ also ignores the
// query string so /rules/?level=lights is served from the cached /rules/.
async function offlinePage(request) {
  const exact = await caches.match(request);
  if (exact) return exact;
  if (new URL(request.url).pathname === '/rules/') {
    const page = await caches.match(request, { ignoreSearch: true });
    if (page) return page;
  }
  return Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (isPrototypeReview(request)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => offlinePage(request)),
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
