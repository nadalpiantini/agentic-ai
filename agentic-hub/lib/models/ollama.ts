import { ChatOllama } from "@langchain/ollama";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Ollama adapter - Privacy-focused local model
 *
 * Use for:
 * - Privacy-sensitive data (never leaves your machine)
 * - Offline operations (no API calls)
 * - Custom/finetuned models
 * - Zero API cost (runs locally)
 *
 * Strengths: Complete privacy, no API costs, offline capable
 * Weaknesses: Requires local resources, quality depends on model
 */
export function createOllamaModel(model?: string): BaseChatModel {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const modelName = model || process.env.OLLAMA_MODEL || "llama3.2";

  return new ChatOllama({
    baseUrl,
    model: modelName,
    temperature: 0.7,
    // Ollama doesn't require API key (local)
    // Enable streaming for real-time responses
    streaming: true,
  });
}

/**
 * Singleton instance per model
 * Reuse across invocations to avoid re-initialization
 */
const ollamaInstances = new Map<string, BaseChatModel>();

export function getOllamaModel(model?: string): BaseChatModel {
  const modelName = model || process.env.OLLAMA_MODEL || "llama3.2";

  if (!ollamaInstances.has(modelName)) {
    ollamaInstances.set(modelName, createOllamaModel(modelName));
  }

  return ollamaInstances.get(modelName)!;
}
