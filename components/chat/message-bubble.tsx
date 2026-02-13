"use client";

import { cn } from "@/lib/utils/cn";
import { Bot, User } from "lucide-react";
import { MarkdownRenderer } from "./markdown-renderer";
import { CopyButton } from "@/components/ui/copy-button";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  isStreaming?: boolean;
}

export function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  const isUser = role === "user";
  const isSystem = role === "system";

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-3 animate-message-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-blue-600" : "bg-zinc-700"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-white" />
        )}
      </div>

      <div
        className={cn(
          "relative max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-blue-600 text-white"
            : isSystem
              ? "bg-red-900/30 text-red-300 border border-red-800/50"
              : "bg-zinc-800 text-zinc-100"
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        ) : isSystem ? (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        ) : (
          <MarkdownRenderer content={content} />
        )}
        {isStreaming && (
          <span className="inline-block ml-1 animate-pulse text-blue-400">
            |
          </span>
        )}

        {/* Copy button on hover for assistant messages */}
        {!isUser && !isSystem && !isStreaming && content && (
          <div className="absolute -bottom-7 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyButton text={content} />
          </div>
        )}
      </div>
    </div>
  );
}
