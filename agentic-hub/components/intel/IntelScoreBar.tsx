'use client'

import type { IntelScores } from '@/types/intel'

interface IntelScoreBarProps {
  scores: IntelScores
  ofs: number
}

const SEGMENTS = [
  { key: 'rareza' as const, label: 'R', color: 'bg-brand-400', textColor: 'text-brand-400' },
  { key: 'ventana_temporal' as const, label: 'V', color: 'bg-amber-400', textColor: 'text-amber-400' },
  { key: 'impacto_potencial' as const, label: 'I', color: 'bg-red-400', textColor: 'text-red-400' },
  { key: 'claridad_etica' as const, label: 'E', color: 'bg-emerald-400', textColor: 'text-emerald-400' },
]

export function IntelScoreBar({ scores, ofs }: IntelScoreBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {SEGMENTS.map((segment) => {
          const value = scores[segment.key]
          const widthPercent = (value / 10) * 100

          return (
            <div key={segment.key} className="flex items-center gap-1">
              <span className={`text-[10px] font-mono font-semibold ${segment.textColor} opacity-80`}>
                {segment.label}
              </span>
              <div className="w-10 h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${segment.color} transition-all duration-500`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                {value}
              </span>
            </div>
          )
        })}
      </div>

      <div className="ml-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
        <span className="text-xs font-mono font-bold text-text-primary">
          {ofs}
        </span>
        <span className="text-[10px] font-mono text-text-muted">/40</span>
      </div>
    </div>
  )
}
