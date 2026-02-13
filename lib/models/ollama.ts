import { ChatOllama } from "@langchain/ollama";
import { env } from "@/lib/utils/env";

export function createOllamaModel(options?: {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  return new ChatOllama({
    model: options?.model ?? "llama3.2",
    baseUrl: env.OLLAMA_BASE_URL,
    temperature: options?.temperature ?? 0.7,
    numPredict: options?.maxTokens ?? 4096,
  });
}
