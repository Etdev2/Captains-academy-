// Offline support shared by every page on the site: the game at /play
// (DECISIONS.md G4) and the sea-time log at /log (A3: "an offline-capable,
// phone-friendly web app"). The service worker in public/sw.js serves cached
// files when the network is gone. This module registers it and caches the
// files the first visit already loaded, which the worker could not see because
// it was not installed yet. A failure only means no offline copy, never a
// broken page.

// Must match CACHE in public/sw.js. tests/offline.test.ts checks that it does.
export const CACHE_NAME = 'captains-academy-offline-v1';

export async function enableOffline(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    const sameOrigin = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => new URL(url).origin === location.origin);
    const cache = await caches.open(CACHE_NAME);
    // One at a time rather than addAll, which stores nothing if any single
    // file fails. A file that fails here is fetched and cached on next use.
    const urls = [...new Set([location.pathname, ...sameOrigin])];
    await Promise.allSettled(urls.map((url) => cache.add(url)));
  } catch {
    // Private windows and blocked storage just work online.
  }
}
