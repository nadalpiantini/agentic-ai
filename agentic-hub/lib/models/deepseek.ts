import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * DeepSeek adapter - Cost-focused model
 *
 * Use for:
 * - Simple queries and fact-based questions
 * - High-volume interactions
 * - Prototyping and testing
 * - Budget-sensitive applications
 *
 * Strengths: Very cost-effective, fast, good quality for price
 * Weaknesses: Less capable on complex reasoning, weaker tool use
 *
 * Note: DeepSeek uses OpenAI-compatible API, so we use ChatOpenAI with custom base URL
 */
export function createDeepSeekModel(): BaseChatModel {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    throw new Error(
      "DEEPSEEK_API_KEY is required for DeepSeek model. " +
        "Set it in .env.local or skip DeepSeek in router config."
    );
  }

  return new ChatOpenAI({
    apiKey,
    modelName: "deepseek-chat",
    temperature: 0.7,
    maxTokens: 4096,
    // Enable streaming for real-time responses
    streaming: true,
    // DeepSeek API configuration
    configuration: {
      baseURL: "https://api.deepseek.com",
    },
  });
}

/**
 * Singleton instance
 * Reuse across invocations to avoid re-initialization
 */
let deepseekInstance: BaseChatModel | null = null;

export function getDeepSeekModel(): BaseChatModel {
  if (!deepseekInstance) {
    deepseekInstance = createDeepSeekModel();
  }
  return deepseekInstance;
}
