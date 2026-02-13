import type { AgentStateType } from "../state";
import { detectAgentType, getModelForAgent, getAgentConfig } from "../agents";

/**
 * Smart Router Node
 * Selects both agent type and model based on message content
 */
export async function routerNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const content =
    typeof lastMessage?.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage?.content) || "";

  // Detect agent type from content
  const agentType = detectAgentType(content);

  // Check for constraints in the message
  const constraints = {
    privacy:
      content.toLowerCase().includes("private") ||
      content.toLowerCase().includes("local") ||
      content.toLowerCase().includes("offline"),
    cost: content.toLowerCase().includes("cheap") ||
      content.toLowerCase().includes("fast"),
    quality: content.toLowerCase().includes("best") ||
      content.toLowerCase().includes("quality"),
  };

  // Get optimal model for this agent type with constraints
  const selectedModel = getModelForAgent(agentType, constraints);

  const agentConfig = getAgentConfig(agentType);

  return {
    currentModel: selectedModel,
    currentAgent: agentType,
  };
}
