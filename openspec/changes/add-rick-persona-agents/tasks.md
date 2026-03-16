## 1. Setup

- [ ] 1.1 Create `.opencode/agents/` directory

## 2. build-rick Agent

- [ ] 2.1 Create `.opencode/agents/build-rick.md` with frontmatter (description, mode: primary) and full Rick Sanchez persona content from `~/Desktop/rick_sanchez.md`

## 3. plan-rick Agent

- [ ] 3.1 Create `.opencode/agents/plan-rick.md` with frontmatter (description, mode: primary, permission: edit deny, bash default deny with exploration allow-list)
- [ ] 3.2 Embed full Rick Sanchez persona content in plan-rick.md body
- [ ] 3.3 Add "Plan Mode Override" section at the end of plan-rick.md body reinforcing no-code policy and directing user to switch to build-rick for implementation

## 4. Verification

- [ ] 4.1 Verify both agent files exist and have correct frontmatter structure
- [ ] 4.2 Verify plan-rick.md has `edit: deny` and bash allow-list in frontmatter
- [ ] 4.3 Verify plan-rick.md body contains Plan Mode Override section
- [ ] 4.4 Verify neither agent file contains a `model` field in frontmatter
