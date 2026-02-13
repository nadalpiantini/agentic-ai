import { ChatOpenAI } from "@langchain/openai";
import { env } from "@/lib/utils/env";

export function createZaiModel(options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  return new ChatOpenAI({
    model: options?.model ?? "glm-5",
    apiKey: env.ZAI_API_KEY,
    temperature: options?.temperature ?? 0.7,
    maxTokens: options?.maxTokens ?? 4096,
    configuration: {
      baseURL: "https://api.z.ai/api/paas/v4",
    },
  });
}
