// The academy account is optional (issue #87, DECISIONS.md G4). A build without
// both Supabase variables has no client: the account screen says sign-in is not
// set up, the front page hides its Account link, and every other page works as
// before. This file imports nothing, so the front page can check it without
// loading the Supabase client.

export interface AuthConfig {
  url: string;
  publishableKey: string;
}

export function readAuthConfig(env: Record<string, unknown>): AuthConfig | null {
  const url = env['VITE_SUPABASE_URL'];
  const key = env['VITE_SUPABASE_PUBLISHABLE_KEY'];
  if (typeof url !== 'string' || typeof key !== 'string') return null;
  const trimmedUrl = url.trim();
  const trimmedKey = key.trim();
  if (trimmedUrl === '' || trimmedKey === '') return null;
  // A secret key bypasses row level security. It must never reach a browser,
  // so a build given one gets no client at all.
  if (trimmedKey.startsWith('sb_secret_')) return null;
  return { url: trimmedUrl, publishableKey: trimmedKey };
}

export const authConfig = readAuthConfig(import.meta.env);
