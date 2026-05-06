import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const reviewSummaryPromptPath = path.join(currentDir, "REVIEW_SUMMARY_PROMPT.md");
const reviewFixFindingsPromptPath = path.join(currentDir, "REVIEW_FIX_FINDINGS_PROMPT.md");

let reviewSummaryPrompt: string | undefined;
let reviewFixFindingsPrompt: string | undefined;

export class ReviewPromptLoadError extends Error {
	readonly cause: unknown;

	constructor(promptLabel: string, promptPath: string, cause: unknown) {
		super(`Review extension failed to load ${promptLabel} Markdown prompt at ${promptPath}: ${formatCause(cause)}`);
		this.name = "ReviewPromptLoadError";
		this.cause = cause;
	}
}

function formatCause(cause: unknown): string {
	if (cause instanceof Error) {
		return cause.message;
	}
	return String(cause);
}

export function formatReviewPromptError(error: unknown): string {
	if (error instanceof ReviewPromptLoadError) {
		return error.message;
	}
	return `Review extension failed to prepare a Markdown prompt: ${formatCause(error)}`;
}

export function stripPromptMarkdownTitle(prompt: string): string {
	return prompt.replace(/^# .+\n+/, "").trim();
}

export async function loadMarkdownReviewPrompt(promptLabel: string, promptPath: string): Promise<string> {
	try {
		return stripPromptMarkdownTitle(await fs.readFile(promptPath, "utf8"));
	} catch (error) {
		throw new ReviewPromptLoadError(promptLabel, promptPath, error);
	}
}

export async function loadReviewSummaryPrompt(): Promise<string> {
	reviewSummaryPrompt ??= await loadMarkdownReviewPrompt("review summary", reviewSummaryPromptPath);
	return reviewSummaryPrompt;
}

export async function loadReviewFixFindingsPrompt(): Promise<string> {
	reviewFixFindingsPrompt ??= await loadMarkdownReviewPrompt("review fix-findings", reviewFixFindingsPromptPath);
	return reviewFixFindingsPrompt;
}
