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
  state.previousAgent =
    state.lastEffectiveAgent && state.lastEffectiveAgent !== agent ? state.lastEffectiveAgent : undefined;
}

function getRuntimeSnapshot(sessionID: string) {
  const state = ensureSessionState(sessionID);

  return {
    currentAgent: state.currentAgent ?? null,
    previousAgent: state.previousAgent ?? null,
    activeModel: state.activeModel ?? null,
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
  };
};

export default AgentRuntimeAwarenessPlugin;
