// The account screen at /account (issue #87). Signing in is optional: nothing
// else in the app needs an account, and everything that works offline keeps
// working signed out. Controls are tall enough for a gloved thumb (AGENTS.md).

import { useEffect, useState, type FormEvent } from 'react';
import type { AuthError, Session, SupabaseClient } from '@supabase/supabase-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/auth/client';
import {
  cleanCode,
  isCompleteCode,
  sendSignInEmail,
  verifyCode,
  type SentEmail,
} from '@/auth/flow';

const TALL = 'h-14 text-lg md:text-lg';

type Busy = 'idle' | 'sending' | 'verifying' | 'signing-out';

export function App() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex flex-col gap-2">
        <a href="/" className="text-muted-foreground text-base underline underline-offset-4">
          Captain's Academy
        </a>
        <h1 className="text-3xl font-semibold">Account</h1>
      </header>
      {supabase ? (
        <AccountScreen client={supabase} />
      ) : (
        <p data-testid="not-set-up">
          Sign-in is not set up on this copy of the app. Everything else works without an account.
        </p>
      )}
    </main>
  );
}

function AccountScreen({ client }: { client: SupabaseClient }) {
  const auth = client.auth;
  const online = useOnline();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<SentEmail | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<Busy>('idle');
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    void auth.getSession().then(({ data, error }) => {
      setSession(data.session);
      if (error) setProblem(describe(error));
    });
    const { data } = auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [auth]);

  const user = session && session.user.is_anonymous !== true ? session.user : null;

  async function run(kind: Busy, work: () => Promise<void>) {
    setBusy(kind);
    setProblem(null);
    try {
      await work();
    } catch (error) {
      setProblem(describe(error));
    } finally {
      setBusy('idle');
    }
  }

  function onSend(event: FormEvent) {
    event.preventDefault();
    const address = email.trim();
    void run('sending', async () => {
      const redirectTo = new URL('/account/', location.origin).href;
      setSent(await sendSignInEmail(auth, address, redirectTo));
      setCode('');
    });
  }

  function onVerify(event: FormEvent) {
    event.preventDefault();
    if (!sent) return;
    const token = cleanCode(code);
    if (!isCompleteCode(token)) {
      setProblem('Enter the 6-digit code from the email.');
      return;
    }
    void run('verifying', async () => {
      await verifyCode(auth, sent, token);
      setSent(null);
      setCode('');
    });
  }

  function onSignOut() {
    void run('signing-out', async () => {
      const { error } = await auth.signOut({ scope: 'local' });
      if (error) throw error;
      setSession(null);
    });
  }

  return (
    <section className="flex flex-col gap-6" aria-live="polite">
      {!online && (
        <Alert data-testid="offline">
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>
            Signing in needs a connection. The rest of the app works without one.
          </AlertDescription>
        </Alert>
      )}
      {problem && (
        <Alert variant="destructive" data-testid="problem">
          <AlertTitle>That didn't work</AlertTitle>
          <AlertDescription>{problem}</AlertDescription>
        </Alert>
      )}

      {session === undefined ? (
        <p className="text-muted-foreground">Checking sign-in…</p>
      ) : user ? (
        <div className="flex flex-col gap-4" data-testid="signed-in">
          <p className="text-lg">
            Signed in as <strong className="break-all">{user.email}</strong>
          </p>
          <Button variant="outline" className={TALL} onClick={onSignOut} disabled={busy !== 'idle'}>
            Sign out
          </Button>
        </div>
      ) : sent ? (
        <form className="flex flex-col gap-4" onSubmit={onVerify} data-testid="code-form">
          <p>
            We emailed a sign-in link to <strong className="break-all">{sent.email}</strong>. Tap it
            on this phone, or enter the 6-digit code from the same email.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="code" className="text-base">
              6-digit code
            </Label>
            <Input
              id="code"
              className={`${TALL} tracking-[0.3em]`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={9}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
          <Button type="submit" className={TALL} disabled={!online || busy !== 'idle'}>
            {busy === 'verifying' ? 'Signing in…' : 'Sign in'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={TALL}
            onClick={() => {
              setSent(null);
              setProblem(null);
            }}
          >
            Use a different email
          </Button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={onSend} data-testid="email-form">
          <p className="text-muted-foreground">
            An account is optional. Nothing in the app needs one. There is no password: we email you
            a link and a code.
          </p>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-base">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              className={TALL}
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <Button type="submit" className={TALL} disabled={!online || busy !== 'idle'}>
            {busy === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
          </Button>
        </form>
      )}
    </section>
  );
}

function useOnline(): boolean {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

function describe(error: unknown): string {
  const code = (error as Partial<AuthError> | null)?.code;
  switch (code) {
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many emails were sent. Wait a few minutes, then try again.';
    case 'otp_expired':
      return 'That code is wrong or has expired. Check the newest email, or send a new one.';
    case 'email_address_invalid':
      return 'That email address does not look right. Check it and try again.';
    default:
      return navigator.onLine
        ? 'Something went wrong. Try again in a minute.'
        : 'Signing in needs a connection. Try again when you are back online.';
  }
}
