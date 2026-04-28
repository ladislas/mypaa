---
name: pac-pi-skill
description: "Author, rename, or refactor a Pi skill for this repo. Use when creating a new skill under skills/, renaming one, or updating its structure and references."
license: MIT
compatibility: Pi coding agent
metadata:
  author: mypac
  stage: shared
---

# Author a Pi skill for this repo

Adapted for `mypac` from Matt Pocock's [`write-a-skill`](https://github.com/mattpocock/skills/tree/main/skills/productivity/write-a-skill) guidance.

Load this skill whenever you are about to:

- Create a new repo-owned skill under `skills/`
- Rename an existing skill
- Refactor a skill's layout, support files, or references

## Process

1. **Gather requirements**
   - What task does the skill cover?
   - What concrete triggers should cause Pi to load it?
   - Does it need only instructions, or also support files or scripts?
2. **Draft the skill**
   - Write `SKILL.md` with concise instructions.
   - Add support files only when they make the skill clearer or more reliable.
   - Keep skill-specific files inside the skill directory.
3. **Review the change**
   - Check naming, descriptions, references, and any renamed paths.
   - Ask the user to confirm when the desired behavior or scope is still ambiguous.

## Repo contract

Per Pi's skill contract, a skill is a directory containing `SKILL.md`, and the frontmatter `name` must match the parent directory exactly.

Use this shape:

```text
skills/pac-<name>/
  SKILL.md
  [support files]
```

Rules for this repo:

- Use the `pac-` prefix for every repo-owned skill.
- Do not use unprefixed local names like `github` or `uv`.
- Keep all support files inside the skill directory.
- When renaming a skill, update `AGENTS.md`, docs, prompts, tests, and sibling skills that reference it.

## Description requirements

The `description` is what Pi sees when deciding whether to load the skill, so make it specific.

Write it in two parts:

1. What the skill does
2. `Use when ...` with concrete triggers, contexts, or file locations

Good:

```yaml
description: "Author or update a Pi prompt file for this repo. Use when creating a new slash command or editing an existing prompt in prompts/."
```

Bad:

```yaml
description: "Helps with prompts."
```

## When to add support files

Add support files when:

- `SKILL.md` would otherwise become long or unfocused
- examples or reference material are useful but not always needed
- a deterministic helper script is more reliable than regenerated code

Common layout:

```text
skills/pac-<name>/
  SKILL.md
  REFERENCE.md
  EXAMPLES.md
  scripts/
```

## Related guidance

- If the work is about prompt templates under `prompts/`, also load `skills/pac-pi-prompt/SKILL.md`.
- If the work is about Pi extensions under `extensions/`, also load `skills/pac-pi-extension/SKILL.md`.

## Review checklist

- [ ] Directory is named `skills/pac-<name>/`
- [ ] `SKILL.md` exists and `name` matches the directory exactly
- [ ] `description` states the capability and `Use when ...` triggers
- [ ] Support files stay inside the skill directory
- [ ] Renamed or moved skills have updated references
- [ ] The skill reads cleanly end-to-end without extra speculation
