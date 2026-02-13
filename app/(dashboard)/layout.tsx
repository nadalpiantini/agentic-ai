"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile-sidebar";
import { useMobile } from "@/hooks/use-mobile";

// TODO: Replace with real auth context
const DEMO_USER_ID = "6463954c-e9a5-47d9-918e-4f6d559b9a46";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isMobile = useMobile();
  const [activeThreadId, setActiveThreadId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleThreadSelect = (threadId: string) => {
    setActiveThreadId(threadId);
    router.push(`/chat/${threadId}`);
    setSidebarOpen(false);
  };

  const handleNewThread = (threadId: string) => {
    setActiveThreadId(threadId);
    router.push(`/chat/${threadId}`);
    setSidebarOpen(false);
  };

  const sidebarProps = {
    userId: DEMO_USER_ID,
    activeThreadId,
    onThreadSelect: handleThreadSelect,
    onNewThread: handleNewThread,
  };

  return (
    <div className="flex h-screen bg-zinc-950">
      {isMobile ? (
        <MobileSidebar
          {...sidebarProps}
          open={sidebarOpen}
          onOpenChange={setSidebarOpen}
        />
      ) : (
        <div className="w-64 shrink-0">
          <Sidebar {...sidebarProps} />
        </div>
      )}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
