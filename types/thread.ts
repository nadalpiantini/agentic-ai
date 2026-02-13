export interface Thread {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface Message {
  id: string;
  threadId: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreateThreadInput {
  title: string;
}

export interface UpdateThreadInput {
  title?: string;
}
