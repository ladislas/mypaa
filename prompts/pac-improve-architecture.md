---
description: "Review a codebase for deepening opportunities, then grill a chosen architecture candidate"
argument-hint: "[GitHub issue/PR | todo ID | free text]"
---

Use the optional argument after `/pac-improve-architecture` as the thing to review. It may be:

- a free-form description of the work
- a GitHub issue or PR URL
- a todo ID (for example `TODO-abc123`)
- nothing, in which case infer from the conversation and ask only if unclear

Read and follow `skills/pac-improve-architecture/SKILL.md`.

If the work is issue-backed and the user wants durable PRD or ADR write-back, suggest or chain to `/pac-grill-with-docs` instead of inventing repo-local planning docs.

**Provided arguments**: $@
