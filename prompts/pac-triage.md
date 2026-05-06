---
description: "Triage GitHub issues through mypac's label-based issue workflow"
argument-hint: "[issue URL | issue number | triage request]"
---

Use the optional argument after `/pac-triage` as the triage request. It may be:

- a GitHub issue URL or number
- a request such as `show what needs attention`
- a quick state override such as `move #42 to ready-for-agent`
- free text describing an issue to classify
- nothing, in which case show issues needing attention

Read and follow `skills/pac-triage/SKILL.md`.

Use `gh` for GitHub reads and writes. Before posting comments, changing labels, or closing issues, report the concrete action unless the user explicitly requested that exact action.

**Provided arguments**: $@
