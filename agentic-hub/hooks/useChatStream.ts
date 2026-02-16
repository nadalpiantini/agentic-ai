import { useState, useCallback, useRef } from "react";
import { Message } from "@/types";

interface UseChatStreamOptions {
  threadId?: string;
  selectedModel?: "claude" | "deepseek" | "ollama";
  onStreamComplete?: (threadId: string) => void;
  onToolCall?: (tool: string, input: any) => void;
}

export function useChatStream({
  threadId,
  selectedModel,
  onStreamComplete,
  onToolCall,
}: UseChatStreamOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      setIsLoading(true);
      setError(null);

      // Add user message
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Create assistant placeholder
      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/agent/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threadId,
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            selectedModel,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No reader available");
        }

        let fullContent = "";
        let finalThreadId = threadId;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                // Handle different event types
                switch (data.type) {
                  case "token":
                    // Stream token for real-time display
                    fullContent += data.content;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: fullContent }
                          : msg
                      )
                    );
                    break;

                  case "tool_start":
                    // Notify that a tool is being executed
                    console.log("[useChatStream] Tool started:", data.tool, data.input);
                    if (onToolCall) {
                      onToolCall(data.tool, data.input);
                    }
                    // Append tool notification to message
                    fullContent += `\n[Using tool: ${data.tool}...]\n`;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: fullContent }
                          : msg
                      )
                    );
                    break;

                  case "tool_end":
                    // Tool execution complete
                    console.log("[useChatStream] Tool completed:", data.tool);
                    // Replace tool notification with result
                    fullContent = fullContent.replace(
                      `\n[Using tool: ${data.tool}...]\n`,
                      `\n[Tool ${data.tool} completed]\n`
                    );
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: fullContent }
                          : msg
                      )
                    );
                    break;

                  case "message":
                    // Final message (non-streamed)
                    if (data.role === "assistant") {
                      fullContent = data.content;
                      setMessages((prev) =>
                        prev.map((msg) =>
                          msg.id === assistantMessage.id
                            ? { ...msg, content: fullContent }
                            : msg
                        )
                      );
                    }
                    break;

                  case "error":
                    // Error occurred
                    console.error("[useChatStream] Error:", data.error);
                    setError(data.error);
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? {
                              ...msg,
                              content: `Error: ${data.error}. Please try again.`,
                            }
                          : msg
                      )
                    );
                    break;

                  case "done":
                    // Stream complete
                    console.log("[useChatStream] Stream complete", {
                      llmCalls: data.llmCalls,
                      selectedModel: data.selectedModel,
                    });
                    break;
                }
              } catch (parseError) {
                console.error("[useChatStream] Error parsing SSE data:", parseError);
              }
            }
          }
        }

        if (finalThreadId && onStreamComplete) {
          onStreamComplete(finalThreadId);
        }

        return finalThreadId;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id
              ? {
                  ...msg,
                  content: `Error: ${errorMessage}. Please try again.`,
                }
              : msg
          )
        );

        throw err;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [threadId, selectedModel, messages, onStreamComplete, onToolCall]
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    stopStream,
    clearMessages,
  };
}
