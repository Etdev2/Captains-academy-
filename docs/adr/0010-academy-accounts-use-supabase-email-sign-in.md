---
status: proposed
---

# Academy accounts use Supabase email sign-in and stay optional

Et asked for sign-in on 2026-10-27, before the repository goes public, and chose optional accounts with email sign-in (issue #87). DECISIONS.md G4 already says no account is needed to start, and A1 gives the academy its own Supabase project. This record turns that call into rules. It stays proposed until Et merges it.

## Decision

- **Optional.** Nothing in the app requires an account. Everything that works offline and signed out today keeps working that way. A build without `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` has no Supabase client: `/account/` says sign-in is not set up and the front page hides its Account link.
- **Email link plus code, no password.** The account screen at `/account/` sends one email that carries a sign-in link and a 6-digit code. The client uses the PKCE flow, so a link only works in the browser that asked for it. A link tapped in a mail app often opens a different browser, so the screen also takes the code.
- **Guests keep their user ID.** If the browser holds an anonymous Supabase session (#75), the screen calls `updateUser({ email })`, so the guest's user ID and its rows become the account's. If that email already belongs to an account, the screen signs in to that account with `signInWithOtp` and leaves local progress untouched. Merging a guest's progress into an existing account belongs to the sync ticket.
- **One client.** `src/auth/client.ts` creates the only Supabase client. The front page loads it only when the build has the settings. Browser code only ever gets the publishable key, and `src/auth/config.ts` refuses a secret key.
- **Sign-out is local.** Signing out ends the session in this browser only. Other devices stay signed in.

## Considered options

- **Magic link only.** It is simpler, but on a phone the link often opens a browser that lacks the PKCE verifier, and sign-in fails.
- **Password.** It adds reset flows and a credential to leak, for no gain over an emailed code.
- **Google and Apple sign-in.** Left for later. Each needs its own provider setup, and Apple's needs a paid developer account.

## Consequences

- The emails carry the code only after the Supabase templates include `{{ .Token }}`. Supabase refuses template changes on the free tier without custom SMTP, so until custom SMTP is connected the emails carry only the link. See `docs/product/supabase-auth-setup.md`.
- The built-in Supabase mailer sends only a few emails an hour, so custom SMTP is needed before real users arrive.
- An email address is personal data. `counsel` checks G3 and the privacy policy before sign-in goes live.
- Playwright runs a second production build with Supabase settings on port 4174. Its tests answer every Auth API call with `page.route`, so the suite never sends a real email.
