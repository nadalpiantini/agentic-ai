import type { AgentStateType } from "../state";
import { createModel } from "@/lib/models";
import type { ModelProvider } from "@/types/models";
import { AGENT_CONFIG } from "@/config/agent";
import {
  detectLanguage,
  getSystemPrompt,
  getSystemPromptConfig,
} from "../prompts";
import { SystemMessage } from "@langchain/core/messages";

export async function plannerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  if (state.llmCalls >= AGENT_CONFIG.maxLlmCalls) {
    return { shouldEnd: true };
  }

  // Detect language from last user message
  const lastMessage = state.messages[state.messages.length - 1];
  const lastUserMessage =
    state.messages
      .filter((m) => m.getType() === "human")
      .pop()
      ?.content.toString() || "";

  const config = getSystemPromptConfig(lastUserMessage);
  const systemPrompt = getSystemPrompt(config.language);

  // Create model
  const model = createModel(state.currentModel as ModelProvider);

  // Prepend system message to the conversation
  const messagesWithSystem = [
    new SystemMessage(systemPrompt),
    ...state.messages,
  ];

  const response = await model.invoke(messagesWithSystem);

  return {
    messages: [response],
    llmCalls: state.llmCalls + 1,
    detectedLanguage: config.language,
  };
}
