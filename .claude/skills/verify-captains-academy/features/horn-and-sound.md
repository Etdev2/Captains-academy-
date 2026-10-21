# Horn and sound

Two buttons at the top-left work in every level. SOUND switches the game's audio on and off, and the setting is saved on the device. HORN sounds one short blast of about a second (Rule 32), shown as blue rings spreading from the boat, so it works muted and for deaf players (G16). A second press during a blast does nothing.

## Sub-features

- `sound-toggle` switches sound off and on from the SOUND button or the M key, and the button reads SOUND OFF or SOUND ON.
- `sound-saved` keeps the sound setting after a reload.
- `horn-blast` sounds the horn from the HORN button or the H key and shows the rings for about a second.

## How to get to it (user POV)

- Tap SOUND or HORN at the top-left of `/play/`.
- Press M for sound or H for the horn on a keyboard.

## Driving it with control.sh

Preconditions:

- `control.sh doctor` passes.

- **Sound off by button.** Open the page and tap SOUND. Steps `{"do":"open","viewport":"desktop"}`, `{"do":"tap","x":84,"y":38}`, `{"do":"wait","ms":300}`, `{"do":"screenshot","name":"sound-off"}`. The log shows `muted` true and the screenshot shows SOUND OFF.
- **Saved.** Reload. Steps `{"do":"reload"}`, `{"do":"wait","ms":1500}`. `muted` is still true.
- **Sound on by key.** Press M. Step `{"do":"key","key":"m"}`. `muted` is false.
- **Horn by button.** Tap HORN and take a screenshot at once. Steps `{"do":"tap","x":60,"y":94}`, `{"do":"screenshot","name":"horn"}`. The log shows `horn` true and the screenshot shows the rings around the boat. After a second and a half `horn` is false again.
- **Horn by key.** Press H. Step `{"do":"key","key":"h"}`. `horn` is true.
- **Recipe.** `features/steps/horn-and-sound.steps.json`.

## Gotchas

- `horn` is true only while the blast lasts, about a second. Check it in the step straight after the press.
- The sound setting lives in the device's saved data, so each `open` starts with sound on. A recipe that reloads keeps it.
- Headless Chromium plays no audio. The proof is the button label, the `muted` and `horn` state and the rings, not something heard.
