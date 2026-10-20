// Makes /play work offline after one online visit (DECISIONS.md G4). The
// service worker in public/sw.js serves cached files; this caches the files
// the first visit already loaded, which the worker could not see because it
// was not installed yet. Failures only mean no offline copy, never no game.

const CACHE = 'captains-academy-play-v1';

export async function enableOfflinePlay(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    const sameOrigin = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => new URL(url).origin === location.origin);
    const cache = await caches.open(CACHE);
    await cache.addAll([location.pathname, ...sameOrigin]);
  } catch {
    // Private windows and blocked storage just play online.
  }
}
