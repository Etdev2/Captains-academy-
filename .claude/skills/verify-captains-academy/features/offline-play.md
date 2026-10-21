# Offline play

After one visit with a connection, the game loads and plays with no network (G4). A service worker keeps the page and its files.

## Sub-features

- `offline-cache` stores the page and the game files during the first visit.
- `offline-reload` loads and runs the level after a reload with the network off.

## How to get to it (user POV)

- Open `/play/` once online, then open it again in airplane mode.

## Driving it with control.sh

Preconditions:

- `control.sh doctor` passes.

- **First visit.** Open the page and wait for the offline cache. Steps `{"do":"open","viewport":"desktop"}`, `{"do":"waitForOfflineCache"}`.
- **No network.** Go offline, reload, let the level run and take a screenshot. Steps `{"do":"offline","on":true}`, `{"do":"reload"}`, `{"do":"wait","ms":3000}`, `{"do":"screenshot","name":"offline"}`, `{"do":"expect","field":"frame","gt":30}`. The level runs and the screenshot shows the harbor.
- **Recipe.** `features/steps/offline-play.steps.json`.

## Gotchas

- The service worker only controls the page after the first load finishes, so going offline before `waitForOfflineCache` passes proves nothing.
- `vite preview` keeps serving while the context is offline, so the proof is the context's own offline switch, not stopping the server.
