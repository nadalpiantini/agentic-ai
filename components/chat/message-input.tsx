"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface MessageInputProps {
  onSend: (message: string) => void;
  onAbort: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onAbort,
  isStreaming,
  disabled,
}: MessageInputProps) {
  const [input, setInput] = useState("");

  const handleSend = useCallback(() => {
    if (!input.trim() || isStreaming) return;
    onSend(input.trim());
    setInput("");
  }, [input, isStreaming, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3",
            "text-sm text-zinc-100 placeholder:text-zinc-500",
            "focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "max-h-32"
          )}
          style={{ minHeight: "44px" }}
        />
        {isStreaming ? (
          <button
            onClick={onAbort}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
            title="Stop generation"
          >
            <Square className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!input.trim() || disabled}
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
              input.trim() && !disabled
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
