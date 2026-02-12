"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import type { ChatMessage } from "@/hooks/use-chat";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-zinc-500">
        <div className="text-center">
          <p className="text-lg font-medium">Agentic Hub</p>
          <p className="mt-1 text-sm">
            Send a message to start a conversation
          </p>
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
      <div ref={bottomRef} />
    </div>
  );
}
