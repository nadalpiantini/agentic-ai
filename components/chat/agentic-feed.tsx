"use client";

import { useEffect, useRef } from "react";
import { Activity } from "lucide-react";
import { FeedEventCard } from "./feed-event";
import type { FeedEvent } from "@/types/feed";

interface AgenticFeedProps {
  events: FeedEvent[];
  isStreaming: boolean;
}

export function AgenticFeed({ events, isStreaming }: AgenticFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  if (events.length === 0 && !isStreaming) return null;

  return (
    <div className="border-l border-zinc-800 bg-zinc-900/50 w-72 shrink-0 flex flex-col">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2.5">
        <Activity className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-xs font-medium text-zinc-300">Agent Feed</span>
        {isStreaming && (
          <span className="ml-auto flex h-2 w-2">
            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="relative pl-4 before:absolute before:left-[5px] before:top-[10px] before:h-[calc(100%+4px)] before:w-px before:bg-zinc-800 last:before:hidden animate-message-in"
            >
              <div className="absolute left-0 top-[5px] h-[11px] w-[11px] rounded-full border-2 border-zinc-700 bg-zinc-900" />
              <FeedEventCard event={event} />
            </div>
          ))}
          {isStreaming && events.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border border-zinc-600 border-t-blue-500" />
              Initializing...
            </div>
          )}
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
