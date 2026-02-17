import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(to bottom right, #111827, #1f2937, #111827)',
    }}>
      <div style={{ maxWidth: '672px', padding: '48px 32px', textAlign: 'center' }}>
        <h1 style={{
          marginBottom: '24px',
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'white',
        }}>
          Agentic Hub
        </h1>
        <p style={{
          marginBottom: '48px',
          fontSize: '20px',
          color: '#d1d5db',
        }}>
          Multi-model AI agent platform with stateful workflows
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link
            href="/chat"
            style={{
              padding: '16px 32px',
              background: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500',
            }}
          >
            Start Chat
          </Link>
          <Link
            href="/monitoring"
            style={{
              padding: '16px 32px',
              background: '#374151',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '500',
            }}
          >
            Monitoring
          </Link>
        </div>
        <div style={{ marginTop: '64px', fontSize: '14px', color: '#9ca3af' }}>
          <p>Powered by LangGraph • Next.js 16 • Supabase</p>
        </div>
      </div>
    </main>
  );
}
