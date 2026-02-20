export type SquadronType = 'dropalert' | 'shadowwatch' | 'assethunter' | 'nrs'

export interface IntelScores {
  rareza: number
  ventana_temporal: number
  impacto_potencial: number
  claridad_etica: number
}

export interface IntelPaso {
  type: string
  action: string
  effort: string
  risk: string
}

export interface IntelEvent {
  id: string
  created_at: string
  expires_at: string
  status: 'active' | 'expired' | 'acted' | 'dismissed'
  entity: string
  category: string
  squadron_type: SquadronType
  ofs: number
  scores: IntelScores
  situacion: string
  oportunidad: string
  pasos: IntelPaso[]
  window_estimate: string
  alerted: boolean
}

export interface IntelStats {
  total: number
  active: number
  by_type: Record<SquadronType, number>
  avg_ofs: number
  last_scan_at: string | null
}

export interface IntelFeedResponse {
  events: IntelEvent[]
  stats: IntelStats
}

export interface IntelTarget {
  id: string
  target_type: 'domain' | 'repo' | 'api'
  identifier: string
  category: string
  note: string | null
  source: string
  discovered_at: string
  last_scanned_at: string | null
  scan_count: number
  active: boolean
}
