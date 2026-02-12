"use client";

import { use } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";

export default function ChatThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);

  return <ChatInterface threadId={threadId} />;
}
