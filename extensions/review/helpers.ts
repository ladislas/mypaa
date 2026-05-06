import { buildWorkflowSessionName } from "../session-names/helpers.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReviewTarget =
	| { type: "uncommitted" }
	| { type: "baseBranch"; branch: string };

export type ParsedReviewArgs = {
	target: ReviewTarget | null;
	extraInstruction?: string;
	error?: string;
};

export type ReviewFixWorkflow = "fixup" | "staged";

const UNRESOLVED_PROMPT_PLACEHOLDER_PATTERN = /{{\s*[^{}\s]+\s*}}/g;

// ─── Prompt templates ─────────────────────────────────────────────────────────

export const UNCOMMITTED_PROMPT =
	"Review the current code changes (staged, unstaged, and untracked files) and provide prioritized findings.";

export const BASE_BRANCH_PROMPT_WITH_MERGE_BASE =
	"Review the code changes against the base branch '{baseBranch}'. The merge base commit for this comparison is {mergeBaseSha}. Run `git diff {mergeBaseSha}` to inspect the changes relative to {baseBranch}. Provide prioritized, actionable findings.";

export const BASE_BRANCH_PROMPT_FALLBACK =
	"Review the code changes against the base branch '{branch}'. Start by finding the merge diff between the current branch and {branch}'s upstream e.g. (`git merge-base HEAD \"$(git rev-parse --abbrev-ref \"{branch}@{upstream}\")\"`), then run `git diff` against that SHA to see what changes we would merge into the {branch} branch. Provide prioritized, actionable findings.";

export function getReviewFixWorkflow(targetType?: ReviewTarget["type"]): ReviewFixWorkflow {
	if (targetType === "uncommitted" || targetType === undefined) {
		return "staged";
	}

	return "fixup";
}

function getReviewModeLabel(targetType?: ReviewTarget["type"]): string {
	switch (targetType) {
		case "uncommitted":
			return "uncommitted changes";
		case "baseBranch":
			return "base branch";
		default:
			return "unknown";
	}
}

function renderPromptTemplate(template: string, values: Record<string, string>): string {
	let prompt = template;
	for (const [key, value] of Object.entries(values)) {
		prompt = prompt.replaceAll(`{{${key}}}`, () => value);
	}

	const unresolvedPlaceholders = prompt.match(UNRESOLVED_PROMPT_PLACEHOLDER_PATTERN);
	if (unresolvedPlaceholders) {
		throw new Error(`Unresolved prompt template placeholder(s): ${[...new Set(unresolvedPlaceholders)].join(", ")}`);
	}

	return prompt.trim();
}

export function buildReviewFixFindingsPrompt(
	template: string,
	targetType?: ReviewTarget["type"],
): string {
	const workflow = getReviewFixWorkflow(targetType);
	const reviewModeLabel = getReviewModeLabel(targetType);
	const commitDisciplineIntro =
		targetType === undefined
			? "The original review mode is unavailable. Use the staging workflow below so you do not create accidental commits."
			: `This review was started in ${reviewModeLabel} mode. Use the ${workflow === "fixup" ? "fixup" : "staging"} workflow below.`;
	const workflowInstructions = workflow === "fixup"
		? `**Fixup workflow:**
After each fix is applied:
1. Before editing the file, run \`git blame <file> -L <start>,<end>\` to identify the commit that introduced the code being fixed.
2. Stage the change: \`git add <file>\`
3. Create an atomic fixup commit: \`git commit --fixup <sha>\`
Do NOT run \`git rebase --autosquash\` — that is the user's decision.`
		: `**Staging workflow:**
For each file being fixed:
1. Stage its current state before editing: \`git add <file>\`
2. Apply the fix. The unstaged diff now shows exactly what changed.
Do NOT commit. Leave the files staged/unstaged for the user to handle.`;

	return renderPromptTemplate(template, {
		commitDisciplineIntro,
		workflowInstructions,
		preparedItemLabel: workflow === "fixup" ? "fixup commit created" : "file prepared",
		preparedItemTargetDetail: workflow === "fixup" ? ", and which original commit it targets" : "",
		nextStepInstruction: workflow === "fixup"
			? "Run `git rebase --autosquash` to fold all fixups in (requires explicit user approval before executing)"
			: "Review or commit the staged/unstaged changes manually",
		preparedChangesLabel: workflow === "fixup" ? "fixup commits" : "the prepared changes",
	});
}

// ─── Argument parsing ─────────────────────────────────────────────────────────

export function tokenizeArgs(value: string): string[] {
	const tokens: string[] = [];
	let current = "";
	let quote: '"' | "'" | null = null;

	for (let i = 0; i < value.length; i++) {
		const char = value[i];

		if (quote) {
			if (char === "\\" && i + 1 < value.length) {
				current += value[i + 1];
				i += 1;
				continue;
			}
			if (char === quote) {
				quote = null;
				continue;
			}
			current += char;
			continue;
		}

		if (char === '"' || char === "'") {
			quote = char;
			continue;
		}

		if (/\s/.test(char)) {
			if (current.length > 0) {
				tokens.push(current);
				current = "";
			}
			continue;
		}

		current += char;
	}

	if (current.length > 0) {
		tokens.push(current);
	}

	return tokens;
}

export function parseArgs(args: string | undefined): ParsedReviewArgs {
	if (!args?.trim()) return { target: null };

	const rawParts = tokenizeArgs(args.trim());
	const parts: string[] = [];
	let extraInstruction: string | undefined;

	for (let i = 0; i < rawParts.length; i++) {
		const part = rawParts[i];
		if (part === "--extra") {
			const next = rawParts[i + 1];
			if (!next) {
				return { target: null, error: "Missing value for --extra" };
			}
			extraInstruction = next;
			i += 1;
			continue;
		}

		if (part.startsWith("--extra=")) {
			extraInstruction = part.slice("--extra=".length);
			continue;
		}

		parts.push(part);
	}

	// Helper: build result without undefined properties for clean deepEqual comparisons.
	function result(target: ParsedReviewArgs["target"]): ParsedReviewArgs {
		return extraInstruction !== undefined ? { target, extraInstruction } : { target };
	}

	if (parts.length === 0) {
		return result(null);
	}

	const subcommand = parts[0]?.toLowerCase();

	switch (subcommand) {
		case "uncommitted":
			return result({ type: "uncommitted" });

		case "branch": {
			const branch = parts[1];
			if (!branch) return result(null);
			return result({ type: "baseBranch", branch });
		}

		default:
			return result(null);
	}
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export function getUserFacingHint(target: ReviewTarget): string {
	switch (target.type) {
		case "uncommitted":
			return "current changes";
		case "baseBranch":
			return `changes against '${target.branch}'`;
	}
}

export function buildReviewSessionName(target: ReviewTarget): string | undefined {
	switch (target.type) {
		case "uncommitted":
			return buildWorkflowSessionName("review", "uncommitted");
		case "baseBranch":
			return buildWorkflowSessionName("review", target.branch);
	}
}
