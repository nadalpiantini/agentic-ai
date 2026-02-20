'use client'

import React from 'react'
import type { SquadronType } from '@/types/intel'

interface IntelFilterBarProps {
  activeType: string | null
  onTypeChange: (type: string | null) => void
}

const FILTER_OPTIONS: Array<{
  value: SquadronType | null
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
    value: 'dropalert',
    label: 'DropAlert',
    activeClasses: 'bg-red-500/15 text-red-400 border-red-500/30',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    ),
  },
  {
    value: 'shadowwatch',
    label: 'ShadowWatch',
    activeClasses: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    value: 'assethunter',
    label: 'AssetHunter',
    activeClasses: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
]

export function IntelFilterBar({ activeType, onTypeChange }: IntelFilterBarProps) {
  return (
    <div className="shrink-0 px-6 py-3 border-b border-white/5">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider mr-2 shrink-0">
          Squadron
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
    </div>
  )
}
