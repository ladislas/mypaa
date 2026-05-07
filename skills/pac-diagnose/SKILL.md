---
name: pac-diagnose
description: "Run a disciplined diagnosis loop for hard bugs and performance regressions. Use when debugging failures, reproducing bugs, investigating flaky behavior, or diagnosing slow code."
license: MIT
compatibility: Pi coding agent; bash optional for HITL loop script
metadata:
  author: mypac
  stage: shared
---

# Diagnose

A disciplined loop for hard bugs and performance regressions. Skip phases only when explicitly justified.

When exploring the codebase, use the project's domain glossary when one exists, and respect settled decisions from issue comments, PR notes, ADR comments, or local docs.

## Phase 1 — Build a feedback loop

**This is the skill.** Everything else is mechanical. If you have a fast, deterministic, agent-runnable pass/fail signal for the bug, you can find the cause: bisection, hypothesis testing, and instrumentation all consume that signal. If you do not have one, code-reading guesses are not enough.

Spend disproportionate effort here. Be aggressive and creative.

### Ways to construct one

Try these in roughly this order:

1. **Failing test** at whatever seam reaches the bug — unit, integration, end-to-end.
2. **Curl or HTTP script** against a running dev server.
3. **CLI invocation** with fixture input, diffing stdout against a known-good snapshot.
4. **Headless browser script** using the repo's browser-test tool when available.
5. **Replay a captured trace** such as a real network request, payload, or event log through the code path in isolation.
6. **Throwaway harness** that exercises the bug code path with a single call and minimal dependencies.
7. **Property or fuzz loop** when the bug is intermittent wrong output.
8. **Bisection harness** when the bug appeared between two known commits, datasets, or versions.
9. **Differential loop** that runs the same input through old vs new versions, or two configs, and diffs outputs.
10. **HITL bash script** as a last resort. If a human must click, copy and edit [`scripts/hitl-loop.template.sh`](scripts/hitl-loop.template.sh) so the manual loop is still structured and produces captured values.

Build the right feedback loop, and the bug is mostly fixed.

### Iterate on the loop itself

Treat the loop as a product. Once you have _a_ loop, ask:

- Can it be faster? Cache setup, skip unrelated init, narrow the test scope.
- Can the signal be sharper? Assert on the specific symptom, not just "didn't crash".
- Can it be more deterministic? Pin time, seed randomness, isolate filesystem, freeze network.

A slow flaky loop is barely better than no loop. A fast deterministic loop is a debugging superpower.

### Non-deterministic bugs

The goal is a **higher reproduction rate**, not necessarily a clean 100% repro. Loop the trigger many times, parallelize, add stress, narrow timing windows, and inject sleeps when useful. A 50% flake is debuggable; 1% usually is not. Keep raising the rate until it is debuggable.

### When you cannot build a loop

Stop and say so explicitly. List what you tried. Ask the user for one of:

- access to the environment that reproduces it
- a captured artifact, such as a HAR file, log dump, core dump, or screen recording with timestamps
- permission to add temporary production or staging instrumentation

Do **not** proceed to hypothesis testing without a loop. Do not proceed to Phase 2 until you have a loop you believe in.

## Phase 2 — Reproduce

Run the loop. Watch the bug appear.

Confirm:

- [ ] The loop produces the failure mode the **user** described, not a nearby different failure.
- [ ] The failure reproduces across multiple runs, or for non-deterministic bugs, at a high enough rate to debug against.
- [ ] You captured the exact symptom: error message, wrong output, slow timing, UI state, or other observable behavior.

Do not proceed until you reproduce the bug.

## Phase 3 — Hypothesize

Generate **3–5 ranked hypotheses** before testing any of them. Single-hypothesis debugging anchors on the first plausible idea.

Each hypothesis must be **falsifiable** and state the prediction it makes:

> If `<X>` is the cause, then changing `<Y>` will make the bug disappear, or changing `<Z>` will make it worse.

If you cannot state the prediction, the hypothesis is a vibe. Discard or sharpen it.

Show the ranked list to the user before testing when the user is available. They often have domain knowledge that re-ranks instantly or know hypotheses already ruled out. If the user is AFK, proceed with your best ranking and document the choice.

## Phase 4 — Instrument

Each probe must map to a specific prediction from Phase 3. **Change one variable at a time.**

Tool preference:

1. **Debugger or REPL inspection** when the environment supports it.
2. **Targeted logs** at the boundaries that distinguish hypotheses.
3. Avoid "log everything and grep".

Tag every temporary debug log with a unique prefix such as `[DEBUG-a4f2]`. Cleanup then becomes a single search. Untagged logs tend to survive; tagged logs should be removed.

### Performance branch

For performance regressions, logs are usually the wrong tool. Establish a baseline measurement first using the repo's timing harness, profiler, query plan, or `performance.now()`-style instrumentation. Then bisect or compare configurations. Measure first, fix second.

## Phase 5 — Fix and regression-test

Write the regression test **before the fix**, but only if there is a **correct seam** for it.

A correct seam exercises the **real bug pattern** as it occurs at the call site. If the only available seam is too shallow — for example, a single-caller unit test when the bug requires multiple callers, or a helper test that cannot replicate the triggering chain — the regression test gives false confidence.

If no correct seam exists, that is itself a finding. Note it. The architecture is preventing the bug from being locked down. Flag this for Phase 6.

If a correct seam exists:

1. Turn the minimized repro into a failing test at that seam.
2. Watch it fail.
3. Apply the minimal fix.
4. Watch the test pass.
5. Re-run the Phase 1 feedback loop against the original, un-minimized scenario.

## Phase 6 — Cleanup and post-mortem

Required before declaring done:

- [ ] Original repro no longer reproduces.
- [ ] Regression test passes, or absence of a correct seam is documented.
- [ ] All `[DEBUG-...]` instrumentation is removed.
- [ ] Throwaway prototypes are deleted or moved to a clearly marked debug location if they must remain temporarily.
- [ ] The hypothesis that turned out correct is stated in the final summary, commit message, or PR notes.

Then ask: what would have prevented this bug?

If the answer involves architectural change — no good test seam, tangled callers, hidden coupling, shallow modules — hand off to `pac-improve-architecture` with the specifics. Make the recommendation **after** the fix is in, not before. You have more information after diagnosis than when you started.
