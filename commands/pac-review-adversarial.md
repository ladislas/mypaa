---
description: Run the adversarial analysis-only review workflow
subtask: true
---

# Run an adversarial review

Run the adversarial review workflow for `$ARGUMENTS` or the current change context.

## Workflow

1. Prepare one normalized review target packet for this review.
2. Derive requested target, branch, base branch, diff source, and OpenSpec context from observable evidence in that order, keeping unknowns explicit.
3. Load `skills/pac-review-shared/SKILL.md` for the shared packet and report contract.
4. Load `skills/pac-review-adversarial/SKILL.md` for the adversarial-lane instructions.
5. Launch the review in a fresh delegated context.
6. No command-level preferred route is configured in v1. Report preferred route status as `unavailable` and note that adversarial independence relies on fresh delegated context alone.
7. Do not imply a routing guarantee that was not configured.
8. If delegation freshness or preferred routing cannot be verified, say so clearly instead of implying stronger isolation than was actually achieved.
9. Return only the final structured adversarial review report.

## Constraints

- Analysis only
- Do not edit files, apply patches, stage changes, or create commits
- Do not consume prior standard-review findings as adversarial review input
- Do not advertise or rely on a per-invocation `--model` override
