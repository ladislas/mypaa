---
name: pac-review-standard
description: Standard structured review lane for correctness, scope, maintainability, and verification gaps.
license: MIT
---

# Standard Review Lane

Use this asset with `skills/pac-review-shared/SKILL.md`.

## Goal

Produce a structured standard review from the normalized packet and source change context.

## Instructions

- Review for correctness, scope alignment, maintainability risks, and verification gaps.
- Use the shared report contract exactly.
- Reason from the normalized packet and source change context.
- Keep unknown packet fields unknown and report any unverified delegation or packet-derivation guarantees honestly.
- Do not consume prior adversarial findings as input.
- Return only the final report.
