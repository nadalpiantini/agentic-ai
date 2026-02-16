import { AgentState } from "../state";
import { selectModel, ModelType } from "@/config/models";
import { getClaudeModel } from "@/lib/models/claude";
import { getDeepSeekModel } from "@/lib/models/deepseek";
import { getOllamaModel } from "@/lib/models/ollama";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Message complexity analysis
 * Estimates complexity based on length and structure
 */
function analyzeMessageComplexity(content: string): {
  length: "short" | "medium" | "long";
  hasCode: boolean;
  hasMultipleQuestions: boolean;
} {
  const length =
    content.length < 200 ? "short" : content.length < 800 ? "medium" : "long";
  const hasCode = /```|`[^`]+`|function|const|let|var|class/.test(content);
  const hasMultipleQuestions = (content.match(/\?/g) || []).length > 1;

  return { length, hasCode, hasMultipleQuestions };
}

/**
 * Model selection based on message analysis
 *
 * Strategy:
 * - Privacy-sensitive → Ollama (local)
 * - Code tasks → Claude (best quality)
 * - Simple queries → DeepSeek (cost-effective)
 * - Complex reasoning → Claude (premium)
 */
function selectModelForMessage(content: string): ModelType {
  const analysis = analyzeMessageComplexity(content);

  // Check for privacy keywords
  const privacyKeywords = [
    "private",
    "confidential",
    "sensitive",
    "secret",
    "personal data",
    "password",
    "api key",
  ];
  const hasPrivacyKeyword = privacyKeywords.some((keyword) =>
    content.toLowerCase().includes(keyword)
  );

  // Privacy override
  if (hasPrivacyKeyword) {
    console.log("[Router] Privacy-sensitive content detected → Ollama");
    return "ollama";
  }

  // Code tasks → Claude (best tool use)
  if (analysis.hasCode) {
    console.log("[Router] Code content detected → Claude");
    return "claude";
  }

  // Complex/long messages → Claude
  if (analysis.length === "long" || analysis.hasMultipleQuestions) {
    console.log("[Router] Complex query detected → Claude");
    return "claude";
  }

  // Simple queries → DeepSeek (cost-effective)
  console.log("[Router] Simple query → DeepSeek");
  return "deepseek";
}

/**
 * Get model instance by type
 */
export function getModelByType(type: ModelType): BaseChatModel {
  switch (type) {
    case "claude":
      return getClaudeModel();
    case "deepseek":
      return getDeepSeekModel();
    case "ollama":
      return getOllamaModel();
    default:
      // Fallback to default
      const defaultType = selectModel({});
      console.log(`[Router] Unknown model type "${type}", falling back to ${defaultType}`);
      return getModelByType(defaultType);
  }
}

/**
 * Router Node - Entry point for agent workflow
 *
 * Analyzes the incoming message and state to:
 * - Select appropriate model (cost vs quality vs privacy)
 * - Initialize context for tool execution
 * - Route to planner node
 *
 * Model Selection Logic:
 * 1. Privacy-sensitive data → Ollama (local, no data leaves machine)
 * 2. Code tasks → Claude (best quality tool use)
 * 3. Complex reasoning → Claude (premium capabilities)
 * 4. Simple queries → DeepSeek (cost-effective)
 *
 * @param state - Current agent state
 * @returns Next node name ("planner") and optional state updates
 */
export async function routerNode(
  state: typeof AgentState.State
): Promise<Partial<typeof AgentState.State> & { next: string }> {
  const { messages, selectedModel } = state;

  // Extract latest message
  const latestMessage = messages[messages.length - 1];
  const content = latestMessage?.content as string;
  console.log("[Router] Received message:", content?.substring(0, 100) + "...");

  // Determine model selection
  let model: ModelType;

  if (selectedModel) {
    // User explicitly selected model
    model = selectedModel;
    console.log("[Router] Using user-selected model:", model);
  } else {
    // Auto-select based on message analysis
    model = selectModelForMessage(content || "");
    console.log("[Router] Auto-selected model:", model);
  }

  // Route to planner node with selected model
  return {
    selectedModel: model,
    next: "planner",
  };
}
