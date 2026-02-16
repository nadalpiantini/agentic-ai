import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

/**
 * Agent state for LangGraph workflow
 * Manages message history, LLM call tracking, model selection, and context
 */
export const AgentState = Annotation.Root({
  /**
   * Array of messages in the conversation
   * Includes user messages, AI responses, and tool call results
   * Uses messagesStateReducer for append-only behavior
   */
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  /**
   * Counter for LLM API calls (loop guard to prevent infinite loops)
   * Incremented each time the planner node invokes an LLM
   */
  llmCalls: Annotation<number>({
    reducer: (left: number, right: number) => left + right,
    default: () => 0,
  }),

  /**
   * Currently selected model for LLM calls
   * Options: "claude" | "deepseek" | "ollama"
   * Uses LastValue reducer (default) - replaces on update
   */
  selectedModel: Annotation<"claude" | "deepseek" | "ollama">(),

  /**
   * Stack tracking context through recursive tool calls
   * Each entry represents a level of tool execution depth
   * Push: append to array, Pop: remove last element
   */
  contextStack: Annotation<string[]>({
    reducer: (left: string[], right: string[]) => {
      // Empty right array signals pop operation
      if (right.length === 0 && left.length > 0) {
        return left.slice(0, -1);
      }
      // Non-empty right means push operation
      return [...left, ...right];
    },
    default: () => [],
  }),
});
