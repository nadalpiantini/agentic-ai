/**
 * Default maximum number of LLM calls allowed per agent execution.
 *
 * This prevents infinite loops in the agent graph by limiting how many times
 * the planner node can invoke the LLM. Once this limit is reached, the graph
 * transitions to END state.
 *
 * Can be overridden via the MAX_LLM_CALLS environment variable.
 *
 * @default 25
 */
export const MAX_LLM_CALLS = Number(process.env.MAX_LLM_CALLS) || 25;

/**
 * Default maximum recursion depth for the agent graph.
 *
 * This limits how deeply the agent graph can recurse into itself, preventing
 * stack overflow and excessive memory usage during complex agent workflows.
 *
 * Can be overridden via the MAX_RECURSION_DEPTH environment variable.
 *
 * @default 10
 */
export const MAX_RECURSION_DEPTH = Number(process.env.MAX_RECURSION_DEPTH) || 10;

/**
 * Default model to use for agent inference.
 *
 * Specifies which LLM provider to use when no model is explicitly selected.
 * Supported values: "claude" | "deepseek" | "ollama"
 *
 * Can be overridden via the DEFAULT_MODEL environment variable.
 *
 * @default "claude"
 */
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL || "claude";

/**
 * Maximum number of messages to retrieve per thread.
 *
 * Limits the context window size when loading conversation history from the
 * database. Older messages beyond this count are excluded to prevent token
 * limit issues.
 *
 * Can be overridden via the MAX_THREAD_MESSAGES environment variable.
 *
 * @default 100
 */
export const MAX_THREAD_MESSAGES = Number(process.env.MAX_THREAD_MESSAGES) || 100;
