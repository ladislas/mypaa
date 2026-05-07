import { buildWorkflowSessionName } from "../session-names/helpers.ts";

export function normalizeIssueNote(input: string): string {
	return input.trim();
}

export function buildIssueSessionName(note: string): string | undefined {
	return buildWorkflowSessionName("ghi", note);
}

export function buildIssueCreatePrompt(skillContent: string, note: string): string {
	return [
		skillContent.trim(),
		"",
		"---",
		"",
		"Create a GitHub issue for the current repository based on the note below.",
		"Stay within this create-only /ghi workflow.",
		"Infer and apply an existing pac workflow state label when the user's intent is clear.",
		"If the note is too ambiguous to create a useful issue or choose a pac state label, ask at most one brief follow-up question before creating it.",
		"",
		"Issue note:",
		normalizeIssueNote(note),
	].join("\n");
}
