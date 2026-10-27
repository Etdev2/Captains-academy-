# Supabase sign-in setup

The academy account (issue #87) needs these settings in Supabase project `olyppmbeizisegrzwzgc` and in the Vercel project `cap`. They live in the dashboards, not in this repository. Claude applied steps 1 to 4 and 6 for Et on 2026-10-27 through the Supabase management API and the Vercel connector. Step 5 is still open.

## Supabase: Authentication settings

1. **Sign-in methods.** Email on, anonymous sign-ins on, manual linking on. Confirm email stays on.
2. **Code length.** Email OTP length is 6, so the code matches the account screen's "6-digit code" field. Supabase's default was 8.
3. **Site URL.** `https://cap-blond-pi.vercel.app`, the production domain.
4. **Redirect URLs.**
   - `https://cap-blond-pi.vercel.app/account/`
   - `http://localhost:5173/account/` for `npm run dev`
   - `http://localhost:4173/account/` for `vite preview`
   - `https://cap-*-etdev2s-projects.vercel.app/**` for Vercel preview deployments
5. **Email templates. Not done.** Add the code to the "Magic link", "Change email address" and "Confirm signup" templates, under the link:

   ```html
   <p>Or enter this code in the app: <strong>{{ .Token }}</strong></p>
   ```

   "Confirm signup" needs it too, because a new email address gets that template instead of the magic link. Supabase refuses template changes on a free-tier project that uses its built-in mailer. Connect custom SMTP first (see below), then edit the templates. Until then the emails carry only the link, and the code field on the account screen has nothing to take.

## Vercel

6. **Environment variables** on the `cap` project, for Production and Preview:
   - `VITE_SUPABASE_URL` = `https://olyppmbeizisegrzwzgc.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = the project's publishable key (`sb_publishable_…`), from Project Settings, API Keys

   The publishable key is meant for browser code. Never set a secret or service role key here; `src/auth/config.ts` refuses a key that starts with `sb_secret_`. Vite bakes these values into the build, so a change takes effect on the next deployment.

## Before real users arrive

- **Custom SMTP.** The built-in mailer sent at most 2 emails an hour on this project when it was checked on 2026-10-27. Connect a mail provider in Authentication, SMTP settings, then do step 5.
- **Abuse protection.** Anonymous sign-ins are on with no CAPTCHA. The #75 handoff asks for abuse protection before public traffic.
- **Counsel.** `counsel` checks G3 (13 and up) and the privacy policy, because an email address is personal data.

## Local development

Copy `.env.example` to `.env.local` and fill in both values. `.env.local` is ignored by git. With either value empty, the app has no sign-in and the Account link stays hidden.
