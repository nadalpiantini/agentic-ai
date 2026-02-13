"use client";

import { useCallback } from "react";
import { useChat } from "@/hooks/use-chat";
import { useModelStore } from "@/hooks/use-model-store";
import { useViewMode } from "@/hooks/use-view-mode";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { AgenticFeed } from "./agentic-feed";
import { ViewModeToggle } from "./view-mode-toggle";

interface ChatInterfaceProps {
  threadId: string;
}

export function ChatInterface({ threadId }: ChatInterfaceProps) {
  const { messages, sendMessage, isStreaming, abort, feedEvents } =
    useChat(threadId);
  const model = useModelStore((s) => s.model);
  const viewMode = useViewMode((s) => s.mode);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content, model);
    },
    [sendMessage, model]
  );

  return (
    <div className="flex h-full bg-zinc-950">
      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar with mode toggle */}
        <div className="flex items-center justify-end border-b border-zinc-800/50 px-4 py-2">
          <ViewModeToggle />
        </div>

        <MessageList
          messages={messages}
          isStreaming={isStreaming}
          onSuggestionClick={handleSend}
        />
        <MessageInput
          onSend={handleSend}
          onAbort={abort}
          isStreaming={isStreaming}
        />
      </div>

      {/* Agentic Feed panel (expert mode only) */}
      {viewMode === "expert" && (
        <AgenticFeed events={feedEvents} isStreaming={isStreaming} />
      )}
    </div>
  );
}
