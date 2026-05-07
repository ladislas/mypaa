import type { LabelSpec, LegacyLabelMapping } from "./types.ts";

export const REQUIRED_PAC_LABELS: LabelSpec[] = [
	{
		name: "pac:needs_triage",
		color: "FBCA04",
		description: "pac state: maintainer needs to evaluate this issue",
	},
	{
		name: "pac:needs_info",
		color: "F9D0C4",
		description: "pac state: waiting on reporter/requester for more information",
	},
	{
		name: "pac:ready_for_agent",
		color: "0E8A16",
		description: "pac state: fully specified and ready for an AFK agent",
	},
	{
		name: "pac:ready_for_human",
		color: "1D76DB",
		description: "pac state: requires human implementation, judgment, access, or approval",
	},
	{
		name: "pac:out_of_scope",
		color: "D3D3D3",
		description: "pac terminal: request crosses a durable project scope boundary",
	},
	{
		name: "pac:wontfix",
		color: "666666",
		description: "pac terminal: valid or in-scope issue will not be actioned",
	},
	{
		name: "pac:prd",
		color: "BFDADC",
		description: "pac artifact: issue contains a PRD artifact or was created from a PRD",
	},
	{
		name: "pac:adr",
		color: "5319E7",
		description: "pac artifact: issue contains an ADR decision comment",
	},
	{
		name: "pac:hitl",
		color: "D876E3",
		description: "pac execution: requires human-in-the-loop decisions or approval",
	},
	{
		name: "pac:afk",
		color: "006B75",
		description: "pac execution: can be implemented autonomously by an agent",
	},
];

export const LEGACY_LABEL_MAPPINGS: LegacyLabelMapping[] = [
	{ legacy: "needs triage", target: "pac:needs_triage" },
	{ legacy: "needs-info", target: "pac:needs_info" },
	{ legacy: "ready-for-agent", target: "pac:ready_for_agent" },
	{ legacy: "ready-for-human", target: "pac:ready_for_human" },
	{ legacy: "out of scope", target: "pac:out_of_scope" },
	{ legacy: "wontfix", target: "pac:wontfix" },
	{ legacy: "prd", target: "pac:prd" },
	{ legacy: "adr", target: "pac:adr" },
];

export const HOST_OWNED_LABELS = new Set([
	"bug",
	"documentation",
	"duplicate",
	"enhancement",
	"good first issue",
	"help wanted",
	"invalid",
	"question",
]);
