import { HOST_OWNED_LABELS, LEGACY_LABEL_MAPPINGS, REQUIRED_PAC_LABELS } from "./config.ts";
import type { ApplyPlan, GitHubLabel, LabelCheckResult, LabelSpec } from "./types.ts";

export function normalizeColor(color: string): string {
	return color.trim().replace(/^#/, "").toUpperCase();
}

function normalizeDescription(description: string | null | undefined): string {
	return description ?? "";
}

function labelKey(name: string): string {
	return name.toLowerCase();
}

function labelMap(labels: GitHubLabel[]): Map<string, GitHubLabel> {
	return new Map(labels.map((label) => [labelKey(label.name), label]));
}

function findRequired(name: string): LabelSpec | undefined {
	return REQUIRED_PAC_LABELS.find((label) => label.name === name);
}

export function analyzeLabels(labels: GitHubLabel[]): LabelCheckResult {
	const byName = labelMap(labels);
	const present: LabelCheckResult["present"] = [];
	const missing: LabelSpec[] = [];
	const drifted: LabelCheckResult["drifted"] = [];

	for (const expected of REQUIRED_PAC_LABELS) {
		const actual = byName.get(labelKey(expected.name));
		if (!actual) {
			missing.push(expected);
			continue;
		}

		present.push({ expected, actual });

		const fields: LabelCheckResult["drifted"][number]["fields"] = {};
		const actualColor = normalizeColor(actual.color);
		const expectedColor = normalizeColor(expected.color);
		if (actualColor !== expectedColor) {
			fields.color = { expected: expectedColor, actual: actualColor };
		}

		const actualDescription = normalizeDescription(actual.description);
		if (actualDescription !== expected.description) {
			fields.description = { expected: expected.description, actual: actualDescription };
		}

		if (Object.keys(fields).length > 0) {
			drifted.push({ expected, actual, fields });
		}
	}

	const migrationCandidates: LabelCheckResult["migrationCandidates"] = [];
	const conflicts: LabelCheckResult["conflicts"] = [];

	for (const mapping of LEGACY_LABEL_MAPPINGS) {
		const legacyLabel = byName.get(labelKey(mapping.legacy));
		if (!legacyLabel) continue;

		const targetLabel = byName.get(labelKey(mapping.target));
		const expected = findRequired(mapping.target);
		if (!expected) continue;

		if (targetLabel) {
			conflicts.push({ mapping, legacyLabel, targetLabel, expected });
		} else {
			migrationCandidates.push({ mapping, legacyLabel, expected });
		}
	}

	const requiredNames = new Set(REQUIRED_PAC_LABELS.map((label) => labelKey(label.name)));
	const hostOwned = labels.filter((label) => HOST_OWNED_LABELS.has(labelKey(label.name)));
	const unexpectedPacLabels = labels.filter((label) => labelKey(label.name).startsWith("pac:") && !requiredNames.has(labelKey(label.name)));

	return {
		required: REQUIRED_PAC_LABELS,
		present,
		missing,
		drifted,
		migrationCandidates,
		conflicts,
		hostOwned,
		unexpectedPacLabels,
	};
}

export function buildApplyPlan(result: LabelCheckResult): ApplyPlan {
	const renameTargets = new Set(result.migrationCandidates.map((candidate) => candidate.mapping.target));

	return {
		renames: result.migrationCandidates,
		creates: result.missing.filter((label) => !renameTargets.has(label.name)),
		updates: result.drifted,
		conflicts: result.conflicts,
	};
}

export function countPlannedChanges(plan: ApplyPlan): number {
	return plan.renames.length + plan.creates.length + plan.updates.length;
}

export function hasCleanRequiredLabels(result: LabelCheckResult): boolean {
	return result.missing.length === 0 && result.drifted.length === 0 && result.migrationCandidates.length === 0 && result.conflicts.length === 0;
}
