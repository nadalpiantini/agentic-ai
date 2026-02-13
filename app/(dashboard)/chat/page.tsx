import { Bot, MessageSquare } from "lucide-react";

export default function ChatIndexPage() {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800">
          <Bot className="h-7 w-7 text-zinc-400" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-zinc-200">
          Agentic Hub
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Select a conversation from the sidebar or start a new chat.
        </p>
        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-600">
          <MessageSquare className="h-3 w-3" />
          <span>Press <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-zinc-400">New</kbd> to begin</span>
        </div>
      </div>
    </div>
  );
}
