import type { ExtensionAPI, ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import { analyzeLabels, buildApplyPlan, countPlannedChanges, hasCleanRequiredLabels } from "./drift.ts";
import { createLabel, fetchLabels, parseCommand, renameLabel, resolveRepo, updateLabel } from "./github.ts";
import { renderApplyPlan, renderApplyResults, renderCheckResult, renderHelp } from "./render.ts";
import type { ApplyOperationResult, LabelCheckResult } from "./types.ts";

type CheckContext = {
	repo: string;
	result: LabelCheckResult;
};

function publish(pi: ExtensionAPI, content: string): void {
	pi.sendMessage({ customType: "pac-setup-workflows", content, display: true }, { triggerTurn: false });
}

function setupError(message: string): string {
	return [
		"Could not inspect GitHub labels.",
		"",
		"Prerequisites:",
		"- Run inside a GitHub repository or pass `--repo owner/repo`.",
		"- Install GitHub CLI (`gh`).",
		"- Authenticate with `gh auth login`.",
		"",
		"Details:",
		message,
	].join("\n");
}

async function checkLabels(pi: ExtensionAPI, ctx: ExtensionCommandContext, repoArg?: string): Promise<CheckContext | undefined> {
	const resolved = await resolveRepo(pi, repoArg);
	if (!resolved.ok) {
		publish(pi, setupError(resolved.error));
		ctx.ui.notify("Could not resolve GitHub repository", "error");
		return;
	}

	const labels = await fetchLabels(pi, resolved.value);
	if (!labels.ok) {
		publish(pi, setupError(labels.error));
		ctx.ui.notify("Could not read GitHub labels", "error");
		return;
	}

	const result = analyzeLabels(labels.value);
	publish(pi, renderCheckResult(resolved.value, result));
	ctx.ui.notify(
		hasCleanRequiredLabels(result)
			? "Pac workflow labels are up to date"
			: "Pac workflow label check found changes to review",
		hasCleanRequiredLabels(result) ? "info" : "warning",
	);
	return { repo: resolved.value, result };
}

async function applyLabels(pi: ExtensionAPI, ctx: ExtensionCommandContext, repoArg?: string): Promise<void> {
	const check = await checkLabels(pi, ctx, repoArg);
	if (!check) return;

	const plan = buildApplyPlan(check.result);
	const changeCount = countPlannedChanges(plan);
	publish(pi, renderApplyPlan(check.repo, plan));

	if (changeCount === 0) {
		ctx.ui.notify("No pac workflow label changes needed", "info");
		return;
	}

	if (!ctx.hasUI) {
		publish(pi, "Apply mode requires explicit interactive confirmation. Re-run this command in interactive/RPC mode.");
		ctx.ui.notify("Apply requires interactive confirmation", "error");
		return;
	}

	const confirmed = await ctx.ui.confirm(
		"Apply pac workflow labels?",
		[
			`Repository: ${check.repo}`,
			`Renames: ${plan.renames.length}`,
			`Creates: ${plan.creates.length}`,
			`Metadata updates: ${plan.updates.length}`,
			`Conflicts skipped: ${plan.conflicts.length}`,
			"",
			"This will mutate GitHub labels. Continue?",
		].join("\n"),
	);

	if (!confirmed) {
		ctx.ui.notify("Pac workflow label apply cancelled", "info");
		return;
	}

	const results: ApplyOperationResult[] = [];
	for (const rename of plan.renames) {
		results.push(await renameLabel(pi, check.repo, rename.mapping.legacy, rename.expected));
	}
	for (const create of plan.creates) {
		results.push(await createLabel(pi, check.repo, create));
	}
	for (const update of plan.updates) {
		results.push(await updateLabel(pi, check.repo, update.expected));
	}

	publish(pi, renderApplyResults(check.repo, results));
	ctx.ui.notify(results.every((result) => result.success) ? "Pac workflow label apply finished" : "Some label operations failed", results.every((result) => result.success) ? "info" : "error");

	await checkLabels(pi, ctx, check.repo);
}

async function showMenu(pi: ExtensionAPI, ctx: ExtensionCommandContext, repo?: string): Promise<void> {
	if (!ctx.hasUI) {
		await checkLabels(pi, ctx, repo);
		return;
	}

	const choice = await ctx.ui.select("Pac workflow setup", ["Labels: check (dry-run)", "Labels: apply changes", "Help"]);
	if (!choice) {
		ctx.ui.notify("Pac workflow setup cancelled", "info");
		return;
	}
	if (choice.startsWith("Labels: check")) {
		await checkLabels(pi, ctx, repo);
		return;
	}
	if (choice.startsWith("Labels: apply")) {
		await applyLabels(pi, ctx, repo);
		return;
	}
	publish(pi, renderHelp());
}

export default function pacSetupWorkflowsExtension(pi: ExtensionAPI): void {
	pi.registerCommand("pac-setup-workflows", {
		description: "Check or apply pac GitHub workflow labels",
		getArgumentCompletions: (prefix) => {
			const options = ["labels check", "labels apply", "labels check --repo ", "labels apply --repo ", "help"];
			const filtered = options.filter((option) => option.startsWith(prefix));
			return filtered.length > 0 ? filtered.map((option) => ({ value: option, label: option })) : null;
		},
		handler: async (args, ctx) => {
			const parsed = parseCommand(args ?? "");
			if (parsed.action === "error") {
				publish(pi, `${parsed.message}\n\n${renderHelp()}`);
				ctx.ui.notify("Invalid /pac-setup-workflows arguments", "error");
				return;
			}
			if (parsed.action === "help") {
				publish(pi, renderHelp());
				return;
			}
			if (parsed.action === "check") {
				await checkLabels(pi, ctx, parsed.repo);
				return;
			}
			if (parsed.action === "apply") {
				await applyLabels(pi, ctx, parsed.repo);
				return;
			}
			await showMenu(pi, ctx, parsed.repo);
		},
	});
}
