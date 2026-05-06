import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
	buildReviewFixFindingsPrompt,
	buildReviewSessionName,
	parseArgs,
} from "./helpers.ts";

const reviewFixFindingsTemplate = readFileSync(
	new URL("./REVIEW_FIX_FINDINGS_PROMPT.md", import.meta.url),
	"utf8",
).replace(/^# .+\n+/, "").trim();

function getPromptPlaceholders(template) {
	return [...template.matchAll(/{{\s*([^{}\s]+)\s*}}/g)]
		.map((match) => match[1])
		.sort();
}

// ─── parseArgs ────────────────────────────────────────────────────────────────

test("parseArgs: empty → null target", () => {
	assert.deepEqual(parseArgs(undefined), { target: null });
	assert.deepEqual(parseArgs(""), { target: null });
});

test("parseArgs: uncommitted", () => {
	assert.deepEqual(parseArgs("uncommitted"), { target: { type: "uncommitted" } });
});

test("parseArgs: branch", () => {
	assert.deepEqual(parseArgs("branch main"), { target: { type: "baseBranch", branch: "main" } });
});

test("parseArgs: branch without name → null", () => {
	assert.deepEqual(parseArgs("branch"), { target: null });
});

test("parseArgs: --extra flag", () => {
	assert.deepEqual(parseArgs("uncommitted --extra 'focus on perf'"), {
		target: { type: "uncommitted" },
		extraInstruction: "focus on perf",
	});
});

test("parseArgs: --extra without value → error", () => {
	assert.equal(parseArgs("--extra").error, "Missing value for --extra");
});

test("parseArgs: unknown subcommand → null target", () => {
	assert.deepEqual(parseArgs("invalid"), { target: null });
});

// ─── buildReviewSessionName ───────────────────────────────────────────────────

test("buildReviewSessionName: branch target uses branch name", () => {
	assert.equal(buildReviewSessionName({ type: "baseBranch", branch: "feature/foo" }), "review - feature/foo");
});

test("buildReviewSessionName: uncommitted target uses literal label", () => {
	assert.equal(buildReviewSessionName({ type: "uncommitted" }), "review - uncommitted");
});

// ─── buildReviewFixFindingsPrompt ─────────────────────────────────────────────

test("buildReviewFixFindingsPrompt: uncommitted reviews use staging workflow", () => {
	const prompt = buildReviewFixFindingsPrompt(reviewFixFindingsTemplate, "uncommitted");
	assert.match(prompt, /started in uncommitted changes mode/i);
	assert.match(prompt, /\*\*Staging workflow:\*\*/);
	assert.doesNotMatch(prompt, /git log --oneline/);
	assert.doesNotMatch(prompt, /\*\*Fixup workflow:\*\*/);
	assert.match(prompt, /Review or commit the staged\/unstaged changes manually/);
});

test("buildReviewFixFindingsPrompt: base-branch reviews use fixup workflow", () => {
	const prompt = buildReviewFixFindingsPrompt(reviewFixFindingsTemplate, "baseBranch");
	assert.match(prompt, /started in base branch mode/i);
	assert.match(prompt, /\*\*Fixup workflow:\*\*/);
	assert.match(prompt, /git commit --fixup <sha>/);
	assert.match(prompt, /git rebase --autosquash/);
	assert.doesNotMatch(prompt, /\*\*Staging workflow:\*\*/);
});

test("buildReviewFixFindingsPrompt: unknown review mode defaults to staging workflow", () => {
	const prompt = buildReviewFixFindingsPrompt(reviewFixFindingsTemplate);
	assert.match(prompt, /original review mode is unavailable/i);
	assert.match(prompt, /\*\*Staging workflow:\*\*/);
	assert.doesNotMatch(prompt, /\*\*Fixup workflow:\*\*/);
});

test("buildReviewFixFindingsPrompt: expected template placeholders stay covered", () => {
	assert.deepEqual(getPromptPlaceholders(reviewFixFindingsTemplate), [
		"commitDisciplineIntro",
		"nextStepInstruction",
		"preparedChangesLabel",
		"preparedItemLabel",
		"preparedItemTargetDetail",
		"workflowInstructions",
	]);
});

test("buildReviewFixFindingsPrompt: supported workflows render without unresolved placeholders", () => {
	for (const targetType of [undefined, "uncommitted", "baseBranch"]) {
		const prompt = buildReviewFixFindingsPrompt(reviewFixFindingsTemplate, targetType);
		assert.doesNotMatch(prompt, /{{\s*[^{}\s]+\s*}}/, `target type: ${targetType ?? "unknown"}`);
	}
});

test("buildReviewFixFindingsPrompt: unresolved template placeholders fail loudly", () => {
	assert.throws(
		() => buildReviewFixFindingsPrompt(`${reviewFixFindingsTemplate}\n\n{{newPlaceholder}}`, "uncommitted"),
		/Unresolved prompt template placeholder\(s\): {{newPlaceholder}}/,
	);
});
