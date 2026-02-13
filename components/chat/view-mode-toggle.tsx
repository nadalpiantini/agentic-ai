"use client";

import { Eye, EyeOff } from "lucide-react";
import { useViewMode } from "@/hooks/use-view-mode";
import { cn } from "@/lib/utils/cn";

export function ViewModeToggle() {
  const { mode, toggle } = useViewMode();
  const isExpert = mode === "expert";

  return (
    <button
      onClick={toggle}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors",
        isExpert
          ? "border-blue-600/50 bg-blue-600/10 text-blue-400"
          : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600"
      )}
      title={isExpert ? "Switch to Simple mode" : "Switch to Expert mode"}
      aria-label={`Current mode: ${mode}. Click to switch.`}
    >
      {isExpert ? (
        <>
          <Eye className="h-3.5 w-3.5" />
          <span>Expert</span>
        </>
      ) : (
        <>
          <EyeOff className="h-3.5 w-3.5" />
          <span>Simple</span>
        </>
      )}
    </button>
  );
}
