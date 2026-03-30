import { tool, type Plugin } from "@opencode-ai/plugin";

type ModelMetadata = {
  providerID: string;
  modelID: string;
  id: string;
};

type SessionRuntimeState = {
  currentAgent?: string;
  lastEffectiveAgent?: string;
  previousAgent?: string;
  activeModel?: ModelMetadata;
  updatedAt?: string;
};

type PolicyClassification = "build" | "non-build";

type AgentLike =
  | string
  | {
      name?: string;
      id?: string;
    }
  | null
  | undefined;

const runtimeStateBySession = new Map<string, SessionRuntimeState>();
const MAX_SESSIONS_BEFORE_PRUNE = 1000;
const BUILD_AGENTS = new Set(["RickBuild", "build"]);
const MUTATION_TOOL_IDS = new Set(["edit", "write", "patch", "apply_patch"]);
const SHELL_TOOL_IDS = new Set(["bash", "shell"]);
const SHELL_COMMAND_SUBSTITUTION = /`|\$\(/;
const SHELL_VARIABLE_EXPANSION = /\$\{?[A-Za-z_]/;

/**
 * Returns true if the command string contains a shell control operator that is
 * not escaped (i.e. preceded by an odd number of backslashes). A double-escape
 * like \\; means a literal backslash followed by a live semicolon operator and
 * must be rejected.
 */
function hasLiveControlOperator(command: string): boolean {
  const matches = command.matchAll(/&&|\|\||[;|><\n\r]/g);
  for (const match of matches) {
    const offset = match.index ?? 0;
    let backslashCount = 0;
    let cursor = offset - 1;
    while (cursor >= 0 && command[cursor] === "\\") {
      backslashCount += 1;
      cursor -= 1;
    }
    // Odd count means the operator itself is escaped — skip it.
    // Even count (including zero) means a literal backslash (or none) precedes
    // the operator, so the operator is live.
    if (backslashCount % 2 === 0) {
      return true;
    }
  }
  return false;
}

function pruneSessionState() {
  if (runtimeStateBySession.size < MAX_SESSIONS_BEFORE_PRUNE) {
    return;
  }

  const oldestSession = runtimeStateBySession.entries().next().value?.[0];
  if (oldestSession) {
    runtimeStateBySession.delete(oldestSession);
  }
}

function ensureSessionState(sessionID: string) {
  let state = runtimeStateBySession.get(sessionID);
  if (!state) {
    pruneSessionState();
    state = {};
    runtimeStateBySession.set(sessionID, state);
  }
  return state;
}

function setActiveModel(
  state: SessionRuntimeState,
  model?: { providerID: string; modelID: string } | { providerID: string; id: string },
) {
  if (!model) {
    return;
  }

  const modelID = "modelID" in model ? model.modelID : model.id;
  state.activeModel = {
    providerID: model.providerID,
    modelID,
    id: `${model.providerID}/${modelID}`,
  };
}

function touchState(state: SessionRuntimeState) {
  state.updatedAt = new Date().toISOString();
}

function normalizeAgent(agent: AgentLike) {
  if (typeof agent === "string") {
    const normalized = agent.trim();
    return normalized || undefined;
  }

  if (!agent || typeof agent !== "object") {
    return undefined;
  }

  if (typeof agent.name === "string") {
    const normalized = agent.name.trim();
    if (normalized) {
      return normalized;
    }
  }

  if (typeof agent.id === "string") {
    const normalized = agent.id.trim();
    if (normalized) {
      return normalized;
    }
  }

  return undefined;
}

function setCurrentAgent(state: SessionRuntimeState, agent: string) {
  state.currentAgent = agent;
  state.previousAgent = state.lastEffectiveAgent && state.lastEffectiveAgent !== agent ? state.lastEffectiveAgent : undefined;
}

function classifyPolicy(agent?: string): PolicyClassification {
  const normalizedAgent = normalizeAgent(agent);
  if (!normalizedAgent) {
    return "non-build";
  }

  return BUILD_AGENTS.has(normalizedAgent) ? "build" : "non-build";
}

function getPolicyAgent(sessionID: string) {
  const state = ensureSessionState(sessionID);
  // Prefer lastEffectiveAgent (set only on confirmed chat.message turns) so
  // transient chat.params picker changes cannot poison the enforcement policy.
  return normalizeAgent(state.lastEffectiveAgent) || normalizeAgent(state.currentAgent);
}

function getPolicySummary(agent?: string) {
  return {
    agent: agent ?? null,
    policyClassification: classifyPolicy(agent),
  };
}

function denyToolExecution(toolID: string, agent?: string, reason?: string): never {
  const summary = getPolicySummary(agent);
  const details = [
    `Tool '${toolID}' is denied for non-build agent '${summary.agent ?? "unknown"}'.`,
    reason,
    "Switch to RickBuild or build for implementation work.",
  ]
    .filter(Boolean)
    .join(" ");

  throw new Error(details);
}

function getShellCommand(args: unknown) {
  if (!args || typeof args !== "object") {
    return undefined;
  }

  if ("command" in args && typeof args.command === "string") {
    return args.command.trim();
  }

  if ("cmd" in args && typeof args.cmd === "string") {
    return args.cmd.trim();
  }

  return undefined;
}

function tokenizeShellCommand(command: string) {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | undefined;

  for (let index = 0; index < command.length; index += 1) {
    const character = command[index];

    if (character === "\\") {
      const next = command[index + 1];
      if (next) {
        current += next;
        index += 1;
        continue;
      }
    }

    if (quote) {
      if (character === quote) {
        quote = undefined;
        continue;
      }

      current += character;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }

    if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += character;
  }

  if (quote) {
    return undefined;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

function isAllowedNonBuildShellCommand(command: string) {
  if (!command) {
    return false;
  }

  // Reject command substitution: $(…) and backtick form.
  if (SHELL_COMMAND_SUBSTITUTION.test(command)) {
    return false;
  }

  // Reject variable expansion: $VAR and ${VAR} can inject arbitrary arguments.
  if (SHELL_VARIABLE_EXPANSION.test(command)) {
    return false;
  }

  // Reject live control operators, accounting for even-count backslash escapes.
  if (hasLiveControlOperator(command)) {
    return false;
  }

  const tokens = tokenizeShellCommand(command);
  if (!tokens?.length) {
    return false;
  }

  const [binary, firstArg, secondArg, thirdArg] = tokens;

  if (binary === "git") {
    return ["status", "diff", "log", "show", "branch", "rev-parse", "ls-files"].includes(firstArg ?? "");
  }

  if (["grep", "rg", "ls", "head", "tail", "wc", "file", "tree", "openspec"].includes(binary)) {
    return true;
  }

  if (binary === "gh" && firstArg === "auth" && secondArg === "status") {
    return true;
  }

  if (binary === "gh" && firstArg === "repo" && secondArg === "view") {
    return true;
  }

  if (binary === "gh" && firstArg === "issue") {
    return ["list", "view", "create", "edit", "close"].includes(secondArg ?? "");
  }

  if (binary === "gh" && firstArg === "label" && secondArg === "list") {
    return true;
  }

  if (binary === "gh" && firstArg === "label" && secondArg === "create" && thirdArg === "needs triage") {
    return true;
  }

  return false;
}

function getRuntimeSnapshot(sessionID: string) {
  const state = ensureSessionState(sessionID);
  const policyAgent = getPolicyAgent(sessionID);

  return {
    currentAgent: state.currentAgent ?? null,
    previousAgent: state.previousAgent ?? null,
    activeModel: state.activeModel ?? null,
    policyAgent: policyAgent ?? null,
    policyClassification: classifyPolicy(policyAgent),
  };
}

function buildSyntheticRuntimeContext(state: SessionRuntimeState) {
  const currentAgent = normalizeAgent(state.currentAgent) || normalizeAgent(state.lastEffectiveAgent);
  if (!currentAgent) {
    return;
  }

  const summary = [`Runtime: agent=${currentAgent}`];

  if (state.previousAgent) {
    summary.push(`previous=${state.previousAgent}`);
  }

  if (state.activeModel?.id) {
    summary.push(`model=${state.activeModel.id}`);
  }

  const lines = [summary.join(" ")];

  if (state.previousAgent) {
    lines.push(
      `Handoff: prior assistant outputs may reflect ${state.previousAgent}; treat them as historical outputs, not your current identity.`,
    );
  }

  return lines.join("\n");
}

function recordEffectiveTurn(input: {
  sessionID: string;
  agent?: AgentLike;
  model?: { providerID: string; modelID: string };
}) {
  const state = ensureSessionState(input.sessionID);
  const agent = normalizeAgent(input.agent);

  if (agent) {
    setCurrentAgent(state, agent);
    state.lastEffectiveAgent = agent;
  }

  setActiveModel(state, input.model);
  touchState(state);
}

function refreshActiveRuntime(input: {
  sessionID: string;
  agent?: AgentLike;
  model?: { providerID: string; id: string };
}) {
  const state = ensureSessionState(input.sessionID);

  const agent = normalizeAgent(input.agent);

  if (agent) {
    setCurrentAgent(state, agent);
  }

  setActiveModel(state, input.model);
  touchState(state);
}

export const AgentRuntimeAwarenessPlugin: Plugin = async () => {
  return {
    tool: {
      runtime_introspection: tool({
        description: "Return current runtime awareness context",
        args: {},
        async execute(_args, context) {
          const snapshot = getRuntimeSnapshot(context.sessionID);
          context.metadata({
            title: "Runtime introspection",
            metadata: snapshot,
          });
          return JSON.stringify(snapshot, null, 2);
        },
      }),
    },
    "chat.message": async (input) => {
      recordEffectiveTurn(input);
    },
    "chat.params": async (input) => {
      refreshActiveRuntime(input);
    },
    "experimental.chat.system.transform": async (input, output) => {
      if (!input.sessionID) {
        return;
      }

      const state = ensureSessionState(input.sessionID);
      setActiveModel(state, input.model);

      const runtimeContext = buildSyntheticRuntimeContext(state);
      if (!runtimeContext) {
        return;
      }

      output.system.push(runtimeContext);

      // Clear previousAgent after the handoff frame has been injected once.
      // Subsequent turns with the same effective agent must not repeat the notice.
      state.previousAgent = undefined;
    },
    "tool.execute.before": async (input, output) => {
      const agent = getPolicyAgent(input.sessionID);
      if (classifyPolicy(agent) !== "non-build") {
        return;
      }

      if (MUTATION_TOOL_IDS.has(input.tool)) {
        denyToolExecution(
          input.tool,
          agent,
          "Non-build agents are read-only and cannot mutate files.",
        );
      }

      if (!SHELL_TOOL_IDS.has(input.tool)) {
        return;
      }

      const command = getShellCommand(output.args);
      if (!command) {
        denyToolExecution(
          input.tool,
          agent,
          "Shell access for non-build agents requires an explicit allowed analysis command.",
        );
      }

      if (!isAllowedNonBuildShellCommand(command)) {
        denyToolExecution(
          input.tool,
          agent,
          `Command '${command}' is outside the allowed analysis and scoped GitHub issue workflows.`,
        );
      }
    },
  };
};

export default AgentRuntimeAwarenessPlugin;
