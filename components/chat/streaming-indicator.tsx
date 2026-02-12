"use client";

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-zinc-500">
      <div className="flex gap-1">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
      </div>
      <span>Thinking...</span>
    </div>
  );
}
