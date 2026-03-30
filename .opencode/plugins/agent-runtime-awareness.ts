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
  effectiveTurnMessageID?: string;
  updatedAt?: string;
};

type PolicyClassification = "build" | "non-build" | "unknown";

const runtimeStateBySession = new Map<string, SessionRuntimeState>();

function ensureSessionState(sessionID: string) {
  let state = runtimeStateBySession.get(sessionID);
  if (!state) {
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

function applyRuntimeAgent(state: SessionRuntimeState, agent: string) {
  const lastEffectiveAgent = state.lastEffectiveAgent;

  state.currentAgent = agent;
  state.previousAgent = lastEffectiveAgent && lastEffectiveAgent !== agent ? lastEffectiveAgent : undefined;
}

function classifyPolicy(agent?: string): PolicyClassification {
  if (!agent?.trim()) {
    return "unknown";
  }

  return agent === "RickBuild" || agent === "build" ? "build" : "non-build";
}

function getRuntimeSnapshot(sessionID: string) {
  const state = ensureSessionState(sessionID);

  return {
    currentAgent: state.currentAgent ?? null,
    previousAgent: state.previousAgent ?? null,
    activeModel: state.activeModel ?? null,
    policyClassification: classifyPolicy(state.currentAgent),
  };
}

function buildSyntheticRuntimeContext(state: SessionRuntimeState) {
  const currentAgent = state.currentAgent?.trim() || state.lastEffectiveAgent?.trim();
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
  agent?: string;
  messageID?: string;
  model?: { providerID: string; modelID: string };
}) {
  const state = ensureSessionState(input.sessionID);
  const agent = input.agent?.trim();

  if (agent) {
    applyRuntimeAgent(state, agent);
    state.lastEffectiveAgent = agent;
  }

  if (input.messageID) {
    state.effectiveTurnMessageID = input.messageID;
  }

  setActiveModel(state, input.model);
  touchState(state);
}

function refreshActiveRuntime(input: {
  sessionID: string;
  agent?: string;
  model?: { providerID: string; id: string };
}) {
  const state = ensureSessionState(input.sessionID);

  if (input.agent?.trim()) {
    applyRuntimeAgent(state, input.agent.trim());
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
    },
  };
};
