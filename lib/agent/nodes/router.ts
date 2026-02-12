import type { AgentStateType } from "../state";
import { AGENT_CONFIG } from "@/config/agent";

export async function routerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content =
    typeof lastMessage?.content === "string"
      ? lastMessage.content.toLowerCase()
      : "";

  let selectedModel = AGENT_CONFIG.defaultModel;

  if (
    content.includes("private") ||
    content.includes("local") ||
    content.includes("offline")
  ) {
    selectedModel = "ollama";
  } else if (
    content.includes("translate") ||
    content.includes("summarize") ||
    content.includes("bulk")
  ) {
    selectedModel = "deepseek";
  } else if (
    content.includes("code") ||
    content.includes("analyze") ||
    content.includes("reason")
  ) {
    selectedModel = "claude";
  }

  return { currentModel: selectedModel };
}
