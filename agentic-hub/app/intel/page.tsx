'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useIntelFeed } from '@/hooks/useIntelFeed'
import { IntelStatsBar } from '@/components/intel/IntelStatsBar'
import { IntelFilterBar } from '@/components/intel/IntelFilterBar'
import { IntelFeed } from '@/components/intel/IntelFeed'

export default function IntelPage() {
  const [activeType, setActiveType] = useState<string | null>(null)

  const { events, stats, isLoading, error, refetch } = useIntelFeed({
    squadron_type: activeType ?? undefined,
    status: 'active',
    pollInterval: 60000,
  })

  const handleAction = useCallback(async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/intel/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!res.ok) {
        throw new Error(`Action failed: ${res.status}`)
      }

      // Refetch to update the list
      await refetch()
    } catch (err) {
      console.error('[IntelPage] Action error:', err)
    }
  }, [refetch])

  return (
    <div className="flex flex-col h-screen bg-surface-0">
      {/* Top bar */}
      <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-surface-1/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            title="Home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </Link>

          <div className="w-px h-6 bg-white/10" />

          <Link
            href="/chat"
            className="p-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            title="Chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </Link>
        </div>

        <span className="text-base font-semibold text-text-secondary tracking-tight flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
            <line x1="12" y1="2" x2="12" y2="12" />
          </svg>
          Squadron Intel Feed
        </span>

        {/* Right side: refresh + spacer */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isLoading ? 'animate-spin' : ''}
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <IntelStatsBar stats={stats} />

      {/* Filter bar */}
      <IntelFilterBar activeType={activeType} onTypeChange={setActiveType} />

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && events.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
            <p className="text-sm text-text-muted">Scanning intel feed...</p>
          </div>
        </div>
      )}

      {/* Feed */}
      {(!isLoading || events.length > 0) && (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <IntelFeed events={events} onAction={handleAction} />
        </div>
      )}
    </div>
  )
}
