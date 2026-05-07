# ADR Comment Format

ADRs for this workflow live as GitHub comments on the relevant issue.

Do not create repo-local `docs/adr/` files when following `pac-grill-with-docs`.

Create one ADR comment per important decision.

## Template

```md
<!-- pac:adr -->
# {Short title of the decision}

{1-3 sentences: what's the context, what did we decide, and why.}
```

That's it. An ADR can be a single paragraph. The value is in recording *that* a decision was made and *why* — not in filling out sections.

## Optional sections

Only include these when they add genuine value. Most ADRs will not need them.

- **Status** (`proposed | accepted | deprecated | superseded`) — useful when decisions are revisited
- **Considered Options** — only when the rejected alternatives are worth remembering
- **Consequences** — only when non-obvious downstream effects need to be called out

## Issue integration

After posting the ADR comment:

1. Add issue label `pac:adr` if it exists. If it is missing, warn clearly and tell the user to run `/pac-setup-workflows`; do not create labels from this workflow.
2. Update or create a `## Decisions` section in the issue body.
3. Add a bullet linking to the new ADR comment.

Example:

```md
## Decisions

- [Use GitHub issue comments for ADRs](https://github.com/owner/repo/issues/123#issuecomment-0000000000)
```

## When to offer an ADR

All three of these must be true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If a decision is easy to reverse, skip it — you'll just reverse it. If it's not surprising, nobody will wonder why. If there was no real alternative, there's nothing to record beyond "we did the obvious thing."
