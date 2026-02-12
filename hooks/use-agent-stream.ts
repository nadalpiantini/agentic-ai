"use client";

import { useState, useCallback, useRef } from "react";

interface StreamMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
}

interface UseAgentStreamOptions {
  onMessage?: (message: StreamMessage) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

export function useAgentStream(options?: UseAgentStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string, threadId: string, model?: string) => {
      setIsStreaming(true);
      setStreamedContent("");

      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/agent/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, threadId, model }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();

            if (data === "[DONE]") {
              options?.onComplete?.();
              continue;
            }

            try {
              const event = JSON.parse(data);

              if (event.error) {
                options?.onError?.(event.error);
                continue;
              }

              // Extract assistant message from planner node updates
              if (event.planner?.messages) {
                for (const msg of event.planner.messages) {
                  const content = typeof msg.content === "string"
                    ? msg.content
                    : JSON.stringify(msg.content);
                  accumulated += content;
                  setStreamedContent(accumulated);
                  options?.onMessage?.({ role: "assistant", content });
                }
              }
            } catch {
              // Skip non-JSON lines
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        const msg = error instanceof Error ? error.message : "Stream failed";
        options?.onError?.(msg);
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [options]
  );

  const abort = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    sendMessage,
    abort,
    isStreaming,
    streamedContent,
  };
}
