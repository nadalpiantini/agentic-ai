"use client";

import { useState, useCallback, useRef } from "react";
import type { FeedEvent } from "@/types/feed";

interface StreamMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
}

interface UseAgentStreamOptions {
  onMessage?: (message: StreamMessage) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
  onFeedEvent?: (event: FeedEvent) => void;
}

function extractContent(msg: Record<string, unknown>): string {
  // Handle LangChain serialized format (lc/kwargs) and plain format
  const kwargs = msg.kwargs as Record<string, unknown> | undefined;
  return (
    (kwargs?.content as string) ??
    (typeof msg.content === "string" ? msg.content : "") ??
    ""
  );
}

function extractToolCalls(
  msg: Record<string, unknown>
): { id: string; name: string; args: Record<string, unknown> }[] {
  const kwargs = msg.kwargs as Record<string, unknown> | undefined;
  const calls =
    (kwargs?.tool_calls as unknown[]) ??
    (msg.tool_calls as unknown[]) ??
    [];
  return calls.map((tc) => {
    const call = tc as Record<string, unknown>;
    return {
      id: (call.id as string) ?? "",
      name: (call.name as string) ?? "unknown",
      args: (call.args as Record<string, unknown>) ?? {},
    };
  });
}

export function useAgentStream(options?: UseAgentStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const emitFeed = useCallback(
    (event: FeedEvent) => {
      setFeedEvents((prev) => [...prev, event]);
      options?.onFeedEvent?.(event);
    },
    [options]
  );

  const sendMessage = useCallback(
    async (message: string, threadId: string, model?: string) => {
      setIsStreaming(true);
      setStreamedContent("");
      setFeedEvents([]);

      abortControllerRef.current = new AbortController();

      let stepCount = 0;

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
              emitFeed({
                id: crypto.randomUUID(),
                type: "complete",
                timestamp: new Date(),
                data: { step: stepCount },
              });
              options?.onComplete?.();
              continue;
            }

            try {
              const event = JSON.parse(data);

              if (event.error) {
                options?.onError?.(event.error);
                continue;
              }

              // ── Router: model selection ──
              if (event.router) {
                const selectedModel =
                  event.router.currentModel ?? model ?? "unknown";
                emitFeed({
                  id: crypto.randomUUID(),
                  type: "model_selected",
                  timestamp: new Date(),
                  data: { model: selectedModel },
                });
              }

              // ── Planner: reasoning + tool calls ──
              if (event.planner?.messages) {
                stepCount++;
                emitFeed({
                  id: crypto.randomUUID(),
                  type: "step",
                  timestamp: new Date(),
                  data: { step: stepCount },
                });

                for (const msg of event.planner.messages as Record<
                  string,
                  unknown
                >[]) {
                  // Extract text content
                  const content = extractContent(msg);
                  if (content) {
                    accumulated += content;
                    setStreamedContent(accumulated);
                    options?.onMessage?.({ role: "assistant", content });
                  }

                  // Extract tool calls
                  const toolCalls = extractToolCalls(msg);
                  for (const tc of toolCalls) {
                    emitFeed({
                      id: crypto.randomUUID(),
                      type: "tool_call",
                      timestamp: new Date(),
                      data: {
                        toolName: tc.name,
                        toolArgs: tc.args,
                        step: stepCount,
                      },
                    });
                  }
                }
              }

              // ── Executor: tool results ──
              if (event.executor?.messages) {
                for (const msg of event.executor.messages as Record<
                  string,
                  unknown
                >[]) {
                  const kwargs = msg.kwargs as
                    | Record<string, unknown>
                    | undefined;
                  const toolName =
                    (kwargs?.name as string) ?? (msg.name as string) ?? "";
                  const toolResult =
                    (kwargs?.content as string) ??
                    (typeof msg.content === "string" ? msg.content : "");
                  const isError =
                    toolResult.startsWith("Error") ||
                    toolResult.startsWith("Error executing tool");

                  emitFeed({
                    id: crypto.randomUUID(),
                    type: "tool_result",
                    timestamp: new Date(),
                    data: {
                      toolName,
                      toolResult:
                        toolResult.length > 200
                          ? toolResult.slice(0, 200) + "..."
                          : toolResult,
                      toolError: isError,
                      step: stepCount,
                    },
                  });
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
    [options, emitFeed]
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
    feedEvents,
  };
}
