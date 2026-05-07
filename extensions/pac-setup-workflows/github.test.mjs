import test from "node:test";
import assert from "node:assert/strict";
import { parseCommand, parsePaginatedLabels, splitArgs } from "./github.ts";

test("splitArgs handles quoted values", () => {
	assert.deepEqual(splitArgs('labels check --repo "owner/repo"'), ["labels", "check", "--repo", "owner/repo"]);
});

test("parseCommand defaults to menu", () => {
	assert.deepEqual(parseCommand(""), { action: "menu", repo: undefined });
});

test("parseCommand parses labels check with repo", () => {
	assert.deepEqual(parseCommand("labels check --repo ladislas/mypac"), {
		action: "check",
		repo: "ladislas/mypac",
	});
});

test("parseCommand parses labels apply with equals repo", () => {
	assert.deepEqual(parseCommand("labels apply --repo=ladislas/mypac"), {
		action: "apply",
		repo: "ladislas/mypac",
	});
});

test("parseCommand rejects invalid repo", () => {
	assert.deepEqual(parseCommand("labels check --repo mypac"), {
		action: "error",
		message: "Invalid --repo value: mypac",
	});
});

test("parseCommand rejects unknown arguments", () => {
	assert.deepEqual(parseCommand("labels delete"), {
		action: "error",
		message: "Unknown arguments: labels delete",
	});
});

test("parsePaginatedLabels flattens gh api paginated label pages", () => {
	const labels = parsePaginatedLabels(
		JSON.stringify([
			[{ name: "bug", color: "D73A4A", description: "Something is broken" }],
			[{ name: "pac:prd", color: "BFDADC", description: null }],
		]),
	);
	assert.deepEqual(labels, [
		{ name: "bug", color: "D73A4A", description: "Something is broken" },
		{ name: "pac:prd", color: "BFDADC", description: null },
	]);
});

test("parsePaginatedLabels rejects malformed label JSON", () => {
	assert.throws(() => parsePaginatedLabels(JSON.stringify([[{ name: "bug" }]])), /expected label.color/);
});
