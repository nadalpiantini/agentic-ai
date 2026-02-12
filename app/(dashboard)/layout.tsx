"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/sidebar";

// TODO: Replace with real auth context
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [activeThreadId, setActiveThreadId] = useState<string>();

  const handleThreadSelect = (threadId: string) => {
    setActiveThreadId(threadId);
    router.push(`/chat/${threadId}`);
  };

  const handleNewThread = (threadId: string) => {
    setActiveThreadId(threadId);
    router.push(`/chat/${threadId}`);
  };

  return (
    <div className="flex h-screen bg-zinc-950">
      <Sidebar
        userId={DEMO_USER_ID}
        activeThreadId={activeThreadId}
        onThreadSelect={handleThreadSelect}
        onNewThread={handleNewThread}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
