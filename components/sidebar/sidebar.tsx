"use client";

import { Plus } from "lucide-react";
import { useThreads } from "@/hooks/use-threads";
import { ThreadItem } from "./thread-item";

interface SidebarProps {
  userId: string;
  activeThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: (threadId: string) => void;
}

export function Sidebar({
  userId,
  activeThreadId,
  onThreadSelect,
  onNewThread,
}: SidebarProps) {
  const { threads, isLoading, createThread, deleteThread } = useThreads(userId);

  const handleNewThread = async () => {
    const thread = await createThread(undefined);
    onNewThread(thread.id);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <h2 className="text-sm font-semibold text-zinc-200">Chats</h2>
        <button
          onClick={handleNewThread}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
          </div>
        ) : threads.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-zinc-500">
            No conversations yet
          </p>
        ) : (
          <div className="space-y-1">
            {threads.map((thread) => (
              <ThreadItem
                key={thread.id}
                id={thread.id}
                title={thread.title}
                isActive={thread.id === activeThreadId}
                onClick={() => onThreadSelect(thread.id)}
                onDelete={() => deleteThread(thread.id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 p-3">
        <p className="text-center text-[10px] text-zinc-600">
          Agentic Hub v0.1.0
        </p>
      </div>
    </aside>
  );
}
