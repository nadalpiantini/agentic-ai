"use client";

import { MessageSquare, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ThreadItemProps {
  id: string;
  title: string;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ThreadItem({
  title,
  isActive,
  onClick,
  onDelete,
}: ThreadItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        isActive
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{title}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="hidden shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-700 hover:text-red-400 group-hover:block"
        title="Delete thread"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </button>
  );
}
