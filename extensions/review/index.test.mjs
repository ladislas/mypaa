import test from "node:test";
import assert from "node:assert/strict";
import reviewExtension from "./index.ts";
import { ReviewPromptLoadError } from "./prompts.ts";

const fakeTheme = {
	fg: (_color, text) => text,
	bold: (text) => text,
};
const fakeTui = { requestRender() {} };

function submitCustomInput(factory, inputs) {
	let result;
	const component = factory(fakeTui, fakeTheme, {}, (value) => {
		result = value;
	});
	for (const input of inputs) {
		component.handleInput(input);
	}
	return result;
}

function createReviewStartHarness(custom) {
	const commands = new Map();
	const notifications = [];
	const sentMessages = [];

	const pi = {
		registerCommand(name, definition) {
			commands.set(name, definition.handler);
		},
		on() {},
		exec: async (command, args) => {
			if (command === "git" && args[0] === "rev-parse" && args[1] === "--git-dir") {
				return { code: 0, stdout: ".git\n", stderr: "" };
			}
			if (command === "git" && args[0] === "status" && args[1] === "--porcelain") {
				return { code: 0, stdout: " M extensions/review/index.ts\n", stderr: "" };
			}
			throw new Error(`Unexpected exec call: ${command} ${args.join(" ")}`);
		},
		appendEntry() {},
		setSessionName() {},
		sendUserMessage(message) {
			sentMessages.push(message);
		},
	};

	reviewExtension(pi, {
		loadPackageSkill: async () => ({ content: "review skill" }),
	});

	const handler = commands.get("review-start");
	assert.equal(typeof handler, "function");

	return {
		handler,
		notifications,
		sentMessages,
		ctx: {
			hasUI: true,
			cwd: process.cwd(),
			sessionManager: {
				getEntries: () => [{ id: "msg-1", type: "message", message: { role: "user" } }],
				getBranch: () => [],
				getLeafId: () => "leaf-1",
			},
			navigateTree: async () => {
				throw new Error("navigateTree should not be called in current-session mode");
			},
			ui: {
				notify(message, level) {
					notifications.push({ message, level });
				},
				setWidget() {},
				setEditorText() {},
				custom,
				select: async (label) => {
					assert.equal(label, "Start review in:");
					return "Current session";
				},
			},
		},
	};
}

test("/review-start can retry after pac-review skill load failure without leaving active review state", async () => {
	const commands = new Map();
	const notifications = [];
	const appendedEntries = [];
	const sentMessages = [];
	let leafId;

	const pi = {
		registerCommand(name, definition) {
			commands.set(name, definition.handler);
		},
		on() {},
		exec: async (command, args) => {
			if (command === "git" && args[0] === "rev-parse" && args[1] === "--git-dir") {
				return { code: 0, stdout: ".git\n", stderr: "" };
			}
			throw new Error(`Unexpected exec call: ${command} ${args.join(" ")}`);
		},
		appendEntry(customType, data) {
			appendedEntries.push({ customType, data });
			if (customType === "review-anchor") {
				leafId = "anchor-1";
			}
		},
		setSessionName() {},
		sendUserMessage(message) {
			sentMessages.push(message);
		},
	};

	reviewExtension(pi, {
		loadPackageSkill: async () => null,
	});

	const handler = commands.get("review-start");
	assert.equal(typeof handler, "function");

	const ctx = {
		hasUI: true,
		cwd: process.cwd(),
		sessionManager: {
			getEntries: () => [],
			getBranch: () => [],
			getLeafId: () => leafId,
		},
		navigateTree: async () => ({ cancelled: false }),
		ui: {
			notify(message, level) {
				notifications.push({ message, level });
			},
			setWidget() {},
			setEditorText() {},
			select: async () => undefined,
		},
	};

	await handler("uncommitted", ctx);
	await handler("uncommitted", ctx);

	assert.deepEqual(appendedEntries, []);
	assert.deepEqual(sentMessages, []);
	assert.deepEqual(notifications, [
		{ message: "Could not load skills/pac-review/SKILL.md", level: "error" },
		{ message: "Could not load skills/pac-review/SKILL.md", level: "error" },
	]);
});

test("/review-start selector prompts for an optional one-off instruction", async () => {
	let customCalls = 0;
	const { ctx, handler, sentMessages } = createReviewStartHarness(async () => {
		customCalls += 1;
		return customCalls === 1
			? "uncommitted"
			: { cancelled: false, instruction: "focus on performance regressions" };
	});

	await handler("", ctx);

	assert.equal(customCalls, 2);
	assert.equal(sentMessages.length, 1);
	assert.match(sentMessages[0], /Additional user-provided review instruction:\n\nfocus on performance regressions/);
});

test("/review-start optional instruction prompt skips on empty enter", async () => {
	let customCalls = 0;
	const { ctx, handler, sentMessages } = createReviewStartHarness(async (factory) => {
		customCalls += 1;
		return customCalls === 1 ? "uncommitted" : submitCustomInput(factory, ["\n"]);
	});

	await handler("", ctx);

	assert.equal(customCalls, 2);
	assert.equal(sentMessages.length, 1);
	assert.doesNotMatch(sentMessages[0], /Additional user-provided review instruction/);
});

test("/review-start optional instruction prompt cancels on escape", async () => {
	let customCalls = 0;
	const { ctx, handler, notifications, sentMessages } = createReviewStartHarness(async (factory) => {
		customCalls += 1;
		return customCalls === 1 ? "uncommitted" : submitCustomInput(factory, ["\x1b"]);
	});

	await handler("", ctx);

	assert.equal(customCalls, 2);
	assert.deepEqual(sentMessages, []);
	assert.deepEqual(notifications, [{ message: "Review cancelled", level: "info" }]);
});

test("/review-end prompts for an optional one-off instruction before fixing findings", async () => {
	const commands = new Map();
	const appendedEntries = [];
	const sentMessages = [];
	let customCalls = 0;

	const pi = {
		registerCommand(name, definition) {
			commands.set(name, definition.handler);
		},
		on() {},
		appendEntry(customType, data) {
			appendedEntries.push({ customType, data });
		},
		sendUserMessage(message, options) {
			sentMessages.push({ message, options });
		},
	};

	reviewExtension(pi, {
		loadPackageSkill: async () => ({ content: "review skill" }),
	});

	const handler = commands.get("review-end");
	assert.equal(typeof handler, "function");

	const ctx = {
		hasUI: true,
		sessionManager: {
			getEntries: () => [],
			getBranch: () => [
				{
					type: "custom",
					customType: "review-session",
					data: { active: true, originId: "origin-1", targetType: "uncommitted" },
				},
			],
			getLeafId: () => "leaf-1",
		},
		navigateTree: async () => {
			throw new Error("navigateTree is driven through the loader in this command test");
		},
		ui: {
			notify() {},
			setWidget() {},
			getEditorText: () => "",
			setEditorText() {},
			select: async (label) => {
				assert.equal(label, "Finish review:");
				return "Summarize + return + fix findings";
			},
			custom: async () => {
				customCalls += 1;
				return customCalls === 1
					? { cancelled: false, instruction: "only fix P1 findings" }
					: { cancelled: false };
			},
		},
	};

	await handler("", ctx);

	assert.equal(customCalls, 2);
	assert.deepEqual(appendedEntries, [{ customType: "review-session", data: { active: false } }]);
	assert.equal(sentMessages.length, 1);
	assert.equal(sentMessages[0].options?.deliverAs, "followUp");
	assert.match(sentMessages[0].message, /Additional user-provided review instruction:\n\nonly fix P1 findings/);
});

test("/review-end reports Markdown prompt load failures as review extension errors", async () => {
	const commands = new Map();
	const appendedEntries = [];
	const notifications = [];
	const sentMessages = [];

	const pi = {
		registerCommand(name, definition) {
			commands.set(name, definition.handler);
		},
		on() {},
		appendEntry(customType, data) {
			appendedEntries.push({ customType, data });
		},
		sendUserMessage(message, options) {
			sentMessages.push({ message, options });
		},
	};

	reviewExtension(pi, {
		loadReviewSummaryPrompt: async () => {
			throw new ReviewPromptLoadError(
				"review summary",
				"/missing/REVIEW_SUMMARY_PROMPT.md",
				new Error("ENOENT: no such file or directory"),
			);
		},
	});

	const handler = commands.get("review-end");
	assert.equal(typeof handler, "function");

	const ctx = {
		hasUI: true,
		sessionManager: {
			getEntries: () => [],
			getBranch: () => [
				{
					type: "custom",
					customType: "review-session",
					data: { active: true, originId: "origin-1", targetType: "uncommitted" },
				},
			],
			getLeafId: () => "leaf-1",
		},
		navigateTree: async () => {
			throw new Error("navigateTree should not be called when prompt loading fails");
		},
		ui: {
			notify(message, level) {
				notifications.push({ message, level });
			},
			setWidget() {},
			getEditorText: () => "",
			setEditorText() {},
			select: async (label) => {
				assert.equal(label, "Finish review:");
				return "Summarize + return";
			},
			custom: async () => ({ cancelled: false }),
		},
	};

	await handler("", ctx);

	assert.deepEqual(appendedEntries, []);
	assert.deepEqual(sentMessages, []);
	assert.equal(notifications.length, 1);
	assert.equal(notifications[0].level, "error");
	assert.match(notifications[0].message, /Review extension failed to load review summary Markdown prompt/);
	assert.match(notifications[0].message, /REVIEW_SUMMARY_PROMPT\.md/);
});
