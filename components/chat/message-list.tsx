"use client";

import { useEffect, useRef } from "react";
import { Bot, Sparkles } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { StreamingIndicator } from "./streaming-indicator";
import type { ChatMessage } from "@/hooks/use-chat";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSuggestionClick?: (suggestion: string) => void;
}

const SUGGESTIONS = [
  "Explain how LangGraph works",
  "Write a Python function to parse JSON",
  "Compare React Server Components vs Client",
  "Help me design a database schema",
];

export function MessageList({
  messages,
  isStreaming,
  onSuggestionClick,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10">
            <Bot className="h-7 w-7 text-blue-400" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-zinc-100">
            Agentic Hub
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Multi-model AI assistant with tool execution and persistent memory.
          </p>

          {onSuggestionClick && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestionClick(s)}
                  className="group/chip flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-blue-600/50 hover:text-blue-400 transition-colors"
                >
                  <Sparkles className="h-3 w-3 opacity-0 group-hover/chip:opacity-100 transition-opacity" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto py-4">
      {messages.map((message, index) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          isStreaming={
            isStreaming &&
            message.id === "streaming" &&
            index === messages.length - 1
          }
        />
      ))}
      {isStreaming && messages[messages.length - 1]?.id !== "streaming" && (
        <StreamingIndicator />
      )}
      <div ref={bottomRef} />
    </div>
  );
}
