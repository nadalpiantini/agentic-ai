import type { ModelConfig, ModelProvider } from "@/types/models";

export const MODEL_CONFIGS: Record<ModelProvider, ModelConfig> = {
  claude: {
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 4096,
  },
  deepseek: {
    model: "deepseek-chat",
    temperature: 0.7,
    maxTokens: 4096,
  },
  ollama: {
    model: "llama3.2",
    temperature: 0.7,
    maxTokens: 4096,
  },
  zai: {
    model: "glm-5",
    temperature: 0.7,
    maxTokens: 4096,
  },
} as const;
