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

Load this skill whenever you are about to:

- Create a new repo-owned skill under `skills/`
- Rename an existing skill
- Refactor a skill's layout, helper files, or references

## Verify the Pi skill contract first

Per the installed Pi docs, a skill is a directory containing `SKILL.md`, and the frontmatter `name` must match the parent directory exactly.

Use this shape:

```text
skills/pac-<name>/
  SKILL.md
  [helper files]
```

## Naming rules for this repo

**Use the `pac-` prefix for every repo-owned skill.**

Examples:

- `skills/pac-github/SKILL.md`
- `skills/pac-pi-extension/SKILL.md`
- `skills/pac-pi-prompt/SKILL.md`

This avoids collisions with external skills that Pi may also discover.

The skill frontmatter must match the directory name exactly:

```yaml
---
name: pac-<name>
description: "What the skill does and when to use it."
---
```

Do not use unprefixed repo-local names like `github`, `uv`, or `pi-extension`.

## Description guidance

The `description` controls whether the model loads the skill, so write it as:

- specific about the task
- explicit about when to use the skill
- narrow enough to avoid accidental invocation for unrelated work

Good:

```yaml
description: "Author or update a Pi prompt file for this repo. Use when creating a new slash command or editing an existing prompt in prompts/."
```

Poor:

```yaml
description: "Helps with prompts."
```

## Layout rules

Keep all files for a skill inside that skill directory. Common patterns:

```text
skills/pac-<name>/
  SKILL.md
  helper.sh
  notes.md
  examples/
```

- Put helper scripts, notes, and examples inside the skill directory.
- Reference sibling files with relative paths from `SKILL.md`.
- Avoid scattering skill-specific files elsewhere in the repo unless the user explicitly asked for that design.

## Renaming a skill safely

When renaming a skill:

1. Rename the directory so it matches the new skill name.
2. Update the `name:` field in `SKILL.md` to the same value.
3. Update repo references in `AGENTS.md`, docs, prompts, tests, and other skills.
4. Verify no stale references remain.

The directory name and `name:` field must stay in lockstep.

## Related guidance

- If the work is about prompt templates under `prompts/`, also load `skills/pac-pi-prompt/SKILL.md`.
- If the work is about Pi extensions under `extensions/`, load `skills/pac-pi-extension/SKILL.md`.

## Checklist before committing a skill change

- [ ] Skill directory is named `skills/pac-<name>/`
- [ ] `SKILL.md` exists and `name:` matches the directory name exactly
- [ ] `description` says what the skill does and when to use it
- [ ] Helper files stay inside the skill directory
- [ ] References in `AGENTS.md`, docs, prompts, tests, and sibling skills are updated when renaming
- [ ] The changed skill reads cleanly end-to-end and follows the installed Pi skills contract
