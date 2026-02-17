import { ChatAnthropic } from "@langchain/anthropic";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Claude adapter - Quality-focused model
 *
 * Use for:
 * - Complex reasoning tasks
 * - Multi-step tool orchestration
 * - Code generation and analysis
 * - Creative writing
 *
 * Strengths: Best quality, strong tool use, reliable
 * Weaknesses: Higher cost, slower than smaller models
 */
export function createClaudeModel(): BaseChatModel {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is required for Claude model. " +
        "Set it in .env.local or Vercel Environment Variables."
    );
  }

  return new ChatAnthropic({
    apiKey,
    modelName: "claude-sonnet-4-5-20250929",
    temperature: 0.7,
    maxTokens: 8192,
    streaming: true,
  });
}

/**
 * Singleton instance
 * Reuse across invocations to avoid re-initialization
 */
let claudeInstance: BaseChatModel | null = null;

export function getClaudeModel(): BaseChatModel {
  if (!claudeInstance) {
    claudeInstance = createClaudeModel();
  }
  return claudeInstance;
}
