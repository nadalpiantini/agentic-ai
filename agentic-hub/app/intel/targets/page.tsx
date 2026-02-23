'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useTargets } from '@/hooks/useTargets'
import { TargetStatsBar } from '@/components/intel/TargetStatsBar'
import { TargetFilterBar } from '@/components/intel/TargetFilterBar'
import { TargetCard } from '@/components/intel/TargetCard'
import { AddTargetForm } from '@/components/intel/AddTargetForm'

export default function TargetsPage() {
  const [activeType, setActiveType] = useState<string | null>(null)
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  const { targets, stats, isLoading, error, refetch, addTarget, toggleTarget, deleteTarget } =
    useTargets({
      type: (activeType as 'domain' | 'repo' | 'api') ?? undefined,
      activeOnly: showActiveOnly,
      pollInterval: 60000,
    })

  const handleToggle = useCallback(async (id: string, active: boolean) => {
    try {
      await toggleTarget(id, active)
    } catch (err) {
      console.error('[TargetsPage] Toggle error:', err)
    }
  }, [toggleTarget])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteTarget(id)
    } catch (err) {
      console.error('[TargetsPage] Delete error:', err)
    }
  }, [deleteTarget])

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

          <Link
            href="/intel"
            className="p-3 rounded-xl text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
            title="Intel Feed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </Link>
        </div>

        <span className="text-base font-semibold text-text-secondary tracking-tight flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-400">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          Monitoring Targets
        </span>

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
      <TargetStatsBar stats={stats} />

      {/* Filter bar */}
      <TargetFilterBar
        activeType={activeType}
        onTypeChange={setActiveType}
        showActiveOnly={showActiveOnly}
        onActiveToggle={() => setShowActiveOnly((v) => !v)}
      />

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && targets.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
            <p className="text-sm text-text-muted">Loading targets...</p>
          </div>
        </div>
      )}

      {/* Content */}
      {(!isLoading || targets.length > 0) && (
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AddTargetForm onSubmit={addTarget} />

          {targets.length > 0 ? (
            <div className="space-y-4 stagger-children mt-4">
              {targets.map((target) => (
                <TargetCard
                  key={target.id}
                  target={target}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-white/5 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-2xl border border-brand-500/20 animate-ping opacity-30 pointer-events-none" />
                </div>
                <h3 className="text-lg font-semibold text-text-secondary mb-2">No targets configured</h3>
                <p className="text-sm text-text-muted max-w-sm leading-relaxed">
                  Add domains, repos, or API endpoints to monitor. The NRS scanner will periodically check them for security signals.
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
