'use client'

import type { IntelEvent } from '@/types/intel'
import { IntelCard } from './IntelCard'

interface IntelFeedProps {
  events: IntelEvent[]
  onAction: (id: string, action: string) => void
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      {/* Radar icon */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-surface-2 border border-white/5 flex items-center justify-center">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-muted"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
            <line x1="12" y1="2" x2="12" y2="12" />
          </svg>
        </div>
        {/* Animated pulse ring */}
        <div className="absolute inset-0 rounded-2xl border border-brand-500/20 animate-ping opacity-30" />
      </div>

      <h3 className="text-lg font-semibold text-text-secondary mb-2">
        No intel events detected
      </h3>
      <p className="text-sm text-text-muted max-w-sm leading-relaxed">
        Squadron scanners are monitoring targets. New intelligence will appear here when opportunities are identified.
      </p>
    </div>
  )
}

export function IntelFeed({ events, onAction }: IntelFeedProps) {
  if (events.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-4 stagger-children">
      {events.map((event) => (
        <IntelCard key={event.id} event={event} onAction={onAction} />
      ))}
    </div>
  )
}
