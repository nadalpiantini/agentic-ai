export interface Message {
  id: string;
  thread_id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  tool_calls?: Array<{ name: string; args: Record<string, unknown>; id?: string }>;
  model_used?: string;
  tokens_used?: number;
  created_at?: string;
  timestamp?: string; // For frontend compatibility
}

export interface Thread {
  id: string;
  user_id: string;
  title: string;
  metadata?: Record<string, unknown>;
  preferred_model: string;
  created_at: string;
  updated_at: string;
}

export interface CreateThreadRequest {
  title?: string;
  preferred_model?: string;
}

export interface CreateMessageRequest {
  threadId?: string | null;
  message: string;
  modelPreference?: "claude" | "deepseek" | "ollama" | "auto";
}
