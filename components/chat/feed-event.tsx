"use client";

import {
  Cpu,
  Wrench,
  CheckCircle2,
  XCircle,
  Brain,
  Zap,
  Globe,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FeedEvent } from "@/types/feed";

const MODEL_LABELS: Record<string, { label: string; icon: typeof Cpu; color: string }> = {
  zai: { label: "GLM-5", icon: Cpu, color: "text-blue-400" },
  claude: { label: "Claude", icon: Zap, color: "text-yellow-400" },
  deepseek: { label: "DeepSeek", icon: Globe, color: "text-green-400" },
  ollama: { label: "Ollama", icon: Shield, color: "text-purple-400" },
};

const TOOL_ICONS: Record<string, string> = {
  http_fetch: "fetch",
  supabase_crud: "db",
  rag_search: "search",
};

interface FeedEventCardProps {
  event: FeedEvent;
}

export function FeedEventCard({ event }: FeedEventCardProps) {
  switch (event.type) {
    case "model_selected": {
      const modelInfo = MODEL_LABELS[event.data.model ?? ""] ?? {
        label: event.data.model,
        icon: Cpu,
        color: "text-zinc-400",
      };
      const Icon = modelInfo.icon;
      return (
        <div className="flex items-center gap-2 text-xs">
          <Icon className={cn("h-3.5 w-3.5", modelInfo.color)} />
          <span className="text-zinc-400">
            Model: <span className="text-zinc-200">{modelInfo.label}</span>
          </span>
        </div>
      );
    }

    case "step":
      return (
        <div className="flex items-center gap-2 text-xs">
          <Brain className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-zinc-400">
            Reasoning step{" "}
            <span className="text-zinc-200">{event.data.step}</span>
          </span>
        </div>
      );

    case "tool_call":
      return (
        <div className="flex items-start gap-2 text-xs">
          <Wrench className="mt-0.5 h-3.5 w-3.5 text-amber-400" />
          <div>
            <span className="text-zinc-400">
              Calling{" "}
              <span className="font-mono text-amber-300">
                {TOOL_ICONS[event.data.toolName ?? ""] ?? event.data.toolName}
              </span>
            </span>
            {event.data.toolArgs &&
              Object.keys(event.data.toolArgs).length > 0 && (
                <div className="mt-0.5 font-mono text-[11px] text-zinc-500 line-clamp-2">
                  {JSON.stringify(event.data.toolArgs)}
                </div>
              )}
          </div>
        </div>
      );

    case "tool_result":
      return (
        <div className="flex items-start gap-2 text-xs">
          {event.data.toolError ? (
            <XCircle className="mt-0.5 h-3.5 w-3.5 text-red-400" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-green-400" />
          )}
          <div>
            <span
              className={cn(
                "font-mono",
                event.data.toolError ? "text-red-300" : "text-green-300"
              )}
            >
              {event.data.toolName}
            </span>
            {event.data.toolResult && (
              <div className="mt-0.5 text-[11px] text-zinc-500 line-clamp-2">
                {event.data.toolResult}
              </div>
            )}
          </div>
        </div>
      );

    case "complete":
      return (
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
          <span className="text-zinc-400">
            Done{" "}
            <span className="text-zinc-500">
              ({event.data.step} step{event.data.step !== 1 ? "s" : ""})
            </span>
          </span>
        </div>
      );

    default:
      return null;
  }
}
