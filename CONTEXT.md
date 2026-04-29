# mypac

`mypac` is Ladislas's personal Pi package: an opinionated collection of reusable Pi assets and workflow conventions for planning, implementation, review, and GitHub-backed agent work.

It exists both as a personal lab and as a browsable catalog others can copy or install.

## Language

**Pi Package**:
A repo loaded by Pi to provide reusable prompts, skills, extensions, and themes.
_Avoid_: Plugin pack, toolbox

**Extension**:
A runtime addition that gives Pi commands, tools, UI flows, or background behavior.
_Avoid_: Skill, prompt

**Skill**:
A repo-local instruction file Pi loads when a task matches a documented workflow or specialty.
_Avoid_: Prompt, command

**Prompt**:
A slash command entrypoint under `prompts/` that activates a focused workflow, often by loading one or more skills.
_Avoid_: Skill, extension

**Issue-backed workflow**:
A way of working where GitHub issues hold exploration, scope refinement, PRDs, and important decision records.
_Avoid_: OpenSpec-first workflow, repo-doc-first workflow

**ADR comment**:
A GitHub issue comment that records one important hard-to-reverse decision and why it was made.
_Avoid_: Repo ADR file, design note

**PRD comment**:
A GitHub issue comment that captures a more developed implementation plan when work is not ready to build yet.
_Avoid_: ADR, issue body note

## Relationships

- A **Pi Package** contains **Extensions**, **Skills**, **Prompts**, and optionally themes.
- A **Prompt** often activates one or more **Skills**.
- An **Extension** changes Pi runtime behavior, while a **Skill** changes how the agent reasons about a task.
- An **Issue-backed workflow** may produce **PRD comments** and, more sparingly, **ADR comments**.
- `CONTEXT.md` stores stable local context, while GitHub issues store evolving discussion and planning.

## Example dialogue

> **Dev:** "Should this go in a prompt, a skill, or an extension?"
> **Domain expert:** "Use a **Prompt** for the slash command entrypoint, a **Skill** for reusable workflow instructions, and an **Extension** only when Pi runtime behavior or tools must change."

## Flagged ambiguities

- "prompt" and "skill" are easy to blur — resolved: a **Prompt** is the slash-command entrypoint, while a **Skill** is the reusable instruction payload it may load.
- "ADR" in this repo should mean an **ADR comment** on a GitHub issue, not a repo-local file under `docs/adr/`.
