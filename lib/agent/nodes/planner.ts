import type { AgentStateType } from "../state";
import { createModel } from "@/lib/models";
import type { ModelProvider } from "@/types/models";
import { AGENT_CONFIG } from "@/config/agent";

export async function plannerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  if (state.llmCalls >= AGENT_CONFIG.maxLlmCalls) {
    return { shouldEnd: true };
  }

  const model = createModel(state.currentModel as ModelProvider);
  const response = await model.invoke(state.messages);

  return {
    messages: [response],
    llmCalls: 1,
  };
}
