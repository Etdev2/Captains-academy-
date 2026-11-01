# Supabase progress and prototype backend

Owner request: [#74](https://github.com/Etdev2/Captains-academy-/issues/74).
Project: `olyppmbeizisegrzwzgc`.
API URL: `https://olyppmbeizisegrzwzgc.supabase.co`.
Applied migration: `20261025174104_guest_progress_and_prototype_feedback`.

## What exists

- `study_progress` stores one JSON object per guest, kind and resource. Kinds are mission and mastery. The database stamps update times and increments a revision on every update.
- `prototype_assets` stores each image's title, style, category, source and URL. Only published rows can be read by visitors. Catalog changes require an operator.
- `prototype_feedback` stores one editable rating from 1 through 10, comment and optional display label per guest and prototype. Other guests cannot read the feedback.
- All three tables enforce row level security. Visitors cannot read or change another guest's progress or ratings. Anonymous API requests can only read published catalog entries.

No image catalog entries have been imported. The repository's prototype images are under docs/prototypes, which Vite does not publish as static assets. Copy approved images into a served folder or upload them before adding catalog URLs. Preserve original provenance and use image IDs independent of filenames.

## No login screen

Use a Supabase anonymous session when the visitor first requests cloud persistence. It supplies an ownership ID without asking for email or password. Reuse the existing session. Do not create a new session on every page load.

The frontend integration still needs to be built. No app code, dependency, environment variable, auth setting or deployment changed in this backend setup.

Before integrating, enable anonymous sign-ins in Supabase Authentication settings. The connector used for setup cannot read or change this setting, so its current value is unverified. Verify signup against the real Auth API and apply the documented abuse protections before opening the app to public traffic.

A guest is a browser session, not a verified collaborator. Clearing browser storage loses access to the session's cloud data. Another device starts a different session. Do not advertise cross-device recovery or one vote per person until account linking or a separately approved sharing mechanism exists.

## Frontend implementation contract

1. Pin the current Supabase JS dependency and update the lockfile using the repository's prescribed npm version. Use the generated database types.
2. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Use the project's enabled publishable key. Never place a service role or secret key in browser code.
3. Keep src/game/storage.ts local-first. Do not put Supabase imports inside src/sim. Save locally before queueing cloud writes; retain failed writes and retry after connectivity returns.
4. Validate cloud payloads with Zod before merging. Mission payloads contain stars and bestFrames. Mastery payloads contain right, wrong and streak. Do not replace local progress with an empty or stale cloud record.
5. Use revision comparisons for conditional updates and retry after conflicts. The server increments revision on every update. The database does not merge progress automatically.
6. Render the prototypes route from published catalog entries. Provide style/category filters, a 1–10 selector, an optional comment and optional display label. Upsert on user_id,prototype_id. Show pending, saved and failed states.
7. Keep collaborator comments private. Owner-only results should show rating count alongside average and distribution. Never expose an admin key to build the results page.
8. Run verify.test.sh, verify.sh, browser checks and the proof scripts. Prove offline save/retry, page reload, two independent guest sessions, editable ratings, style filters and owner results before marking the app integration ready.

## Operator results query

Run only from the SQL editor or an authorized server, not from a browser client:

```sql
select p.id, p.title, p.style,
       count(f.rating) as rating_count,
       round(avg(f.rating), 2) as average_rating,
       count(*) filter (where f.rating >= 8) as ratings_8_to_10
from public.prototype_assets p
left join public.prototype_feedback f on f.prototype_id = p.id
group by p.id, p.title, p.style
order by average_rating desc nulls last, rating_count desc;
```

## Verification

The committed SQL test ran against the actual project using temporary users and assets inside a transaction. It passed ownership isolation, forbidden ownership transfers, guest catalog permissions, hidden assets, rating bounds, duplicate ratings and server revision checks. The transaction rolled back. All three application tables were verified empty afterward.

Supabase security advisors returned no findings. Performance advisors reported only that the new prototype foreign-key index has not been used yet. Keep the index as feedback grows.

Repository verify and browser checks were not run. The terminal could not authenticate a git clone. The SQL, generated types and this handoff were saved through the GitHub connector. This draft must not be treated as a frontend release or a PASS proof bundle.

Sources:
- https://supabase.com/docs/guides/auth/auth-anonymous
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/getting-started/api-keys
