# Review Fix Findings Prompt

Use the latest review summary in this session and implement the review findings now.

## Commit discipline

{{commitDisciplineIntro}}
Do not inspect repository history to switch workflows mid-run.

{{workflowInstructions}}

## Fix instructions

1. Treat the summary's Findings/Fix Queue as a checklist.
2. Fix in priority order: P0, P1, then P2 (include P3 if quick and safe).
3. If a finding is invalid/already fixed/not possible right now, briefly explain why and continue.
4. Treat "Human Reviewer Callouts (Non-Blocking)" as informational only; do not convert them into fix tasks unless there is a separate explicit finding.
5. Follow fail-fast error handling: do not add local catch/fallback recovery unless this scope is an explicit boundary that can safely translate the failure.
6. If you add or keep a `try/catch`, explain the expected failure mode and either rethrow with context or return a boundary-safe error response.
7. JSON parsing/decoding should fail loudly by default; avoid silent fallback parsing.
8. Run relevant tests/checks for touched code where practical.

## After all fixes

1. List every {{preparedItemLabel}}: what was fixed{{preparedItemTargetDetail}}.
2. List fixed items, deferred/skipped items (with reasons), and verification results.
3. Ask the user for next steps:
   - Continue with more fixes
   - {{nextStepInstruction}}
   - Stop and leave {{preparedChangesLabel}} as-is
