'use client'

import React, { useState } from 'react'
import type { IntelEvent, SquadronType } from '@/types/intel'
import { IntelScoreBar } from './IntelScoreBar'

interface IntelCardProps {
  event: IntelEvent
  onAction: (id: string, action: string) => void
}

const SQUADRON_CONFIG: Record<SquadronType, {
  label: string
  badgeBg: string
  badgeText: string
  borderAccent: string
  icon: React.ReactNode
}> = {
  dropalert: {
    label: 'DropAlert',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-400',
    borderAccent: 'border-red-500/20',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  shadowwatch: {
    label: 'ShadowWatch',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    borderAccent: 'border-amber-500/20',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  assethunter: {
    label: 'AssetHunter',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    borderAccent: 'border-emerald-500/20',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  nrs: {
    label: 'NRS',
    badgeBg: 'bg-brand-500/15',
    badgeText: 'text-brand-400',
    borderAccent: 'border-brand-500/20',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
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

const EFFORT_COLORS: Record<string, string> = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
}

const RISK_COLORS: Record<string, string> = {
  low: 'text-emerald-400',
  medium: 'text-amber-400',
  high: 'text-red-400',
}

export function IntelCard({ event, onAction }: IntelCardProps) {
  const [isActing, setIsActing] = useState(false)
  const config = SQUADRON_CONFIG[event.squadron_type] ?? SQUADRON_CONFIG.nrs
  const isDismissedOrActed = event.status === 'dismissed' || event.status === 'acted'

  const handleAction = async (action: string) => {
    setIsActing(true)
    try {
      await onAction(event.id, action)
    } finally {
      setIsActing(false)
    }
  }

  return (
    <div
      className={`glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/10 ${
        isDismissedOrActed ? 'opacity-50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 min-w-0">
          {/* Squadron badge */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.badgeBg} ${config.badgeText} shrink-0`}>
            {config.icon}
            <span className="text-xs font-semibold">{config.label}</span>
          </div>

          {/* Entity */}
          <span className="text-sm font-medium text-text-primary truncate">
            {event.entity}
          </span>

          {/* Category pill */}
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-text-muted shrink-0">
            {event.category}
          </span>
        </div>

        {/* OFS Score */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${config.badgeBg} shrink-0`}>
          <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">OFS</span>
          <span className={`text-lg font-bold ${config.badgeText} font-mono`}>{event.ofs}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Score bar */}
        <IntelScoreBar scores={event.scores} ofs={event.ofs} />

        {/* Situation */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Situation
          </h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            {event.situacion}
          </p>
        </div>

        {/* Opportunity */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Opportunity
          </h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            {event.oportunidad}
          </p>
        </div>

        {/* Steps */}
        {event.pasos.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Action Steps
            </h4>
            <div className="space-y-1.5">
              {event.pasos.map((paso, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-surface-2/80"
                >
                  <span className="text-[11px] font-mono font-bold text-text-muted mt-0.5 shrink-0">
                    {idx + 1}.
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/5 text-text-muted uppercase tracking-wider">
                        {paso.type}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{paso.action}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-[10px] font-mono ${EFFORT_COLORS[paso.effort.toLowerCase()] ?? 'text-text-muted'}`}>
                      {paso.effort}
                    </span>
                    <span className={`text-[10px] font-mono ${RISK_COLORS[paso.risk.toLowerCase()] ?? 'text-text-muted'}`}>
                      {paso.risk} risk
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-surface-1/30">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          {/* Window estimate */}
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {event.window_estimate}
          </span>

          {/* Date */}
          <span>{formatDate(event.created_at)}</span>

          {/* Relative time */}
          <span className="text-text-muted/60">{formatRelativeTime(event.created_at)}</span>

          {/* Status pill */}
          {event.status !== 'active' && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${
              event.status === 'acted'
                ? 'bg-emerald-500/15 text-emerald-400'
                : event.status === 'dismissed'
                ? 'bg-white/5 text-text-muted'
                : 'bg-amber-500/15 text-amber-400'
            }`}>
              {event.status}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {event.status === 'active' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('dismiss')}
              disabled={isActing}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-text-secondary hover:bg-white/5 border border-white/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dismiss
            </button>
            <button
              onClick={() => handleAction('act')}
              disabled={isActing}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${config.badgeBg} ${config.badgeText} hover:brightness-125 border ${config.borderAccent}`}
            >
              Act
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
