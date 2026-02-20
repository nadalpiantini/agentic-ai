'use client'

import type { IntelStats } from '@/types/intel'

interface IntelStatsBarProps {
  stats: IntelStats | null
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)

  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const TYPE_DOTS: Array<{
  key: 'dropalert' | 'shadowwatch' | 'assethunter' | 'nrs'
  label: string
  dotColor: string
}> = [
  { key: 'dropalert', label: 'Drop', dotColor: 'bg-red-400 shadow-red-400/50' },
  { key: 'shadowwatch', label: 'Shadow', dotColor: 'bg-amber-400 shadow-amber-400/50' },
  { key: 'assethunter', label: 'Asset', dotColor: 'bg-emerald-400 shadow-emerald-400/50' },
  { key: 'nrs', label: 'NRS', dotColor: 'bg-brand-400 shadow-brand-400/50' },
]

export function IntelStatsBar({ stats }: IntelStatsBarProps) {
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
            By Squadron
          </p>
          <div className="flex items-center gap-4">
            {TYPE_DOTS.map((type) => (
              <div key={type.key} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${type.dotColor} shadow-sm`} />
                <span className="text-xs text-text-muted">{type.label}</span>
                <span className="text-sm font-bold text-text-primary font-mono">
                  {stats.by_type[type.key] ?? 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Avg OFS */}
        <div className="glass rounded-xl px-5 py-3 min-w-[100px]">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">
            Avg OFS
          </p>
          <p className="text-2xl font-bold text-brand-400 font-mono">
            {stats.avg_ofs.toFixed(1)}
          </p>
        </div>

        {/* Last scan */}
        <div className="glass rounded-xl px-5 py-3 min-w-[120px]">
          <p className="text-[11px] font-medium text-text-muted uppercase tracking-wider mb-1">
            Last Scan
          </p>
          <div className="flex items-center gap-2">
            {stats.last_scan_at && (
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
            )}
            <p className="text-sm font-medium text-text-secondary">
              {formatRelativeTime(stats.last_scan_at)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
