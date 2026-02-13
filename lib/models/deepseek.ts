import { ChatOpenAI } from "@langchain/openai";
import { env } from "@/lib/utils/env";

export function createDeepSeekModel(options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  return new ChatOpenAI({
    model: options?.model ?? "deepseek-chat",
    apiKey: env.DEEPSEEK_API_KEY,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 4096,
    configuration: {
      baseURL: "https://api.deepseek.com",
    },
  });
}
