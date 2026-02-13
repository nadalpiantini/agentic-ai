export type FeedEventType =
  | "model_selected"
  | "thinking"
  | "tool_call"
  | "tool_result"
  | "step"
  | "complete";

export interface FeedEvent {
  id: string;
  type: FeedEventType;
  timestamp: Date;
  data: {
    model?: string;
    step?: number;
    toolName?: string;
    toolArgs?: Record<string, unknown>;
    toolResult?: string;
    toolError?: boolean;
    content?: string;
  };
}
