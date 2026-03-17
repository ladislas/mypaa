## 1. Setup

- [x] 1.1 Create `.opencode/agents/` directory

## 2. RickBuild Agent

- [x] 2.1 Create `.opencode/agents/RickBuild.md` with frontmatter (description, mode: primary) and full Rick Sanchez persona content from `~/Desktop/rick_sanchez.md`

## 3. RickPlan Agent

- [x] 3.1 Create `.opencode/agents/RickPlan.md` with frontmatter (description, mode: primary, permission: edit deny, bash default deny with exploration allow-list)
- [x] 3.2 Embed full Rick Sanchez persona content in RickPlan.md body
- [x] 3.3 Add "Plan Mode Override" section at the end of RickPlan.md body reinforcing no-code policy and directing user to switch to RickBuild for implementation

## 4. Verification

- [x] 4.1 Verify both agent files exist and have correct frontmatter structure
- [x] 4.2 Verify RickPlan.md has `edit: deny` and bash allow-list in frontmatter
- [x] 4.3 Verify RickPlan.md body contains Plan Mode Override section
- [x] 4.4 Verify neither agent file contains a `model` field in frontmatter
