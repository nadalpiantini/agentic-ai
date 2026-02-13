import { createClaudeModel } from "@/lib/models/claude";
import { createDeepSeekModel } from "@/lib/models/deepseek";
import { createOllamaModel } from "@/lib/models/ollama";
import { createZaiModel } from "@/lib/models/zai";
import { env } from "@/lib/utils/env";
import type { ModelProvider, ModelConfig, TaskRequirements } from "@/types/models";

const modelFactories: Record<
  ModelProvider,
  (config?: ModelConfig) => ReturnType<typeof createClaudeModel> | ReturnType<typeof createDeepSeekModel> | ReturnType<typeof createOllamaModel> | ReturnType<typeof createZaiModel>
> = {
  claude: createClaudeModel,
  deepseek: createDeepSeekModel,
  ollama: createOllamaModel,
  zai: createZaiModel,
};

export function createModel(provider: ModelProvider, config?: ModelConfig) {
  const factory = modelFactories[provider];
  return factory(config);
}

export function getDefaultModel(config?: ModelConfig) {
  return createModel(env.DEFAULT_MODEL, config);
}

export function routeModel(task: TaskRequirements): ModelProvider {
  if (task.quality) return "claude";
  if (task.privacy) return "ollama";
  if (task.costSensitive) return "deepseek";
  if (task.speed) return "deepseek";
  return env.DEFAULT_MODEL;
}

export { createClaudeModel } from "@/lib/models/claude";
export { createDeepSeekModel } from "@/lib/models/deepseek";
export { createOllamaModel } from "@/lib/models/ollama";
export { createZaiModel } from "@/lib/models/zai";
export type { ModelProvider, ModelConfig, TaskRequirements } from "@/types/models";
