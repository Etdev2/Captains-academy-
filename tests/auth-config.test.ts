import { describe, expect, it } from 'vitest';
import { readAuthConfig } from '../src/auth/config';

// Issue #87: no Supabase client unless the build has both variables.

const url = 'https://olyppmbeizisegrzwzgc.supabase.co';
const key = 'sb_publishable_example';

describe('readAuthConfig', () => {
  it('returns the URL and key when both are set', () => {
    expect(readAuthConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key })).toEqual({
      url,
      publishableKey: key,
    });
  });

  it('returns null when either variable is missing or blank', () => {
    expect(readAuthConfig({})).toBeNull();
    expect(readAuthConfig({ VITE_SUPABASE_URL: url })).toBeNull();
    expect(readAuthConfig({ VITE_SUPABASE_PUBLISHABLE_KEY: key })).toBeNull();
    expect(
      readAuthConfig({ VITE_SUPABASE_URL: '  ', VITE_SUPABASE_PUBLISHABLE_KEY: key }),
    ).toBeNull();
    expect(
      readAuthConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: '' }),
    ).toBeNull();
  });

  it('refuses a secret key, which must never reach a browser', () => {
    expect(
      readAuthConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_abc' }),
    ).toBeNull();
  });
});
