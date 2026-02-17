"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ThreadSidebar } from "@/components/sidebar/ThreadSidebar";

export default function ChatPage() {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleThreadSelect = (threadId: string) => {
    setCurrentThreadId(threadId);
  };

  const handleNewThread = () => {
    setCurrentThreadId(null);
  };

  const handleThreadCreated = useCallback((threadId: string) => {
    setCurrentThreadId(threadId);
    setSidebarKey(prev => prev + 1);
  }, []);

  return (
    <div className="flex h-screen bg-surface-0">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <ThreadSidebar
          key={sidebarKey}
          currentThreadId={currentThreadId}
          onThreadSelect={handleThreadSelect}
          onNewThread={handleNewThread}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-surface-1/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link href="/" className="text-text-muted hover:text-text-primary transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Link>
            <span className="text-sm font-medium text-text-secondary">
              {currentThreadId ? 'Chat' : 'New Chat'}
            </span>
          </div>
        </div>

        {/* Chat */}
        <ChatInterface
          threadId={currentThreadId}
          onNewThread={handleNewThread}
          onThreadCreated={handleThreadCreated}
        />
      </div>
    </div>
  );
}
