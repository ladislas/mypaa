import { normalizeColor } from "./drift.ts";
import type { ApplyOperationResult, ApplyPlan, DriftedLabel, GitHubLabel, LabelCheckResult, LabelSpec } from "./types.ts";

function labelLine(label: LabelSpec): string {
	return `- \`${label.name}\` #${normalizeColor(label.color)} — ${label.description}`;
}

function existingLabelLine(label: GitHubLabel): string {
	return `- \`${label.name}\` #${normalizeColor(label.color)} — ${label.description ?? ""}`;
}

function section(lines: string[], title: string, entries: string[], emptyText: string): void {
	lines.push("", `## ${title}`);
	if (entries.length === 0) {
		lines.push(emptyText);
		return;
	}
	lines.push(...entries);
}

function driftLine(drift: DriftedLabel): string {
	const details: string[] = [];
	if (drift.fields.color) {
		details.push(`color #${drift.fields.color.actual} → #${drift.fields.color.expected}`);
	}
	if (drift.fields.description) {
		details.push(`description "${drift.fields.description.actual}" → "${drift.fields.description.expected}"`);
	}
	return `- \`${drift.expected.name}\`: ${details.join("; ")}`;
}

export function renderCheckResult(repo: string, result: LabelCheckResult): string {
	const lines = [
		`# Pac workflow labels — ${repo}`,
		"",
		`Required pac labels: ${result.present.length}/${result.required.length} present`,
		`Missing: ${result.missing.length} · Drifted: ${result.drifted.length} · Migration candidates: ${result.migrationCandidates.length} · Conflicts: ${result.conflicts.length}`,
	];

	section(lines, "Missing required pac labels", result.missing.map(labelLine), "None.");
	section(lines, "Drifted pac label metadata", result.drifted.map(driftLine), "None.");
	section(
		lines,
		"Legacy migration candidates",
		result.migrationCandidates.map(
			(candidate) =>
				`- Rename \`${candidate.mapping.legacy}\` → \`${candidate.mapping.target}\` and set #${normalizeColor(candidate.expected.color)} — ${candidate.expected.description}`,
		),
		"None.",
	);
	section(
		lines,
		"Legacy conflicts skipped by apply mode",
		result.conflicts.map(
			(conflict) =>
				`- \`${conflict.mapping.legacy}\` and \`${conflict.mapping.target}\` both exist; resolve manually before migration.`,
		),
		"None.",
	);
	section(lines, "Host-owned labels noticed but not managed", result.hostOwned.map(existingLabelLine), "None noticed.");
	section(lines, "Unexpected pac:* labels", result.unexpectedPacLabels.map(existingLabelLine), "None.");

	return lines.join("\n");
}

export function renderApplyPlan(repo: string, plan: ApplyPlan): string {
	const lines = [`# Pac workflow label apply plan — ${repo}`];

	section(
		lines,
		"Renames",
		plan.renames.map(
			(candidate) =>
				`- \`${candidate.mapping.legacy}\` → \`${candidate.mapping.target}\` with #${normalizeColor(candidate.expected.color)} — ${candidate.expected.description}`,
		),
		"None.",
	);
	section(lines, "Creates", plan.creates.map(labelLine), "None.");
	section(lines, "Metadata updates", plan.updates.map(driftLine), "None.");
	section(
		lines,
		"Conflicts not auto-resolved",
		plan.conflicts.map(
			(conflict) =>
				`- \`${conflict.mapping.legacy}\` and \`${conflict.mapping.target}\` both exist; apply mode will not rename/delete either label.`,
		),
		"None.",
	);

	return lines.join("\n");
}

export function renderApplyResults(repo: string, results: ApplyOperationResult[]): string {
	const lines = [`# Pac workflow label apply results — ${repo}`, ""];
	if (results.length === 0) {
		lines.push("No changes were needed.");
		return lines.join("\n");
	}

	for (const result of results) {
		const marker = result.success ? "✓" : "✗";
		const target = result.target ? ` → \`${result.target}\`` : "";
		lines.push(`- ${marker} ${result.action} \`${result.label}\`${target}: ${result.message}`);
	}

	return lines.join("\n");
}

export function renderHelp(): string {
	return [
		"# /pac-setup-workflows",
		"",
		"Check and apply canonical pac GitHub workflow labels.",
		"",
		"Usage:",
		"",
		"```text",
		"/pac-setup-workflows",
		"/pac-setup-workflows labels check",
		"/pac-setup-workflows labels apply",
		"/pac-setup-workflows labels check --repo owner/repo",
		"/pac-setup-workflows labels apply --repo owner/repo",
		"```",
		"",
		"Check mode is dry-run. Apply mode requires explicit confirmation before creating labels, updating pac:* metadata, or renaming known legacy labels.",
	].join("\n");
}
