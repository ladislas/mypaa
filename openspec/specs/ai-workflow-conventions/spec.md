# ai-workflow-conventions Specification

## Purpose

Define the repository's AI workflow conventions, including how OpenSpec is used, when its artifacts are expected, and how humans stay in control of planning and implementation.

## Requirements

### Requirement: Repository documents OpenSpec usage model

The repository SHALL explain that OpenSpec is typically installed as a machine-level CLI while each repository is initialized and operated independently.

#### Scenario: Reader wants to understand setup scope

- **WHEN** a reader looks for OpenSpec setup guidance in the repository
- **THEN** they can tell the difference between CLI installation on a machine and project-level initialization inside a repository

### Requirement: Repository defines when to use OpenSpec

The repository SHALL document that OpenSpec is the default planning workflow for meaningful multi-step changes and is optional for trivial or obvious edits.

#### Scenario: Reader decides whether a task needs OpenSpec

- **WHEN** a reader evaluates a planned change
- **THEN** they can determine from the repository guidance whether to use OpenSpec or skip it for that task

### Requirement: Repository records OpenSpec artifact retention

The repository SHALL state that meaningful OpenSpec artifacts are committed when they preserve rationale, review context, or implementation history.

#### Scenario: Reader decides whether to commit artifacts

- **WHEN** a reader completes a non-trivial change with OpenSpec artifacts
- **THEN** the repository guidance tells them those artifacts are expected to be committed when they capture durable context

### Requirement: Repository preserves human-in-the-loop workflow

The repository SHALL describe OpenSpec as a human-guided workflow where proposal, design, specs, and tasks support implementation without replacing code review, manual edits, or incremental decision-making.

#### Scenario: Reader wants guided, not autonomous, implementation

- **WHEN** a reader consults the OpenSpec workflow guidance
- **THEN** they understand that humans stay in control of implementation and review rather than delegating the entire change end-to-end

### Requirement: Repository defines atomic implementation commit boundaries

The repository SHALL document that implementation work is committed during execution as small, coherent, verifiable units of progress rather than only at the end of the entire change.

#### Scenario: Reader applies atomic commits to an OpenSpec change

- **WHEN** a reader follows repository guidance for implementing an OpenSpec change
- **THEN** the guidance tells them to commit after each meaningful numbered task section or task group once that section is complete and verified
- **AND** the guidance tells them not to create one commit for every tiny checkbox or file

#### Scenario: Reader applies atomic commits to manual work

- **WHEN** a reader follows repository guidance for implementing a meaningful change without OpenSpec
- **THEN** the guidance tells them to use the same atomic-commit principle with coherent manual task groups or work slices
- **AND** the guidance tells them not to wait until the end of all work to create a single large commit

### Requirement: Repository requires explicit commit file selection

The repository SHALL document that each commit is created from an explicit file list for the intended logical change, even when unrelated files are already staged.

#### Scenario: Unrelated staged files exist during commit creation

- **WHEN** a contributor or agent prepares a commit for one logical task group
- **AND** other unrelated files are already staged in the repository
- **THEN** the guidance tells them to stage or commit only the files belonging to the current task group
- **AND** the guidance tells them it is acceptable to leave unrelated staged files out of that commit
