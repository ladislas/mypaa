# Copilot PR Review Bake-off

## Goal

Evaluate whether GitHub Copilot PR review is good enough for async pre-merge AI review before building a custom Pi-in-CI workflow.

This exists because the immediate need is to avoid blocking locally while `/review` runs on large PRs. A Pi-powered GitHub Actions workflow is still possible, but should be justified by concrete gaps in Copilot rather than built first.

## Candidate paths

1. **Copilot PR review first**: lowest maintenance if the feedback is useful enough.
2. **Pi in CI later**: only if Copilot misses needs that are specific to this repository or workflow.

Pi CI may be worth prototyping if we need:

- reuse of `skills/pac-review/SKILL.md`
- custom severity grouping or PR comment format
- opt-in label semantics such as `ai-review`
- control over model/provider/configuration
- dogfooding Pi as a reusable CI automation layer

## Bake-off setup

Use a representative PR, not just a documentation-only PR. Prefer a PR that changes behavior and includes enough diff surface for review quality to matter.

If no representative PR exists yet, open a low-risk setup PR for this playbook, but do not treat it as the final bake-off sample.

## Trial checklist

On the representative PR:

- [ ] Request or enable GitHub Copilot PR review.
- [ ] Save a link to the Copilot review output.
- [ ] Run the local Pi review workflow for comparison, for example `/review-start branch main` from the PR branch.
- [ ] Compare whether Copilot catches the same high-signal issues as Pi.
- [ ] Record any gaps below.
- [ ] Decide whether Copilot is good enough or Pi CI needs a prototype.

## Good-enough criteria

Copilot is good enough if it:

- runs async without blocking local development
- produces actionable findings, not mostly style noise
- catches the important correctness, security, performance, and maintainability issues a human would expect from an AI first pass
- keeps review setup and maintenance simpler than a custom GitHub Actions workflow

Copilot is not good enough if it repeatedly misses issues that the Pi review rubric is designed to catch, or if the workflow cannot support the way this repo wants review feedback delivered.

## Gap log

Use this table while evaluating.

| Gap | Example PR/comment | Why it matters | Pi CI justified? |
| --- | --- | --- | --- |
| _TBD_ | _TBD_ | _TBD_ | _TBD_ |

## Decision outcomes

After the bake-off, choose one:

- **Use Copilot**: close the Pi CI path for now and document any setup notes.
- **Prototype Pi CI**: create a follow-up issue with the concrete gaps Copilot failed to cover.
- **Defer AI PR review**: if neither path is worth the maintenance or cost yet.
