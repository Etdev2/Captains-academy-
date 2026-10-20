#!/usr/bin/env bash
set -euo pipefail

# Prints the digest a proof bundle is tied to: every staged file outside proof/,
# by path, mode and content. Stage the change before running it.
repo="${1:-.}"

# -z prints raw, NUL-separated paths, so core.quotePath and other display
# settings cannot change the digest.
digest=$(git -C "$repo" ls-files --stage -z --full-name -- ':/' ':(top,exclude)proof' | sha256sum | cut -d' ' -f1)
printf 'sha256:%s\n' "$digest"
