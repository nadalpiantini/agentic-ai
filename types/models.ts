export type ModelProvider = "claude" | "deepseek" | "ollama";

export interface ModelConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface TaskRequirements {
  quality?: boolean;
  speed?: boolean;
  privacy?: boolean;
  costSensitive?: boolean;
}
