# Review Summary Prompt

We are leaving a code-review session and returning to the main coding session.
Create a structured handoff that can be used immediately to implement fixes.

You MUST summarize the review that happened in this session so findings can be acted on.
Do not omit findings: include every actionable issue that was identified.

Required sections (in order):

## Review Scope

- What was reviewed (files/paths, changes, and scope)

## Verdict

- "correct" or "needs attention"

## Findings

For EACH finding, include:

- Priority tag ([P0]..[P3]) and short title
- File location (`path/to/file.ext:line`)
- Why it matters (brief)
- What should change (brief, actionable)

## Fix Queue

1. Ordered implementation checklist (highest priority first)

## Constraints & Preferences

- Any constraints or preferences mentioned during review
- Or "(none)"

## Human Reviewer Callouts (Non-Blocking)

Include only applicable callouts (no yes/no lines):

- **This change adds a database migration:** `files/details`
- **This change introduces a new dependency:** `package(s)/details`
- **This change changes a dependency (or the lockfile):** `files/package(s)/details`
- **This change modifies auth/permission behavior:** `what changed and where`
- **This change introduces backwards-incompatible public schema/API/contract changes:**
  `what changed and where`
- **This change includes irreversible or destructive operations:** `operation and scope`

If none apply, write "- (none)".

These are informational callouts for humans and are not fix items by themselves.

Preserve exact file paths, function names, and error messages where available.
