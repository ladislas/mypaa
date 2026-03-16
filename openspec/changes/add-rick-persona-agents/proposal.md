## Why

OpenCode supports custom agents with persona-based prompts, but the project currently uses only the default `build` and `plan` agents with no personality. Adding Rick Sanchez persona agents lets the user choose between standard professional agents and Rick-flavored variants that maintain sharp, direct, no-nonsense coding assistance while preserving clear behavioral boundaries between build (full tools) and plan (read-only analysis).

## What Changes

- Add `RickBuild` primary agent: Rick Sanchez persona with full tool access, matching the default `build` agent's capabilities
- Add `RickPlan` primary agent: Rick Sanchez persona with strict read-only constraints — file editing denied entirely, bash restricted to explicit read-only inspection commands only
- Move persona source content from `~/Desktop/rick_sanchez.md` into each agent file in `.opencode/agents/`, with `RickPlan` including additional plan-mode behavioral overrides
- Each agent file is self-contained (persona content duplicated, not referenced) to allow independent evolution per agent type

## Capabilities

### New Capabilities

- `rick-persona-agents`: Defines two new OpenCode agents (`RickBuild`, `RickPlan`) as markdown files in `.opencode/agents/`, each embedding the Rick Sanchez persona with agent-type-specific behavioral framing and permission configuration

### Modified Capabilities

_None — this adds new agents alongside existing defaults without changing them._

## Impact

- New directory: `.opencode/agents/`
- Two new files: `.opencode/agents/RickBuild.md`, `.opencode/agents/RickPlan.md`
- No changes to existing config, commands, skills, or AGENTS.md
- After restart, Tab cycling in OpenCode TUI will include `RickBuild` and `RickPlan` alongside the built-in agents
