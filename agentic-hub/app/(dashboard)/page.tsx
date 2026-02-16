"use client";

import { useState } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ThreadSidebar } from "@/components/sidebar/ThreadSidebar";

export default function DashboardPage() {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId);
  };

  const handleNewThread = () => {
    setCurrentThreadId(null);
  };

  return (
    <div className="flex h-screen">
      <ThreadSidebar
        currentThreadId={currentThreadId}
        onThreadSelect={handleThreadSelect}
        onNewThread={handleNewThread}
      />
      <main className="flex-1">
        <ChatInterface threadId={currentThreadId} onNewThread={handleNewThread} />
      </main>
    </div>
  );
}
