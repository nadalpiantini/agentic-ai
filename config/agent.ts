import type { ModelProvider } from "@/types/models";
import { env } from "@/lib/utils/env";

export const AGENT_CONFIG = {
  maxLlmCalls: env.MAX_LLM_CALLS,
  maxRecursionDepth: env.MAX_RECURSION_DEPTH,
  streamingEnabled: true,
  defaultModel: env.DEFAULT_MODEL as ModelProvider,
} as const;
