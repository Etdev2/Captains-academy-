// Sign-in by email link or 6-digit code (issue #87). No password.
//
// A guest who already has an anonymous Supabase session keeps their user ID:
// updateUser adds the email to that user, so their guest rows become the
// account's. If the email already belongs to an account, the guest signs in to
// that account instead and local progress stays as it is. Merging guest
// progress into an existing account belongs to the sync ticket.

import type { SupabaseClient } from '@supabase/supabase-js';

export type AuthApi = Pick<
  SupabaseClient['auth'],
  'getSession' | 'updateUser' | 'signInWithOtp' | 'verifyOtp'
>;

/** The verifyOtp type that matches the email that was sent. */
export type CodeType = 'email' | 'email_change';

export interface SentEmail {
  email: string;
  codeType: CodeType;
}

export async function sendSignInEmail(
  auth: AuthApi,
  email: string,
  redirectTo: string,
): Promise<SentEmail> {
  const { data } = await auth.getSession();
  if (data.session?.user.is_anonymous === true) {
    const { error } = await auth.updateUser({ email }, { emailRedirectTo: redirectTo });
    if (!error) return { email, codeType: 'email_change' };
    if (error.code !== 'email_exists') throw error;
  }
  const { error } = await auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } });
  if (error) throw error;
  return { email, codeType: 'email' };
}

export async function verifyCode(auth: AuthApi, sent: SentEmail, token: string): Promise<void> {
  const { error } = await auth.verifyOtp({ email: sent.email, token, type: sent.codeType });
  if (error) throw error;
}

/** Codes are 6 digits. People paste them with spaces, so those are dropped. */
export function cleanCode(input: string): string {
  return input.replace(/\s+/g, '');
}

export function isCompleteCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
