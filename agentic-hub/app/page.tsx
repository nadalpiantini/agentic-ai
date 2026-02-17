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

      <div className="relative z-10 max-w-2xl w-full px-8 py-20 text-center stagger-children">
        {/* Logo mark */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </div>
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 opacity-20 blur-xl animate-pulse-glow" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4">
          <span className="gradient-text">Sephirot</span>
        </h1>
        <p className="text-xl text-text-secondary font-light mb-3">
          Agentic Hub
        </p>
        <p className="text-base text-text-muted max-w-lg mx-auto mb-16 leading-relaxed">
          Multi-model AI orchestration with stateful workflows, tool execution, and persistent memory.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
          <Link
            href="/chat"
            className="group relative w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white text-lg font-medium rounded-2xl transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/25 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Start Chat
            </span>
          </Link>
          <Link
            href="/monitoring"
            className="w-full sm:w-auto px-10 py-4 glass text-text-secondary text-lg font-medium rounded-2xl transition-all duration-300 hover:text-text-primary hover:border-brand-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span className="flex items-center justify-center gap-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              Monitoring
            </span>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-4 justify-center mb-16">
          {[
            { icon: '🧠', label: 'LangGraph' },
            { icon: '⚡', label: 'Next.js 16' },
            { icon: '🗄️', label: 'Supabase' },
            { icon: '🔀', label: 'Multi-Model' },
          ].map((item) => (
            <span
              key={item.label}
              className="glass px-5 py-2.5 rounded-full text-sm text-text-muted flex items-center gap-2 hover:text-text-secondary transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </span>
          ))}
        </div>

        {/* Model badges */}
        <div className="flex gap-8 justify-center text-sm text-text-muted">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            Claude
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            DeepSeek
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            Ollama
          </div>
        </div>
      </div>
    </main>
  );
}
