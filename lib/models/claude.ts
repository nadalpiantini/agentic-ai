import { ChatAnthropic } from "@langchain/anthropic";
import { env } from "@/lib/utils/env";

export function createClaudeModel(options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  return new ChatAnthropic({
    model: options?.model ?? "claude-sonnet-4-20250514",
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 4096,
  });
}
