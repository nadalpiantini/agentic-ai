/**
 * Intel Feed API Route
 *
 * GET /api/intel?status=active&type=dropalert&min_ofs=0&limit=50
 *
 * Reads from the NRS SQLite database, maps neglect_events rows to IntelEvent
 * objects with squadron_type classification and parsed JSON fields.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getIntelDB, getSquadronType, getSquadronCategories } from '@/lib/intel/db'
import type { IntelEvent, IntelPaso, SquadronType } from '@/types/intel'

interface NrsEventRow {
  id: string
  created_at: string
  expires_at: string
  status: string
  entity: string
  category: string
  summary: string
  why_it_matters: string
  window_estimate: string
  rareza: number
  ventana_temporal: number
  impacto_potencial: number
  claridad_etica: number
  ofs: number
  options: string | null
  alerted: number
}

function parseJsonSafe<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function rowToIntelEvent(row: NrsEventRow): IntelEvent {
  return {
    id: row.id,
    created_at: row.created_at,
    expires_at: row.expires_at,
    status: row.status as IntelEvent['status'],
    entity: row.entity,
    category: row.category,
    squadron_type: getSquadronType(row.category),
    ofs: row.ofs,
    scores: {
      rareza: row.rareza,
      ventana_temporal: row.ventana_temporal,
      impacto_potencial: row.impacto_potencial,
      claridad_etica: row.claridad_etica,
    },
    situacion: row.summary,
    oportunidad: row.why_it_matters,
    pasos: parseJsonSafe<IntelPaso[]>(row.options, []),
    window_estimate: row.window_estimate,
    alerted: Boolean(row.alerted),
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = getIntelDB()

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type') as SquadronType | null
    const minOfs = Number(searchParams.get('min_ofs')) || 0
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)

    // Build dynamic WHERE clause
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (status) {
      conditions.push('status = ?')
      params.push(status)
    }

    if (minOfs > 0) {
      conditions.push('ofs >= ?')
      params.push(minOfs)
    }

    // Filter by squadron type: resolve to category list
    if (type) {
      const categories = getSquadronCategories(type)
      if (categories) {
        const placeholders = categories.map(() => '?').join(', ')
        conditions.push(`category IN (${placeholders})`)
        params.push(...categories)
      } else if (type === 'nrs') {
        // 'nrs' is the catch-all: exclude known categories
        const allKnown = [
          ...getSquadronCategories('dropalert')!,
          ...getSquadronCategories('shadowwatch')!,
          ...getSquadronCategories('assethunter')!,
        ]
        const placeholders = allKnown.map(() => '?').join(', ')
        conditions.push(`category NOT IN (${placeholders})`)
        params.push(...allKnown)
      }
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    const sql = `
      SELECT id, created_at, expires_at, status, entity, category,
             summary, why_it_matters, window_estimate,
             rareza, ventana_temporal, impacto_potencial, claridad_etica, ofs,
             options, alerted
      FROM neglect_events
      ${whereClause}
      ORDER BY ofs DESC, created_at DESC
      LIMIT ?
    `
    params.push(limit)

    const rows = db.prepare(sql).all(...params) as NrsEventRow[]
    const events: IntelEvent[] = rows.map(rowToIntelEvent)

    return NextResponse.json({ events })
  } catch (error) {
    console.error('[Intel GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intel events' },
      { status: 500 }
    )
  }
}
