'use client'

import React, { useState } from 'react'
import type { IntelTarget } from '@/types/intel'

interface TargetCardProps {
  target: IntelTarget
  onToggle: (id: string, active: boolean) => void
  onDelete: (id: string) => void
}

const TYPE_CONFIG: Record<string, {
  label: string
  badgeBg: string
  badgeText: string
  borderAccent: string
  icon: React.ReactNode
}> = {
  domain: {
    label: 'Domain',
    badgeBg: 'bg-brand-500/15',
    badgeText: 'text-brand-400',
    borderAccent: 'border-brand-500/20',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  repo: {
    label: 'Repo',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-400',
    borderAccent: 'border-purple-500/20',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
  },
  api: {
    label: 'API',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    borderAccent: 'border-emerald-500/20',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
}

const SOURCE_COLORS: Record<string, string> = {
  seed: 'bg-brand-500/15 text-brand-400',
  manual: 'bg-amber-500/15 text-amber-400',
  ct_logs: 'bg-purple-500/15 text-purple-400',
  github_search: 'bg-white/5 text-text-muted',
  expansion: 'bg-emerald-500/15 text-emerald-400',
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function TargetCard({ target, onToggle, onDelete }: TargetCardProps) {
  const [isActing, setIsActing] = useState(false)
  const config = TYPE_CONFIG[target.target_type] ?? TYPE_CONFIG.domain

  const handleToggle = async () => {
    setIsActing(true)
    try {
      await onToggle(target.id, !target.active)
    } finally {
      setIsActing(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete target "${target.identifier}"?`)) return
    setIsActing(true)
    try {
      await onDelete(target.id)
    } finally {
      setIsActing(false)
    }
  }

  return (
    <div
      className={`glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10 ${
        !target.active ? 'opacity-50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Type badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.badgeBg} ${config.badgeText} shrink-0`}>
            {config.icon}
            <span className="text-xs font-semibold">{config.label}</span>
          </div>

          {/* Identifier */}
          <span className="text-sm font-medium text-text-primary truncate">
            {target.identifier}
          </span>

          {/* Category pill */}
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-text-muted shrink-0">
            {target.category}
          </span>
        </div>

        {/* Source pill */}
        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider shrink-0 ${
          SOURCE_COLORS[target.source] ?? 'bg-white/5 text-text-muted'
        }`}>
          {target.source}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-3 space-y-2">
        {/* Note */}
        <p className="text-sm text-text-secondary leading-relaxed">
          {target.note || 'No notes'}
        </p>

        {/* Scan stats */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {target.scan_count} scans
          </span>
          <span className="text-xs text-text-muted">
            Last: {target.last_scanned_at ? formatRelativeTime(target.last_scanned_at) : 'never'}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-surface-1/30">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>Added {formatDate(target.discovered_at)}</span>
          <span className="text-text-muted/60">{formatRelativeTime(target.discovered_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Active toggle */}
          <button
            onClick={handleToggle}
            disabled={isActing}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              target.active
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                : 'bg-white/5 text-text-muted border-white/5 hover:text-text-secondary'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${target.active ? 'bg-emerald-400' : 'bg-text-muted'}`} />
            {target.active ? 'Active' : 'Inactive'}
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={isActing}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-red-400 hover:bg-red-500/10 border border-white/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
