---
description: "Zoom out from a code area and produce a higher-level map of relevant modules and callers"
argument-hint: "[code area | issue/PR URL | todo ID | free text]"
---

Use the optional argument after `/pac-zoom-out` as the area to map. It may be:

- a file, directory, symbol, feature area, or free-form description
- a GitHub issue or PR URL
- a todo ID (for example `TODO-abc123`)
- nothing, in which case infer the area from the conversation and ask only if unclear

Goal: go up one layer of abstraction. Give the user a concise mental map of the relevant modules, callers, data/control flow, and how this area fits into the bigger picture.

Behavior:

1. Resolve the target from the argument or conversation.
2. Read only the minimum files or issue/todo context needed to build the map.
3. Use project domain vocabulary from `CONTEXT.md` or nearby docs when available.
4. Present the map without proposing implementation changes unless the user asks.

Suggested output shape:

- **Area** — what you mapped
- **Big picture** — how this area fits into the system
- **Modules** — the relevant modules and what each owns
- **Callers / entry points** — how this area is reached
- **Flow** — important data or control flow
- **Useful next reads** — files or docs worth opening next

**Provided arguments**: $@
