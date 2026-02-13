"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile-sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { useUser } from "@/hooks/use-user";
import type { User } from "@supabase/supabase-js";
import { Bot } from "lucide-react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isMobile = useMobile();
  const { user, loading: userLoading } = useUser();
  const [activeThreadId, setActiveThreadId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    }
  }, [user, userLoading, router]);

  // Show loading state while checking auth
  if (userLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Bot className="h-8 w-8 animate-pulse text-blue-500" />
          <p className="text-sm text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

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
    userId: user.id,
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
