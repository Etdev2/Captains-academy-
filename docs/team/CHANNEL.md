# Channel

Cross-role findings. One file per message, in [`channel/`](channel/). **Do not add
entries to this file.**

## How to send a message

Create a new file. Never edit or delete someone else's.

```
docs/team/channel/YYYY-MM-DD-NN-fromrole-to-torole.md
```

`NN` is the next number not already used. Run `ls docs/team/channel/` and add one.

## Format

```
### 2026-10-20 | architect -> ux-ui
The form saves through the sync queue, so a save can succeed offline and fail an
hour later. The screen needs a pending state, not just success and error.
```

Two or three sentences. Use this when you learn something *another role* needs, not to
narrate your own work, which goes in the worklog.

## Replying

Create a new file addressed back to them. Do not edit theirs.

## Reading your mail

```
ls docs/team/channel/ | grep -- '-to-.*architect'   # addressed to architect
ls docs/team/channel/ | grep -- '-to-all'           # addressed to everyone
cat docs/team/channel/2026-10-20-*.md               # one day, in order
```

Filenames carry the sender and recipient so you can read only your own mail
instead of the whole board.

## Why one file per message

Two agents appending to one shared file conflict every time. Separate files never do.
