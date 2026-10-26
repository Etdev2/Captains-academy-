# Interactive prototypes: builder brief

The shared brief for the five category builders. The lead (Tiller Davit) owns this file. Each builder also gets a short assignment naming its category, its folder and its journey. [`assignments.md`](assignments.md) holds the records.

## What we are making

Elliott and collaborators are choosing the product's design direction. Each of five categories gets **three structurally different variants** of its primary screen, plus the supporting screens its core journey needs:

| Variant | Name | Direction |
| --- | --- | --- |
| A | Night Bridge | Develops the Captain's Console night-bridge mockups in `docs/prototypes/captains-console/` (see `source/console.css`): a dark instrument panel, dense, mono eyebrows, amber for "needs attention", ice blue for "done". |
| B | Clean & Light | A bright nautical workspace built for reading: chart-paper and white surfaces, navy ink, large type, generous spacing, obvious structure. |
| C | Guided Mentor | Task first. It walks the sailor through their next action one step at a time, in a mentor's plain voice, with progress shown as a route, and leaves detail for later. |

Variants must differ in **layout, information hierarchy and interaction pattern**, not only in color. Dashboard against list-detail against wizard is the kind of difference we want. A palette swap is not.

Every variant shows the same sailor and numbers from `src/prototypes/live/shared/sample.ts`. Derive from it, and never contradict it.

## The contract

- The page is `/prototypes/live/?category=<id>&variant=<a|b|c>[&screen=<step>]`, rendered by `src/prototypes/live/Shell.tsx`. The shell draws the frame (back to the Decision Desk, category picker, A/B/C switcher, "sample data" badge). Your variant renders below it, inside `#variant-root`.
- Your folder's `index.tsx` default-exports `CategoryVariants` (`{ a, b, c }`) from `shared/types.ts`. Each component receives `{ variant }`.
- Use `useScreen([...steps])` from `shared/routes.ts` for journey steps, so every step has a shareable URL. **The first step is the primary screen**: the Decision Desk screenshot is taken there with `&frame=0`, at 1440×900 and 390×844, full page.
- Link to other categories with `liveHref(category, variant)` and keep the same variant, so a reviewer stays in one direction.
- A sticky header uses `top: var(--live-frame-h)`. A fixed bottom bar needs nothing extra, but pad the page so the bar never covers content.

## File ownership

- You write **only** inside `src/prototypes/live/<your-folder>/` and your own time card. Nothing else.
- Read anything. Do not edit `shared/`, `Shell.tsx`, `live.css`, other categories, `src/components/ui/`, `src/styles/`, `docs/`, configs or tests. If you need a shared change, work around it locally and name the request in your report.
- Do not run git commands that change anything: no add, commit, stash, checkout or reset. The lead commits.

## Styling

- Put your styles in your own CSS file(s) in your folder, imported from your components. Scope every selector under a root class with your prefix (`.con-`, `.lic-`, `.sea-`, `.stu-`, `.arc-`, then the variant letter, as in `.sea-a`). Tailwind utilities and the shadcn components in `src/components/ui/` are allowed. Set your palette variables (`--background`, `--foreground` and the rest) on your variant root so shadcn components follow your palette and not the phone's dark setting.
- Each variant root sets its own background, text color and `color-scheme`, and is at least `100dvh` tall.
- Use system fonts only, never from the network. Icons come from `lucide-react`.
- **No red or green for status.** DECISIONS.md G15 keeps them for port and starboard. Use amber for "needs attention" and blue for "done", always with an icon and words. Red and green are fine when they *are* navigation lights.

## Accessibility and devices

- Must work at 360 to 430 px wide (iPhone) and at 1440 px (desktop), with no horizontal page scroll.
- Touch targets at least 44 × 44 px. The hardest user is a mariner on deck, in sun, possibly in gloves, with one hand free.
- Body text at least 16 px. Contrast at least WCAG AA. Visible focus. Real `<button>`, `<a>`, `<label>` and headings in order. Respect `prefers-reduced-motion`.
- Include at least one useful **empty state** reachable in the demo, such as a filter with no results, nothing due this week, or no weak topics.

## Content rules

These rules come from AGENTS.md and are not negotiable:

- Say logged sea time **"appears to meet"** a requirement and list what is still needed. Never say "you qualify", "approved" or "eligible".
- Label backfilled sea time as backfilled. Never show it as GPS-verified.
- Simulator and arcade time never counts as sea time. Say so where it could be confused.
- Only the OUPV near-coastal sea-service figures are checked (`verified: true` in `sample.ts`). Show every other license figure, form rule, exam pass mark or deadline marked `illustrative` as **illustrative**.
- Never imply a prototype guarantees Coast Guard approval. The National Maritime Center decides.
- Every variant shows its own small "Sample data" marker, so a screenshot without the frame still says so.
- Demo only: keep state in React. No `localStorage`, IndexedDB, network or analytics. Never import `src/log/store`, `src/store`, `src/game` or anything that writes. Pure, read-only data from `src/sim` or `src/log/rules` is fine.
- UI copy is short, plain and concrete. Read `.claude/skills/unslop/SKILL.md` before writing it.

## Checks before you report

1. `npx prettier --write src/prototypes/live/<folder>`
2. `npx eslint --max-warnings=0 src/prototypes/live/<folder>`, clean.
3. `npx tsc --noEmit`, with no errors in your folder. Errors elsewhere belong to other builders; ignore them.
4. In a real browser: run `npx vite --port <your port> --strictPort` in the background. Open every screen of all three variants at 390×844 and at 1440×900 with Playwright: `const { chromium } = require('/opt/node22/lib/node_modules/playwright')`, and `chromium.launch()` needs no options. Check for no console errors and no horizontal overflow (`document.documentElement.scrollWidth <= innerWidth`). Look at the screenshots yourself, fix what is broken, then stop the server. Keep screenshots in `/tmp/claude-0/-home-user-Captains-academy-/d679d277-3ea7-5959-b16a-19db2cca6f60/scratchpad/<folder>/`, never in the repo.

## Your report (under 300 words)

- Each variant's structure in one line: layout, hierarchy and interaction.
- The `screen` ids per variant and what each shows. The first id is the primary screen.
- The empty state(s) and how to reach them.
- Check results with real exit codes.
- Requests for shared changes, and known gaps.
