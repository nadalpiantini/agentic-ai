"use client";

import { useState, useCallback } from "react";
import { useAgentStream } from "./use-agent-stream";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createdAt: Date;
}

export function useChat(threadId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const stream = useAgentStream({
    onMessage: (msg) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "assistant" && last.id === "streaming") {
          return [
            ...prev.slice(0, -1),
            { ...last, content: last.content + msg.content },
          ];
        }
        return [
          ...prev,
          {
            id: "streaming",
            role: "assistant",
            content: msg.content,
            createdAt: new Date(),
          },
        ];
      });
    },
    onComplete: () => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === "streaming"
            ? { ...m, id: crypto.randomUUID() }
            : m
        )
      );
    },
    onError: (error) => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          content: `Error: ${error}`,
          createdAt: new Date(),
        },
      ]);
    },
  });

  const sendMessage = useCallback(
    async (content: string, model?: string) => {
      if (!threadId || !content.trim()) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      await stream.sendMessage(content.trim(), threadId, model);
    },
    [threadId, stream]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isStreaming: stream.isStreaming,
    abort: stream.abort,
    streamedContent: stream.streamedContent,
    feedEvents: stream.feedEvents,
  };
}
