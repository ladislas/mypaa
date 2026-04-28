---
name: pac-pi-extension
description: "Create or refactor a Pi extension safely. Use when starting new extension work, adding helper modules to an existing extension, or colocating tests. Covers layout, modularization, tests, and CI alignment."
license: MIT
compatibility: Pi coding agent; Node.js project with npm test / npm run typecheck.
metadata:
  author: mypac
  stage: shared
---

# Create or refactor a Pi extension safely

Load this skill whenever you are about to:

- Create a new Pi extension
- Add a helper module or test to an existing extension
- Refactor extension code that currently lives at `extensions/` top level

## Process

1. **Gather requirements**
   - What surface are you adding or changing: command, tool, hook, UI, or background behavior?
   - Is this a trivial single-file extension, or should it be a directory-based extension?
   - What support modules or tests should be colocated with it?
2. **Choose the layout**
   - Default to a dedicated directory for anything non-trivial.
   - Keep support files inside the extension directory.
3. **Implement carefully**
   - Keep the entrypoint focused on extension wiring as much as practical.
   - Move parsing, rendering, state, or other reusable logic into sibling modules when that keeps the change local and easier to test.
4. **Verify the result**
   - Check imports against the installed Pi docs and examples for this repo's pinned version.
   - Run the relevant tests, then run `npm test` and `npm run typecheck` before finishing meaningful extension work.

## The core hazard

Pi auto-discovers every `.ts` or `.js` file directly under `extensions/` and loads it as an extension entrypoint. This means:

> What is safe in a normal TypeScript project — extracting a helper file — is **unsafe** if that file lands at `extensions/` top level.

The broken layout looks perfectly reasonable. That is why this skill exists.

## Layout rules

### Single-file extension (trivial only)

Use a top-level entrypoint file only when the extension fits entirely in one file and has no helpers or tests:

```text
extensions/answer.ts
extensions/answer.js
```

### Multi-file extension (default for anything non-trivial)

Use a dedicated directory. The entrypoint must be `index.ts` or `index.js`:

```text
extensions/<name>/index.ts          ← entrypoint, loaded by Pi (or index.js)
extensions/<name>/helper.ts         ← safe sibling, not auto-discovered
extensions/<name>/helper.test.mjs   ← test, colocated
```

Never place helpers or tests directly under `extensions/`.

## When to split modules

Split logic into sibling modules when:

- the entrypoint starts mixing wiring with parsing, state, rendering, or prompt-building logic
- a pure helper can be tested in isolation
- the same logic would otherwise be duplicated inside handlers or hooks

Do not split files just for ceremony. The goal is to keep changes local and easy to understand.

## Tests

- **Colocate tests** inside the extension directory, not in a separate top-level folder.
- Name test files so Node's test runner discovers them (for example `*.test.mjs`).
- Add or update focused tests when extracting helper logic or changing non-trivial behavior.
- Run the full suite before and after meaningful extension changes:

  ```bash
  npm test
  npm run typecheck
  ```

## Verify against the installed Pi package version before implementing

Patterns in Pi evolve. Before locking in imports or API usage:

1. Check the docs and examples that ship with the installed `@mariozechner/pi-coding-agent` version in this repo first (for example under `node_modules/@mariozechner/pi-coding-agent/docs/` and `.../examples/`).
2. Verify which packages and imports are canonical for that installed version — do not rely on memory.
3. Treat upstream `pi-mono` as an optional cross-check only when you are intentionally preparing for, or evaluating, a version bump.
4. Use the `pac-librarian` skill to cache a local copy of upstream `pi-mono` only for that upgrade-oriented comparison.

Implement only after confirming the patterns match the version pinned in this repo. Tooling drift has caused real bugs.

## Checklist before committing extension work

- [ ] No new `.ts` or `.js` files created directly under `extensions/` that are not real entrypoints
- [ ] Multi-file extensions use `extensions/<name>/index.ts` or `extensions/<name>/index.js`
- [ ] Helper modules live inside `extensions/<name>/`
- [ ] Tests are colocated inside `extensions/<name>/`
- [ ] Entry-point changes keep wiring and reusable logic separated as much as practical
- [ ] `npm test` passes
- [ ] `npm run typecheck` passes
- [ ] Imports verified against the docs/examples for the installed Pi package version in this repo
