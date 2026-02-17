import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface-0">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600/10 blur-[128px] animate-float" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-brand-400/8 blur-[128px] animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-[160px]" />
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
      }} />

      <div className="relative z-10 max-w-2xl px-8 py-16 text-center stagger-children">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 opacity-20 blur-lg animate-pulse-glow" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
          <span className="gradient-text">Sephirot</span>
        </h1>
        <p className="text-lg text-text-secondary font-light mb-2">
          Agentic Hub
        </p>
        <p className="text-sm text-text-muted max-w-md mx-auto mb-12">
          Multi-model AI orchestration with stateful workflows, tool execution, and persistent memory
        </p>

        {/* CTA buttons */}
        <div className="flex gap-4 justify-center mb-16">
          <Link
            href="/chat"
            className="group relative px-8 py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Start Chat
            </span>
          </Link>
          <Link
            href="/monitoring"
            className="px-8 py-3.5 glass text-text-secondary font-medium rounded-xl transition-all duration-300 hover:text-text-primary hover:border-brand-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              Monitoring
            </span>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {[
            { icon: '🧠', label: 'LangGraph' },
            { icon: '⚡', label: 'Next.js 16' },
            { icon: '🗄️', label: 'Supabase' },
            { icon: '🔀', label: 'Multi-Model' },
          ].map((item) => (
            <span
              key={item.label}
              className="glass px-4 py-2 rounded-full text-xs text-text-muted flex items-center gap-1.5 hover:text-text-secondary transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>

        {/* Model badges */}
        <div className="flex gap-6 justify-center text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Claude
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            DeepSeek
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            Ollama
          </div>
        </div>
      </div>
    </main>
  );
}
