'use client'

import type { TargetStats } from '@/types/intel'

interface TargetStatsBarProps {
  stats: TargetStats | null
}

const TYPE_DOTS: Array<{
  key: 'domain' | 'repo' | 'api'
  label: string
  dotColor: string
}> = [
  { key: 'domain', label: 'Domain', dotColor: 'bg-brand-400 shadow-brand-400/50' },
  { key: 'repo', label: 'Repo', dotColor: 'bg-purple-400 shadow-purple-400/50' },
  { key: 'api', label: 'API', dotColor: 'bg-emerald-400 shadow-emerald-400/50' },
]

export function TargetStatsBar({ stats }: TargetStatsBarProps) {
  if (!stats) {
    return (
      <div className="shrink-0 px-6 py-4 border-b border-white/5">
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass rounded-xl px-5 py-3 flex-1 animate-pulse">
              <div className="h-3 w-16 bg-white/5 rounded mb-2" />
              <div className="h-6 w-10 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 px-6 py-4 border-b border-white/5">
      <div className="flex gap-3 overflow-x-auto">
        {/* Active count */}
        <div className="glass rounded-xl px-5 py-3 min-w-[120px]">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">
            Active
          </p>
          <p className="text-2xl font-bold text-text-primary font-mono">
            {stats.active}
            <span className="text-sm text-text-muted font-normal ml-1">/ {stats.total}</span>
          </p>
        </div>

        {/* By type */}
        <div className="glass rounded-xl px-5 py-3 min-w-[200px]">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-2">
            By Type
          </p>
          <div className="flex items-center gap-4">
            {TYPE_DOTS.map((type) => (
              <div key={type.key} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${type.dotColor} shadow-sm`} />
                <span className="text-xs text-text-muted">{type.label}</span>
                <span className="text-sm font-bold text-text-primary font-mono">
                  {stats.byType[type.key] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Avg scans */}
        <div className="glass rounded-xl px-5 py-3 min-w-[100px]">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">
            Avg Scans
          </p>
          <p className="text-2xl font-bold text-brand-400 font-mono">
            {stats.avgScanCount.toFixed(1)}
          </p>
        </div>

        {/* Total */}
        <div className="glass rounded-xl px-5 py-3 min-w-[100px]">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">
            Total
          </p>
          <p className="text-2xl font-bold text-text-primary font-mono">
            {stats.total}
          </p>
        </div>
      </div>
    </div>
  )
}
