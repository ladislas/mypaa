import test from "node:test";
import assert from "node:assert/strict";
import {
	buildSlidedeckPrompt,
	getNextSlidedeckRevisionPath,
	getSingleRefinementEditTargetPath,
	getSlidedeckFileUrl,
	getSlidedeckLocation,
	getSlidedeckMarkdownLink,
	getSlidedeckStateFromEntries,
	getSessionSlidedeckDir,
	isPiManagedSlidedeckFile,
	isSessionSlidedeckFile,
	parseStrictSlidedeckCopyCommand,
	renderSlidedeckHtml,
	resolveAgentDir,
} from "./helpers.ts";

test("buildSlidedeckPrompt uses provided source material at the end", () => {
	const prompt = buildSlidedeckPrompt("Issue #131: explain the HTML deck workflow", {
		sessionDeckDir: "/Users/tester/.pi/agent/slidedecks/session-123",
		currentDeckPath: "/Users/tester/.pi/agent/slidedecks/session-123/20260428-123456-deck-for-issue-131.html",
		pendingDeckPath: "/Users/tester/.pi/agent/slidedecks/session-123/20260428-123456-deck-for-issue-131-v2.html",
	});
	assert.match(prompt, /Use the save_slidedeck tool exactly once/);
	assert.match(prompt, /### New deck creation/);
	assert.match(prompt, /### Deck refinement/);
	assert.match(prompt, /Never use save_slidedeck for refinement/);
	assert.match(prompt, /exactly one bash command in the form `cp <source\.html> <target-vN\.html>`/);
	assert.match(prompt, /Allow only plain edit, edit\.multi, or a single-file edit\.patch `Update File`/);
	assert.match(prompt, /Use these patterns exactly/);
	assert.match(prompt, /A Markdown link in the exact format `\[slidedeck\]\(<saved file path>\)`/);
	assert.match(prompt, /Preserve untouched slides verbatim/);
	assert.match(prompt, /Current deck tracked for this session: \/Users\/tester\/\.pi\/agent\/slidedecks\/session-123\/20260428-123456-deck-for-issue-131\.html/);
	assert.match(prompt, /Pending fresh refinement copy for this session: \/Users\/tester\/\.pi\/agent\/slidedecks\/session-123\/20260428-123456-deck-for-issue-131-v2\.html/);
	assert.match(prompt, /Current session deck directory: \/Users\/tester\/\.pi\/agent\/slidedecks\/session-123/);
	assert.ok(prompt.endsWith("Source material:\nIssue #131: explain the HTML deck workflow"));
});

test("buildSlidedeckPrompt falls back to conversation context", () => {
	const prompt = buildSlidedeckPrompt("   ");
	assert.ok(prompt.endsWith("Source material:\nUse the current conversation context."));
});

test("resolveAgentDir honors explicit Pi agent env vars and tilde expansion", () => {
	assert.equal(resolveAgentDir({ PI_CODING_AGENT_DIR: "~/custom-agent" }, "/Users/tester"), "/Users/tester/custom-agent");
	assert.equal(resolveAgentDir({ ACME_CODING_AGENT_DIR: "/tmp/acme-agent" }, "/Users/tester"), "/tmp/acme-agent");
	assert.equal(resolveAgentDir({}, "/Users/tester"), "/Users/tester/.pi/agent");
});

test("getSlidedeckLocation stores decks under the shared Pi slidedecks dir", () => {
	assert.equal(getSessionSlidedeckDir("/Users/tester/.pi/agent", "session-123"), "/Users/tester/.pi/agent/slidedecks/session-123");

	const location = getSlidedeckLocation({
		agentDir: "/Users/tester/.pi/agent",
		sessionId: "session-123",
		title: "Deck for Issue 131",
		timestamp: new Date("2026-04-28T12:34:56Z"),
	});

	assert.equal(location.dir, "/Users/tester/.pi/agent/slidedecks/session-123");
	assert.equal(location.file, "/Users/tester/.pi/agent/slidedecks/session-123/20260428-123456-deck-for-issue-131.html");
});

test("isSessionSlidedeckFile only allows HTML decks in the current session dir", () => {
	const sessionDeckDir = "/Users/tester/.pi/agent/slidedecks/session-123";

	assert.equal(isSessionSlidedeckFile(`${sessionDeckDir}/deck-v2.html`, sessionDeckDir), true);
	assert.equal(isSessionSlidedeckFile(`${sessionDeckDir}/notes.txt`, sessionDeckDir), false);
	assert.equal(isSessionSlidedeckFile("/Users/tester/.pi/agent/slidedecks/session-999/deck.html", sessionDeckDir), false);
	assert.equal(isSessionSlidedeckFile("/Users/tester/dev/mypac/deck.html", sessionDeckDir), false);
});

test("isPiManagedSlidedeckFile allows decks from any Pi-managed session dir", () => {
	const agentDir = "/Users/tester/.pi/agent";

	assert.equal(isPiManagedSlidedeckFile("/Users/tester/.pi/agent/slidedecks/session-123/deck.html", agentDir), true);
	assert.equal(isPiManagedSlidedeckFile("/Users/tester/.pi/agent/slidedecks/session-999/deck-v2.html", agentDir), true);
	assert.equal(isPiManagedSlidedeckFile("/Users/tester/.pi/agent/notes/deck.html", agentDir), false);
});

test("getNextSlidedeckRevisionPath picks the next fresh revision in the current session dir", () => {
	assert.equal(
		getNextSlidedeckRevisionPath(
			"/Users/tester/.pi/agent/slidedecks/session-999/20260428-123456-review-deck.html",
			"/Users/tester/.pi/agent/slidedecks/session-123",
			[
				"20260428-123456-review-deck.html",
				"20260428-123456-review-deck-v2.html",
				"20260428-123456-review-deck-v3.html",
			],
		),
		"/Users/tester/.pi/agent/slidedecks/session-123/20260428-123456-review-deck-v4.html",
	);
	assert.equal(
		getNextSlidedeckRevisionPath(
			"/Users/tester/.pi/agent/slidedecks/session-123/20260428-123456-review-deck-v4.html",
			"/Users/tester/.pi/agent/slidedecks/session-123",
			["20260428-123456-review-deck-v2.html", "20260428-123456-review-deck-v4.html"],
		),
		"/Users/tester/.pi/agent/slidedecks/session-123/20260428-123456-review-deck-v5.html",
	);
});

test("getSlidedeckStateFromEntries restores current and pending refinement state", () => {
	const state = getSlidedeckStateFromEntries([
		{
			type: "message",
			message: {
				role: "toolResult",
				toolName: "save_slidedeck",
				details: { path: "/Users/tester/.pi/agent/slidedecks/session-123/base.html" },
			},
		},
		{
			type: "custom",
			customType: "slidedeck-state",
			data: {
				currentDeckPath: "/Users/tester/.pi/agent/slidedecks/session-123/base.html",
				pendingDeckPath: "/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html",
			},
		},
		{
			type: "custom",
			customType: "slidedeck-state",
			data: {
				currentDeckPath: "/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html",
			},
		},
	]);

	assert.deepEqual(state, {
		currentDeckPath: "/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html",
	});
});

test("getSingleRefinementEditTargetPath supports plain, multi, and single-file patch updates only", () => {
	assert.equal(
		getSingleRefinementEditTargetPath({
			path: "/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html",
			oldText: "old",
			newText: "new",
		}),
		"/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html",
	);
	assert.equal(
		getSingleRefinementEditTargetPath({
			path: "/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html",
			multi: [
				{ oldText: "old", newText: "new" },
				{ path: "/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html", oldText: "before", newText: "after" },
			],
		}),
		"/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html",
	);
	assert.equal(
		getSingleRefinementEditTargetPath({
			patch: [
				"*** Begin Patch",
				"*** Update File: /Users/tester/.pi/agent/slidedecks/session-123/base-v2.html",
				"@@",
				"-old",
				"+new",
				"*** End Patch",
			].join("\n"),
		}),
		"/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html",
	);
	assert.equal(
		getSingleRefinementEditTargetPath({
			multi: [
				{ path: "/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html", oldText: "a", newText: "b" },
				{ path: "/Users/tester/.pi/agent/slidedecks/session-123/other.html", oldText: "c", newText: "d" },
			],
		}),
		undefined,
	);
	assert.equal(
		getSingleRefinementEditTargetPath({
			patch: [
				"*** Begin Patch",
				"*** Add File: /Users/tester/.pi/agent/slidedecks/session-123/base-v3.html",
				"+new file",
				"*** End Patch",
			].join("\n"),
		}),
		undefined,
	);
});

test("parseStrictSlidedeckCopyCommand only accepts a bare two-argument cp command", () => {
	assert.deepEqual(
		parseStrictSlidedeckCopyCommand('cp "/Users/tester/.pi/agent/slidedecks/session-123/base.html" "/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html"'),
		{
			sourcePath: "/Users/tester/.pi/agent/slidedecks/session-123/base.html",
			targetPath: "/Users/tester/.pi/agent/slidedecks/session-123/base-v2.html",
		},
	);
	assert.equal(parseStrictSlidedeckCopyCommand("cp a.html b.html && echo done"), undefined);
});

test("getSlidedeckFileUrl converts saved paths to file URLs", () => {
	assert.equal(
		getSlidedeckFileUrl("/Users/tester/.pi/agent/slidedecks/session-123/deck.html"),
		"file:///Users/tester/.pi/agent/slidedecks/session-123/deck.html",
	);
});

test("getSlidedeckMarkdownLink formats a clickable markdown link", () => {
	assert.equal(
		getSlidedeckMarkdownLink("/Users/tester/.pi/agent/slidedecks/session-123/deck.html"),
		"[Open slidedeck](file:///Users/tester/.pi/agent/slidedecks/session-123/deck.html)",
	);
	assert.equal(
		getSlidedeckMarkdownLink("/Users/tester/.pi/agent/slidedecks/session-123/deck.html", "Open visual QA sample"),
		"[Open visual QA sample](file:///Users/tester/.pi/agent/slidedecks/session-123/deck.html)",
	);
});

test("renderSlidedeckHtml wraps slides in the shared template", () => {
	const html = renderSlidedeckHtml({
		title: "Review Deck",
		slides: [
			{ title: "Overview & Goals", body: "<p>Summarize the <a href=\"https://example.com\">work</a>.</p>" },
			{ title: "Next Steps", body: "<ul><li>Ship it</li></ul>" },
		],
		generatedAt: new Date("2026-04-28T12:34:56Z"),
	});

	assert.match(html, /<title>Review Deck<\/title>/);
	assert.match(html, /class="deck" data-title="Review Deck"/);
	assert.match(html, /class="footer"/);
	assert.match(html, /class="progress"><div><\/div><\/div>/);
	assert.match(html, /class="nav"/);
	assert.match(html, /<button id="next">Next →<\/button>/);
	assert.match(html, /<h1 class="slide-title">Overview &amp; Goals<\/h1>/);
	assert.match(html, /<h2 class="slide-title">Next Steps<\/h2>/);
	assert.match(html, /<div class="eyebrow">Slide 1<\/div>/);
	assert.match(html, /<p>Summarize the <a href="https:\/\/example\.com">work<\/a>\.<\/p>/);
	assert.match(html, /a,\s*a:visited\s*\{\s*color: var\(--accent\);/);
	assert.match(html, /a:hover,\s*a:focus-visible\s*\{\s*color: var\(--accent-2\);/);
	assert.doesNotMatch(html, /class="slide-body"/);
	assert.match(html, /<script>\s*const deck = document\.querySelector/);
});
