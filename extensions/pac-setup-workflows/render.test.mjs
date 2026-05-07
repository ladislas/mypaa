import test from "node:test";
import assert from "node:assert/strict";
import { analyzeLabels, buildApplyPlan } from "./drift.ts";
import { renderApplyPlan, renderCheckResult, renderHelp } from "./render.ts";

test("renderCheckResult includes required check sections", () => {
	const result = analyzeLabels([
		{ name: "prd", color: "C5DEF5", description: "legacy" },
		{ name: "bug", color: "d73a4a", description: "Something isn't working" },
	]);
	const text = renderCheckResult("ladislas/mypac", result);
	assert.match(text, /# Pac workflow labels — ladislas\/mypac/);
	assert.match(text, /## Missing required pac labels/);
	assert.match(text, /## Legacy migration candidates/);
	assert.match(text, /`prd` → `pac:prd`/);
	assert.match(text, /## Host-owned labels noticed but not managed/);
	assert.match(text, /`bug`/);
});

test("renderApplyPlan shows renames and creates", () => {
	const plan = buildApplyPlan(analyzeLabels([{ name: "prd", color: "C5DEF5", description: "legacy" }]));
	const text = renderApplyPlan("ladislas/mypac", plan);
	assert.match(text, /## Renames/);
	assert.match(text, /`prd` → `pac:prd`/);
	assert.match(text, /## Creates/);
	assert.doesNotMatch(text, /- `pac:prd` #/);
});

test("renderHelp documents supported command forms", () => {
	const text = renderHelp();
	assert.match(text, /\/pac-setup-workflows labels check --repo owner\/repo/);
	assert.match(text, /Apply mode requires explicit confirmation/);
});
