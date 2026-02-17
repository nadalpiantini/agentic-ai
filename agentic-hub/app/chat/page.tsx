"use client";

import { useState, useCallback } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ThreadSidebar } from "@/components/sidebar/ThreadSidebar";

export default function ChatPage() {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [sidebarKey, setSidebarKey] = useState(0);

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId);
  };

  const handleNewThread = () => {
    setCurrentThreadId(null);
  };

  const handleThreadCreated = useCallback((threadId: string) => {
    setCurrentThreadId(threadId);
    // Force sidebar to reload threads
    setSidebarKey(prev => prev + 1);
  }, []);

  return (
    <div className="flex h-screen">
      <ThreadSidebar
        key={sidebarKey}
        currentThreadId={currentThreadId}
        onThreadSelect={handleThreadSelect}
        onNewThread={handleNewThread}
      />
      <main className="flex-1">
        <ChatInterface
          threadId={currentThreadId}
          onNewThread={handleNewThread}
          onThreadCreated={handleThreadCreated}
        />
      </main>
    </div>
  );
}
