"use client";

import { useChat } from "@/hooks/use-chat";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";

interface ChatInterfaceProps {
  threadId: string;
}

export function ChatInterface({ threadId }: ChatInterfaceProps) {
  const { messages, sendMessage, isStreaming, abort } = useChat(threadId);

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <MessageList messages={messages} isStreaming={isStreaming} />
      <MessageInput
        onSend={sendMessage}
        onAbort={abort}
        isStreaming={isStreaming}
      />
    </div>
  );
}
