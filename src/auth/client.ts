// The one Supabase client (issue #87), or null when the build has no Supabase
// variables. PKCE keeps the code verifier in this browser's local storage, so a
// sign-in link only works in the browser that asked for it. The account screen
// also takes the 6-digit code from the same email for that reason.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { authConfig } from './config';

export const supabase: SupabaseClient | null = authConfig
  ? createClient(authConfig.url, authConfig.publishableKey, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    })
  : null;
