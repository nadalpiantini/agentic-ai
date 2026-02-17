import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { getClaudeModel } from "./claude";
import { getDeepSeekModel } from "./deepseek";
import { getOllamaModel } from "./ollama";

/**
 * Model adapter registry
 *
 * Returns the appropriate model adapter based on selection:
 * - claude: High quality, best for complex tasks
 * - deepseek: Cost-effective, good for simple tasks
 * - ollama: Privacy-focused, runs locally
 */

export type ModelType = "claude" | "deepseek" | "ollama";

/**
 * Get model adapter by type, with automatic fallback if API key is missing
 */
export function getModelAdapter(modelType: ModelType = "claude"): BaseChatModel {
  console.log(`[ModelAdapter] Initializing model: ${modelType}`);

  try {
    switch (modelType) {
      case "claude":
        return getClaudeModel();
      case "deepseek":
        return getDeepSeekModel();
      case "ollama":
        return getOllamaModel();
      default:
        return getClaudeModel();
    }
  } catch (error) {
    console.warn(`[ModelAdapter] Failed to init ${modelType}: ${(error as Error).message}`);

    // Try fallback models in priority order
    const fallbacks: ModelType[] = ["claude", "deepseek", "ollama"].filter(
      (m) => m !== modelType
    ) as ModelType[];

    for (const fallback of fallbacks) {
      try {
        console.log(`[ModelAdapter] Trying fallback: ${fallback}`);
        switch (fallback) {
          case "claude": return getClaudeModel();
          case "deepseek": return getDeepSeekModel();
          case "ollama": return getOllamaModel();
        }
      } catch {
        continue;
      }
    }

    throw new Error("No LLM model available. Set ANTHROPIC_API_KEY or DEEPSEEK_API_KEY.");
  }
}

/**
 * Get all available models
 */
export function getAllModels(): ModelType[] {
  return ["claude", "deepseek", "ollama"];
}

/**
 * Check if a model is available (has required API keys/config)
 */
export function isModelAvailable(modelType: ModelType): boolean {
  switch (modelType) {
    case "claude":
      return !!process.env.ANTHROPIC_API_KEY;

    case "deepseek":
      return !!process.env.DEEPSEEK_API_KEY;

    case "ollama":
      // Ollama is always available if the server is running
      return true;

    default:
      return false;
  }
}

/**
 * Get the best available model for the current environment
 */
export function getBestAvailableModel(): ModelType {
  // Priority: Claude > DeepSeek > Ollama
  if (isModelAvailable("claude")) {
    return "claude";
  }

  if (isModelAvailable("deepseek")) {
    return "deepseek";
  }

  if (isModelAvailable("ollama")) {
    return "ollama";
  }

  // Default to claude (will throw error if API key is missing)
  return "claude";
}
