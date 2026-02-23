'use client'

import React from 'react'

interface TargetFilterBarProps {
  activeType: string | null
  onTypeChange: (type: string | null) => void
  showActiveOnly: boolean
  onActiveToggle: () => void
}

const FILTER_OPTIONS: Array<{
  value: string | null
  label: string
  activeClasses: string
  icon: React.ReactNode
}> = [
  {
    value: null,
    label: 'All',
    activeClasses: 'bg-brand-500/20 text-brand-400 border-brand-500/30',
    icon: null,
  },
  {
    value: 'domain',
    label: 'Domain',
    activeClasses: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    value: 'repo',
    label: 'Repo',
    activeClasses: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
      </svg>
    ),
  },
  {
    value: 'api',
    label: 'API',
    activeClasses: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
]

export function TargetFilterBar({ activeType, onTypeChange, showActiveOnly, onActiveToggle }: TargetFilterBarProps) {
  return (
    <div className="shrink-0 px-6 py-3 border-b border-white/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-text-muted uppercase tracking-wider mr-2 shrink-0">
            Type
          </span>
          {FILTER_OPTIONS.map((option) => {
            const isActive = activeType === option.value
            return (
              <button
                key={option.value ?? 'all'}
                onClick={() => onTypeChange(option.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 shrink-0 ${
                  isActive
                    ? option.activeClasses
                    : 'bg-transparent text-text-muted border-white/5 hover:text-text-secondary hover:bg-white/3 hover:border-white/10'
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            )
          })}
        </div>

        <button
          onClick={onActiveToggle}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 shrink-0 ${
            showActiveOnly
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-transparent text-text-muted border-white/5 hover:text-text-secondary hover:bg-white/3 hover:border-white/10'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${showActiveOnly ? 'bg-emerald-400' : 'bg-text-muted'}`} />
          Active only
        </button>
      </div>
    </div>
  )
}
