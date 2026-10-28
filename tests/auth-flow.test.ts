import { describe, expect, it, vi } from 'vitest';
import {
  cleanCode,
  isCompleteCode,
  sendSignInEmail,
  verifyCode,
  type AuthApi,
} from '../src/auth/flow';

// Issue #87: which call sends the sign-in email, for no session, a guest
// (anonymous) session, and a guest whose email already has an account.

const email = 'mate@example.com';
const redirectTo = 'https://cap-blond-pi.vercel.app/account/';

function fakeAuth(options: {
  session?: { is_anonymous: boolean } | null;
  updateError?: { code: string; message: string } | null;
  otpError?: { code: string; message: string } | null;
}) {
  const session = options.session ? { user: { is_anonymous: options.session.is_anonymous } } : null;
  const auth = {
    getSession: vi.fn(async () => ({ data: { session }, error: null })),
    updateUser: vi.fn(async () => ({ data: {}, error: options.updateError ?? null })),
    signInWithOtp: vi.fn(async () => ({ data: {}, error: options.otpError ?? null })),
    verifyOtp: vi.fn(async () => ({ data: {}, error: null })),
  };
  return { auth, api: auth as unknown as AuthApi };
}

describe('sendSignInEmail', () => {
  it('signs in with a one-time code when there is no session', async () => {
    const { auth, api } = fakeAuth({ session: null });
    await expect(sendSignInEmail(api, email, redirectTo)).resolves.toEqual({
      email,
      codeType: 'email',
    });
    expect(auth.updateUser).not.toHaveBeenCalled();
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email,
      options: { emailRedirectTo: redirectTo },
    });
  });

  it('adds the email to a guest session, keeping the guest user', async () => {
    const { auth, api } = fakeAuth({ session: { is_anonymous: true } });
    await expect(sendSignInEmail(api, email, redirectTo)).resolves.toEqual({
      email,
      codeType: 'email_change',
    });
    expect(auth.updateUser).toHaveBeenCalledWith({ email }, { emailRedirectTo: redirectTo });
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('signs a guest in to the existing account when the email is already registered', async () => {
    const { auth, api } = fakeAuth({
      session: { is_anonymous: true },
      updateError: { code: 'email_exists', message: 'already registered' },
    });
    await expect(sendSignInEmail(api, email, redirectTo)).resolves.toEqual({
      email,
      codeType: 'email',
    });
    expect(auth.updateUser).toHaveBeenCalledOnce();
    expect(auth.signInWithOtp).toHaveBeenCalledOnce();
  });

  it('passes on any other guest upgrade error', async () => {
    const error = { code: 'over_email_send_rate_limit', message: 'slow down' };
    const { auth, api } = fakeAuth({ session: { is_anonymous: true }, updateError: error });
    await expect(sendSignInEmail(api, email, redirectTo)).rejects.toBe(error);
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('passes on a sign-in error', async () => {
    const error = { code: 'over_email_send_rate_limit', message: 'slow down' };
    const { api } = fakeAuth({ session: null, otpError: error });
    await expect(sendSignInEmail(api, email, redirectTo)).rejects.toBe(error);
  });
});

describe('verifyCode', () => {
  it('verifies with the type that matches the email that was sent', async () => {
    const { auth, api } = fakeAuth({});
    await verifyCode(api, { email, codeType: 'email_change' }, '123456');
    expect(auth.verifyOtp).toHaveBeenCalledWith({ email, token: '123456', type: 'email_change' });
  });
});

describe('codes', () => {
  it('drops spaces and accepts exactly six digits', () => {
    expect(cleanCode(' 123 456 ')).toBe('123456');
    expect(isCompleteCode('123456')).toBe(true);
    expect(isCompleteCode('12345')).toBe(false);
    expect(isCompleteCode('1234567')).toBe(false);
    expect(isCompleteCode('12a456')).toBe(false);
  });
});
