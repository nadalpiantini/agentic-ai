import { Bot, Zap, Shield, Globe } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex h-full items-center justify-center bg-zinc-950 p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20">
          <Bot className="h-8 w-8 text-blue-400" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-white">
          Welcome to Agentic Hub
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Multi-model AI agent with stateful workflows, tool execution, and
          persistent memory.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div>
            <Zap className="mx-auto h-5 w-5 text-yellow-400" />
            <p className="mt-1 text-xs text-zinc-500">Claude</p>
            <p className="text-[10px] text-zinc-600">Quality</p>
          </div>
          <div>
            <Globe className="mx-auto h-5 w-5 text-green-400" />
            <p className="mt-1 text-xs text-zinc-500">DeepSeek</p>
            <p className="text-[10px] text-zinc-600">Cost</p>
          </div>
          <div>
            <Shield className="mx-auto h-5 w-5 text-purple-400" />
            <p className="mt-1 text-xs text-zinc-500">Ollama</p>
            <p className="text-[10px] text-zinc-600">Privacy</p>
          </div>
        </div>

        <p className="mt-8 text-xs text-zinc-600">
          Create a new chat or select an existing thread to begin.
        </p>
      </div>
    </div>
  );
}
