import Link from "next/link";
import { Bot, Sparkles, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="max-w-3xl text-center">
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 ring-1 ring-blue-500/30">
            <Bot className="h-8 w-8 text-blue-400" />
          </div>

          {/* Headline */}
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Agentic Hub
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-lg text-zinc-400 sm:text-xl">
            Multi-model AI agent platform with stateful workflows,
            <br className="hidden sm:block" />
            tool execution, and persistent memory.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-500"
            >
              <Sparkles className="h-4 w-4" />
              Start Chatting
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://github.com/nadalpiantini/agentic-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-6 py-3 font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
            >
              View on GitHub
            </a>
          </div>

          {/* Features Grid */}
          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Feature
              emoji="🧠"
              title="Multi-Agent"
              description="Claude, DeepSeek, and Ollama working together"
            />
            <Feature
              emoji="🔄"
              title="Stateful"
              description="Persistent memory and workflow orchestration"
            />
            <Feature
              emoji="🛠️"
              title="Tools"
              description="Database, HTTP, RAG, and file system access"
            />
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-zinc-800 py-6 text-center">
        <p className="text-sm text-zinc-500">
          Built with Next.js 16 · LangGraph · Supabase · Ollama
        </p>
      </footer>
    </div>
  );
}

function Feature({
  emoji,
  title,
  description,
}: {
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <span className="text-2xl">{emoji}</span>
      <h3 className="mt-3 font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
    </div>
  );
}
