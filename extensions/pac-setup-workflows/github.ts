import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { ApplyOperationResult, GitHubLabel, LabelSpec, ParsedCommand } from "./types.ts";
import { normalizeColor } from "./drift.ts";

export function splitArgs(input: string): string[] {
	const args: string[] = [];
	let current = "";
	let quote: "'" | '"' | null = null;
	let escaping = false;

	for (const char of input.trim()) {
		if (escaping) {
			current += char;
			escaping = false;
			continue;
		}

		if (char === "\\" && quote !== "'") {
			escaping = true;
			continue;
		}

		if ((char === '"' || char === "'") && !quote) {
			quote = char;
			continue;
		}

		if (char === quote) {
			quote = null;
			continue;
		}

		if (/\s/.test(char) && !quote) {
			if (current) {
				args.push(current);
				current = "";
			}
			continue;
		}

		current += char;
	}

	if (escaping) current += "\\";
	if (current) args.push(current);
	return args;
}

function isOwnerRepo(value: string): boolean {
	return /^[^\s/]+\/[^\s/]+$/.test(value);
}

export function parseCommand(input: string): ParsedCommand {
	const tokens = splitArgs(input);
	let repo: string | undefined;
	const rest: string[] = [];

	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index];
		if (token === "--repo") {
			const value = tokens[index + 1];
			if (!value) return { action: "error", message: "--repo requires owner/repo" };
			if (!isOwnerRepo(value)) return { action: "error", message: `Invalid --repo value: ${value}` };
			repo = value;
			index++;
			continue;
		}
		if (token.startsWith("--repo=")) {
			const value = token.slice("--repo=".length);
			if (!isOwnerRepo(value)) return { action: "error", message: `Invalid --repo value: ${value}` };
			repo = value;
			continue;
		}
		rest.push(token);
	}

	if (rest.length === 0) return { action: "menu", repo };
	if (rest.length === 1 && (rest[0] === "help" || rest[0] === "--help" || rest[0] === "-h")) return { action: "help", repo };
	if (rest.length === 2 && rest[0] === "labels" && rest[1] === "check") return { action: "check", repo };
	if (rest.length === 2 && rest[0] === "labels" && rest[1] === "apply") return { action: "apply", repo };

	return { action: "error", message: `Unknown arguments: ${rest.join(" ")}` };
}

type GhResult<T> = { ok: true; value: T } | { ok: false; error: string };

async function runGh(pi: ExtensionAPI, args: string[]): Promise<GhResult<string>> {
	const result = await pi.exec("gh", args, { timeout: 30_000 });
	if (result.code !== 0) {
		const output = [result.stderr.trim(), result.stdout.trim()].filter(Boolean).join("\n");
		return { ok: false, error: output || `gh ${args.join(" ")} failed with exit code ${result.code}` };
	}
	return { ok: true, value: result.stdout };
}

export async function resolveRepo(pi: ExtensionAPI, repo?: string): Promise<GhResult<string>> {
	if (repo) return { ok: true, value: repo };
	const result = await runGh(pi, ["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]);
	if (!result.ok) return result;
	const value = result.value.trim();
	if (!isOwnerRepo(value)) return { ok: false, error: "Could not infer GitHub repository. Pass --repo owner/repo." };
	return { ok: true, value };
}

export async function fetchLabels(pi: ExtensionAPI, repo: string): Promise<GhResult<GitHubLabel[]>> {
	const result = await runGh(pi, ["api", "--paginate", "--slurp", `repos/${repo}/labels?per_page=100`]);
	if (!result.ok) return result;
	try {
		return { ok: true, value: parsePaginatedLabels(result.value) };
	} catch (error) {
		return { ok: false, error: `Could not parse gh api labels output: ${error instanceof Error ? error.message : String(error)}` };
	}
}

export function parsePaginatedLabels(output: string): GitHubLabel[] {
	const pages = JSON.parse(output) as unknown;
	if (!Array.isArray(pages)) {
		throw new Error("expected paginated labels response to be an array of pages");
	}

	const labels: GitHubLabel[] = [];
	for (const page of pages) {
		if (!Array.isArray(page)) {
			throw new Error("expected each paginated labels page to be an array");
		}

		for (const item of page) {
			if (!item || typeof item !== "object") {
				throw new Error("expected each label to be an object");
			}

			const label = item as { name?: unknown; color?: unknown; description?: unknown };
			if (typeof label.name !== "string") {
				throw new Error("expected label.name to be a string");
			}
			if (typeof label.color !== "string") {
				throw new Error(`expected label.color for ${label.name} to be a string`);
			}
			if (label.description !== undefined && label.description !== null && typeof label.description !== "string") {
				throw new Error(`expected label.description for ${label.name} to be a string or null`);
			}

			labels.push({ name: label.name, color: label.color, description: label.description as string | null | undefined });
		}
	}

	return labels;
}

export async function renameLabel(
	pi: ExtensionAPI,
	repo: string,
	legacyName: string,
	target: LabelSpec,
): Promise<ApplyOperationResult> {
	const result = await runGh(pi, [
		"label",
		"edit",
		legacyName,
		"--repo",
		repo,
		"--name",
		target.name,
		"--color",
		normalizeColor(target.color),
		"--description",
		target.description,
	]);

	return {
		action: "rename",
		label: legacyName,
		target: target.name,
		success: result.ok,
		message: result.ok ? "renamed and metadata updated" : result.error,
	};
}

export async function createLabel(pi: ExtensionAPI, repo: string, label: LabelSpec): Promise<ApplyOperationResult> {
	const result = await runGh(pi, [
		"label",
		"create",
		label.name,
		"--repo",
		repo,
		"--color",
		normalizeColor(label.color),
		"--description",
		label.description,
	]);

	return {
		action: "create",
		label: label.name,
		success: result.ok,
		message: result.ok ? "created" : result.error,
	};
}

export async function updateLabel(pi: ExtensionAPI, repo: string, label: LabelSpec): Promise<ApplyOperationResult> {
	const result = await runGh(pi, [
		"label",
		"edit",
		label.name,
		"--repo",
		repo,
		"--color",
		normalizeColor(label.color),
		"--description",
		label.description,
	]);

	return {
		action: "update",
		label: label.name,
		success: result.ok,
		message: result.ok ? "metadata updated" : result.error,
	};
}
