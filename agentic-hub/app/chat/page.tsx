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
      <div
        className={`shrink-0 transition-all duration-300 overflow-hidden border-r border-white/5 ${
          sidebarOpen ? 'w-72' : 'w-0 border-r-0'
        }`}
      >
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
        <div className="h-16 shrink-0 flex items-center px-6 border-b border-white/5 bg-surface-1/50 backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="15" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link href="/" className="p-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </Link>
            <span className="text-base font-medium text-text-secondary">
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
