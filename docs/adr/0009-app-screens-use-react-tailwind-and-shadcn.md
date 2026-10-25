---
status: proposed
---

# App screens use React, Tailwind CSS and shadcn/ui; the arcade game stays as built

The site's pages are plain TypeScript with hand-written CSS in each page. The app is about to grow: a prototype review hub that works across projects, a database with sign-in (DECISIONS.md A1), and more sea-time log screens. Those are mostly forms, lists, dialogs and tables. On 2026-10-25 Et decided to build them with Tailwind CSS and shadcn/ui and to keep the arcade game the same. This record turns that call into rules. It stays proposed until Et merges it.

## Decision

- **Scope.** App screens move to React, Tailwind CSS and shadcn/ui: the front page at `/`, the sea-time log at `/log`, the prototype review hub, and later sign-in, account and dashboard screens.
- **The game does not change.** The arcade game at `/play` and the Chapter 1 levels at `/rules` keep their current HTML, CSS and Phaser code. `src/game` and `src/sim` never import React, Tailwind or shadcn components. ADR 0001 and ADR 0008 still govern them.
- **Stack.** React 19 with `@vitejs/plugin-react` 5 (the release that supports Vite 7), Tailwind CSS 4 through `@tailwindcss/vite`, and shadcn/ui components. Vite, strict TypeScript, Vitest and Playwright stay as they are. Each new package is pinned to an exact version, and installs use `npm ci`.
- **Components are owned code.** shadcn components live in `src/components/ui/` and belong to this repo. Change them there. Never wrap them to work around a default. The shadcn CLI cannot reach its registry from the agents' containers, so the first components were copied from the shadcn repository at commit `481d523374745e77d0cf9c53a4115ab5dd7c8481` (`apps/v4/registry/new-york-v4/ui/`), with only their imports changed to this repo's paths.
- **One theme file.** Colors, radius and type are CSS variables in one Tailwind theme with light and dark values. Pages follow the phone's light or dark setting, as they do now. The frontend direction chosen in the prototype review is applied there, not page by page.
- **Readable in both themes.** Text meets WCAG AA contrast in light and dark, and pages pass the axe checks in `e2e/`. Et chose on 2026-10-25 to keep shadcn's standard control sizes.
- **Red and green stay reserved.** G15 keeps red and green out of the game's interface because they mean port and starboard. App screens follow the same rule, so the theme has no red or green tokens. shadcn's red "destructive" style uses a different color plus an icon and words such as "Delete". Et can relax this for app screens with a separate call.
- **Offline still works.** React and Tailwind output are ordinary built files, so the service worker caches them as it caches today's pages. The sea-time log keeps working offline after one visit (DECISIONS.md, Sea-time log). Fonts are system fonts or files in the repo, never a font loaded from the network.
- **Import boundaries are lint rules.** ESLint forbids `react`, `react-dom`, `@radix-ui/*` and `src/components/**` inside `src/game` and `src/sim`, the way ADR 0001 keeps Phaser out of `src/sim`. The existing boundaries stay: the game never imports the sea-time log, and the log never imports the game.

## Migration order

Each step is its own pull request. Each keeps the existing Playwright and axe tests for that page passing, and changes a test only to follow a deliberate change in behavior.

1. Set up React, Tailwind and shadcn, the theme and the lint boundaries.
2. Build the prototype review page as a decision board, the design Et picked from the wireframes on 2026-10-25. It replaces the plain gallery. Steps 1 and 2 land together in draft PR #73.
3. Move the sea-time log at `/log`. Its offline, storage and one-thumb tests are the contract.
4. Move the front page at `/`.

## Considered options

- **Keep plain CSS and TypeScript.** It costs nothing now. Every new form, dialog and table would still be hand-built, and keyboard and focus behavior would be rebuilt each time.
- **Tailwind CSS without React.** It gives one styling system but no components, so dialogs, menus and form controls stay hand-built.
- **Web components such as Web Awesome.** They work without React. Et chose shadcn/ui, and agents write React and shadcn more reliably because far more code uses them.
- **A packaged component library such as MUI or Chakra.** These are heavier and harder to restyle, and their code is not ours to change.
- **Moving the game too.** Phaser draws the game on a canvas, so Tailwind and shadcn add nothing there, and moving it would put its golden replays and tested screens at risk for no gain.

## Consequences

- The first page on the stack, the decision board, loads 137 KB of compressed JavaScript and 9 KB of compressed CSS. React, Radix, the icons and zod make up most of it. The game pages load none of it. A cached page loads offline as before.
- The site has two UI approaches: React and shadcn for app screens, and plain HTML with Phaser for the game. The lint boundaries keep them apart.
- `scripts/verify.sh` covers the new code without changes: TypeScript, ESLint, Prettier, Vitest, `vite build`, Playwright and `npm audit`.
- The verification skill `verify-captains-academy` drives the game, so it does not change.
- Open for Et: whether app screens follow the no-red, no-green rule (proposed here as yes), the font once a frontend direction is chosen, and whether `AGENTS.md` keeps describing the hardest user as a mariner wearing gloves.
