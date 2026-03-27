#!/usr/bin/env bash
#MISE description="Lint Markdown files"
set -euo pipefail

mapfile -t files < <(git ls-files '*.md')
existing_files=()

for file in "${files[@]}"; do
  if [[ -f "$file" ]]; then
    existing_files+=("$file")
  fi
done

if ((${#existing_files[@]} == 0)); then
  exit 0
fi

markdownlint-cli2 "${existing_files[@]}"
