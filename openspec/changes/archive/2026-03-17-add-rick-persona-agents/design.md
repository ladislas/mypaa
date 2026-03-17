## Context

OpenCode loads agent definitions from `.opencode/agents/*.md` files. Each markdown file defines one agent via YAML frontmatter (mode, description, permissions) and a body that becomes the agent's system prompt. The project currently has no `.opencode/agents/` directory — only the built-in `build` and `plan` agents are available.

The Rick Sanchez persona exists at `~/Desktop/rick_sanchez.md` (70 lines) and defines personality, coding philosophy, behavior guidelines, code review style, communication rules, and agent rules. It needs to be embedded into two new agent files with agent-type-specific adaptations.

## Goals / Non-Goals

**Goals:**

- Two new primary agents (`RickBuild`, `RickPlan`) available via Tab cycling in the TUI
- `RickPlan` must be strictly read-only — `edit: deny` at the permission level, plus prompt-level reinforcement that no code is written or modified
- `RickPlan` bash access limited to explicitly read-only commands only (specific read-only git commands, grep, rg, ls, head, tail, wc, file, tree, openspec)
- Each agent file is self-contained with the full persona content duplicated, allowing independent evolution
- No changes to existing agents, commands, skills, or AGENTS.md

**Non-Goals:**

- Global config promotion (future work — test in this repo first)
- Shared/referenced persona file via `{file:...}` syntax (decided against: want independent per-agent evolution)
- Modifying the original `~/Desktop/rick_sanchez.md` file
- Creating an `opencode.json` at the project root

## Decisions

### 1. Markdown agent files over JSON config

**Choice:** Define agents as `.opencode/agents/*.md` files, not in `opencode.json`.

**Why:** The markdown approach is self-contained — frontmatter for config, body for prompt. No need to create a project `opencode.json` that doesn't exist yet. Markdown agents are also easier to read, edit, and diff in code review.

**Alternative considered:** Using `opencode.json` with `agent.RickBuild.prompt: "{file:...}"` and a single shared persona file. Rejected because the user wants each agent to evolve independently, and the plan agent needs additional behavioral framing beyond just the persona.

### 2. Duplicated persona content over shared reference

**Choice:** Copy the full persona into each agent file rather than referencing a shared file.

**Why:** `RickBuild` and `RickPlan` will likely diverge. The plan agent already needs a "Plan Mode Override" section appended. Duplication here is intentional — it's two slightly different things, not one thing repeated.

### 3. `edit: deny` (not `ask`) for RickPlan

**Choice:** Deny file editing entirely rather than prompting for approval.

**Why:** The user stated this is paramount. `deny` removes the tool completely — the model can't even attempt to use it. This is the strongest guarantee available.

### 4. Granular bash permissions for RickPlan

**Choice:** Default `deny` with explicit allow-list for read/explore commands.

**Why:** Bash is powerful and could be used to write files even without the edit tool. A default-deny posture with explicit allows for narrowly scoped read-only commands ensures `RickPlan` stays read-only in practice, not just in theory. Broad patterns such as `git *`, `cat *`, and `find *` are too permissive because they can cover mutating operations or command execution.

**Allow-list:**

- `git status*`, `git diff*`, `git log*`, `git show*`, `git branch*`, `git rev-parse*`, `git ls-files*` — narrowly scoped git inspection
- `grep *`, `rg *` — content search
- `ls *`, `tree *` — directory exploration
- `head *`, `tail *` — file reading
- `wc *`, `file *` — file metadata
- `openspec *` — OpenSpec CLI (list, status, etc.)

### 5. Plan-mode behavioral override in prompt

**Choice:** Add an explicit "Plan Mode Override" section after the persona content in `RickPlan.md`.

**Why:** Permissions are a mechanical guardrail but the model also needs prompt-level intent. The override section tells the model it does not write code, it analyzes and recommends. This is defense in depth — permissions prevent, prompt directs.

## Risks / Trade-offs

**[Persona duplication diverges unintentionally]** → Accepted trade-off. The two files serve different purposes. If they drift too far, a future refactor can extract a shared base. Not worth the complexity now.

**[Bash allow-list may be too restrictive or too permissive]** → The allow-list covers the standard exploration toolkit. If something is missing (e.g., `du`, `stat`), it can be added to `RickPlan.md` frontmatter without affecting anything else.

**[Tab cycling order includes 4 agents]** → OpenCode shows all primary agents in the Tab cycle. With `build`, `plan`, `RickBuild`, `RickPlan`, there are 4 options. This is manageable but could be reduced later if the user prefers rick-only agents.
