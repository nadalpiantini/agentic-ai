import type { BaseMessage } from "@langchain/core/messages";

export interface AgentState {
  messages: BaseMessage[];
  llmCalls: number;
  currentModel: string;
  metadata: Record<string, unknown>;
}

export interface StreamEvent {
  event: "token" | "tool_call" | "tool_result" | "error" | "done";
  data: string;
  timestamp: number;
}

export interface AgentRunInput {
  threadId: string;
  message: string;
  model?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentRunOutput {
  threadId: string;
  messages: BaseMessage[];
  llmCalls: number;
  model: string;
}
