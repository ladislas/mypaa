# rick-persona-agents Specification

## Purpose

TBD - created by archiving change add-rick-persona-agents. Update Purpose after archive.

## Requirements

### Requirement: RickBuild agent exists as a primary agent

The system SHALL provide a `RickBuild` primary agent defined in `.opencode/agents/RickBuild.md` that embeds the Rick Sanchez persona with full tool access, matching the default `build` agent's capabilities.

#### Scenario: RickBuild is available in agent cycling

- **WHEN** the user presses Tab in the OpenCode TUI
- **THEN** `RickBuild` appears as one of the primary agents in the cycle

#### Scenario: RickBuild has full tool access

- **WHEN** the user interacts with `RickBuild`
- **THEN** the agent has full tool access (edit, bash, read, write) with no restrictions

#### Scenario: RickBuild uses Rick Sanchez persona

- **WHEN** the user interacts with `RickBuild`
- **THEN** the agent responds with Rick Sanchez personality traits, coding philosophy, and communication style as defined in the persona content

### Requirement: RickPlan agent exists as a primary agent

The system SHALL provide a `RickPlan` primary agent defined in `.opencode/agents/RickPlan.md` that embeds the Rick Sanchez persona with strict read-only constraints for analysis and planning only.

#### Scenario: RickPlan is available in agent cycling

- **WHEN** the user presses Tab in the OpenCode TUI
- **THEN** `RickPlan` appears as one of the primary agents in the cycle

#### Scenario: RickPlan uses Rick Sanchez persona

- **WHEN** the user interacts with `RickPlan`
- **THEN** the agent responds with Rick Sanchez personality traits, coding philosophy, and communication style as defined in the persona content

### Requirement: RickPlan SHALL NOT modify files

The system SHALL deny the `edit` permission entirely for `RickPlan`. The edit tool MUST NOT be available to the agent.

#### Scenario: RickPlan cannot edit files

- **WHEN** `RickPlan` attempts to use the edit tool
- **THEN** the tool is not available (denied at permission level, not just prompted)

#### Scenario: RickPlan prompt reinforces no-code policy

- **WHEN** the user asks `RickPlan` to write or modify code
- **THEN** the agent refuses and reminds the user to switch to `RickBuild`

### Requirement: RickPlan bash access is restricted to exploration commands

The system SHALL configure `RickPlan` bash permissions with a default deny and an explicit allow-list of read-only exploration commands.

#### Scenario: RickPlan can run git commands

- **WHEN** `RickPlan` runs bash commands matching `git status*`, `git diff*`, `git log*`, `git show*`, `git branch*`, `git rev-parse*`, or `git ls-files*`
- **THEN** the commands are allowed without prompting

#### Scenario: RickPlan can run search commands

- **WHEN** `RickPlan` runs bash commands matching `grep *` or `rg *`
- **THEN** the commands are allowed without prompting

#### Scenario: RickPlan can run file reading commands

- **WHEN** `RickPlan` runs bash commands matching `head *`, `tail *`, `ls *`, `tree *`, `wc *`, or `file *`
- **THEN** the commands are allowed without prompting

#### Scenario: RickPlan can run openspec commands

- **WHEN** `RickPlan` runs bash commands matching `openspec *`
- **THEN** the commands are allowed without prompting

#### Scenario: RickPlan cannot run arbitrary commands

- **WHEN** `RickPlan` attempts to run a bash command not in the allow-list (e.g., `rm`, `npm`, `mkdir`, `echo >`)
- **THEN** the command is denied

### Requirement: Agent files are self-contained

Each agent markdown file SHALL contain the complete persona content inline. The persona MUST NOT be referenced via `{file:...}` syntax or any other external reference mechanism.

#### Scenario: RickBuild contains full persona

- **WHEN** `.opencode/agents/RickBuild.md` is read
- **THEN** the file contains the complete Rick Sanchez persona (personality, coding philosophy, behavior, code review style, communication rules, agent rules)

#### Scenario: RickPlan contains full persona plus plan override

- **WHEN** `.opencode/agents/RickPlan.md` is read
- **THEN** the file contains the complete Rick Sanchez persona plus an additional plan-mode override section that explicitly forbids code writing and directs the agent to analyze, plan, and recommend only

### Requirement: Agents inherit the active model

Agent files SHALL NOT pin a specific model. Both `RickBuild` and `RickPlan` MUST inherit whatever model is currently configured in the session.

#### Scenario: No model specified in frontmatter

- **WHEN** `.opencode/agents/RickBuild.md` or `.opencode/agents/RickPlan.md` frontmatter is parsed
- **THEN** no `model` field is present, and the agent uses the session's active model
