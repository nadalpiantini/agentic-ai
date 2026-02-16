/**
 * Model configuration
 *
 * Central configuration for model selection and routing
 */

export type ModelType = "claude" | "deepseek" | "ollama";

/**
 * Default model selection strategy
 */
export interface ModelSelectionConfig {
  defaultModel: ModelType;
  enableAutoSelection: boolean;
  privacyKeywords: string[];
}

/**
 * Default configuration
 */
export const defaultConfig: ModelSelectionConfig = {
  defaultModel: "claude",
  enableAutoSelection: true,
  privacyKeywords: [
    "private",
    "confidential",
    "sensitive",
    "secret",
    "personal data",
    "password",
    "api key",
  ],
};

/**
 * Select model based on configuration
 */
export function selectModel(config: Partial<ModelSelectionConfig> = {}): ModelType {
  const merged = { ...defaultConfig, ...config };
  return merged.defaultModel;
}
