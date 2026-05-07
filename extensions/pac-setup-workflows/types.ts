export type LabelSpec = {
	name: string;
	color: string;
	description: string;
};

export type GitHubLabel = {
	name: string;
	color: string;
	description?: string | null;
};

export type LegacyLabelMapping = {
	legacy: string;
	target: string;
};

export type DriftField = "color" | "description";

export type DriftedLabel = {
	expected: LabelSpec;
	actual: GitHubLabel;
	fields: Partial<Record<DriftField, { expected: string; actual: string }>>;
};

export type LegacyMigrationCandidate = {
	mapping: LegacyLabelMapping;
	legacyLabel: GitHubLabel;
	expected: LabelSpec;
};

export type LegacyConflict = {
	mapping: LegacyLabelMapping;
	legacyLabel: GitHubLabel;
	targetLabel: GitHubLabel;
	expected: LabelSpec;
};

export type LabelCheckResult = {
	required: LabelSpec[];
	present: Array<{ expected: LabelSpec; actual: GitHubLabel }>;
	missing: LabelSpec[];
	drifted: DriftedLabel[];
	migrationCandidates: LegacyMigrationCandidate[];
	conflicts: LegacyConflict[];
	hostOwned: GitHubLabel[];
	unexpectedPacLabels: GitHubLabel[];
};

export type ApplyPlan = {
	renames: LegacyMigrationCandidate[];
	creates: LabelSpec[];
	updates: DriftedLabel[];
	conflicts: LegacyConflict[];
};

export type ParsedCommand =
	| { action: "menu"; repo?: string }
	| { action: "check"; repo?: string }
	| { action: "apply"; repo?: string }
	| { action: "help"; repo?: string }
	| { action: "error"; message: string };

export type ApplyOperationResult = {
	action: "rename" | "create" | "update";
	label: string;
	target?: string;
	success: boolean;
	message: string;
};
