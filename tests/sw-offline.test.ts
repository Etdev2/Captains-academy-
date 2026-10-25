import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type Handler = (event: { request: Request; respondWith: (p: Promise<Response>) => void }) => void;

function loadSw(cached: Record<string, string>) {
  const handlers: Record<string, Handler> = {};
  const store = new Map(Object.entries(cached));
  const caches = {
    match: async (req: Request | string, opts?: { ignoreSearch?: boolean }) => {
      const url = new URL(typeof req === 'string' ? req : req.url);
      const key = opts?.ignoreSearch ? url.origin + url.pathname : url.href;
      const body = store.get(key);
      return body === undefined ? undefined : new Response(body);
    },
    open: async () => ({ put: async () => {}, match: async () => undefined }),
    keys: async () => [],
    delete: async () => true,
  };
  const self = {
    location: { origin: 'https://app.test' },
    addEventListener: (type: string, fn: Handler) => (handlers[type] = fn),
    skipWaiting: () => {},
    clients: { claim: async () => {} },
  };
  const fetch = () => Promise.reject(new TypeError('offline'));
  new Function('self', 'caches', 'fetch', readFileSync('public/sw.js', 'utf8'))(
    self,
    caches,
    fetch,
  );
  return async (url: string) => {
    let out: Promise<Response> | undefined;
    const request = { url, method: 'GET', mode: 'navigate' } as unknown as Request;
    const onFetch = handlers.fetch;
    if (!onFetch) throw new Error('no fetch handler');
    onFetch({ request, respondWith: (p) => (out = p) });
    if (!out) throw new Error('no response');
    return out;
  };
}

describe('sw offline navigation', () => {
  it('serves cached /rules/ for /rules/?level=lights', async () => {
    const nav = loadSw({ 'https://app.test/rules/': 'rules' });
    expect(await (await nav('https://app.test/rules/?level=lights')).text()).toBe('rules');
  });
  it('does not ignore the query for other pages', async () => {
    const nav = loadSw({ 'https://app.test/log/': 'log' });
    expect((await nav('https://app.test/log/?x=1')).type).toBe('error');
  });
});
