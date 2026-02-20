/**
 * Intel Stats API Route
 *
 * GET /api/intel/stats
 *
 * Returns aggregate statistics from the NRS SQLite database:
 * total events, active count, breakdown by squadron type, average OFS.
 */

import { NextResponse } from 'next/server'
import { getIntelDB, getSquadronType } from '@/lib/intel/db'
import type { IntelStats, SquadronType } from '@/types/intel'

interface CountRow {
  total: number
}

interface ActiveRow {
  active: number
}

interface AvgRow {
  avg_ofs: number | null
}

interface CategoryCountRow {
  category: string
  cnt: number
}

interface LastScanRow {
  last_scan: string | null
}

export async function GET() {
  try {
    const db = getIntelDB()

    // Total events
    const totalRow = db
      .prepare('SELECT COUNT(*) as total FROM neglect_events')
      .get() as CountRow
    const total = totalRow.total

    // Active events
    const activeRow = db
      .prepare("SELECT COUNT(*) as active FROM neglect_events WHERE status = 'active'")
      .get() as ActiveRow
    const active = activeRow.active

    // Average OFS (across active events)
    const avgRow = db
      .prepare("SELECT AVG(ofs) as avg_ofs FROM neglect_events WHERE status = 'active'")
      .get() as AvgRow
    const avgOfs = avgRow.avg_ofs !== null ? Math.round(avgRow.avg_ofs * 10) / 10 : 0

    // Count by category, then aggregate into squadron types
    const categoryRows = db
      .prepare('SELECT category, COUNT(*) as cnt FROM neglect_events GROUP BY category')
      .all() as CategoryCountRow[]

    const byType: Record<SquadronType, number> = {
      dropalert: 0,
      shadowwatch: 0,
      assethunter: 0,
      nrs: 0,
    }

    for (const row of categoryRows) {
      const squadType = getSquadronType(row.category)
      byType[squadType] += row.cnt
    }

    // Last scan timestamp (most recent created_at)
    const lastScanRow = db
      .prepare('SELECT MAX(created_at) as last_scan FROM neglect_events')
      .get() as LastScanRow

    const stats: IntelStats = {
      total,
      active,
      by_type: byType,
      avg_ofs: avgOfs,
      last_scan_at: lastScanRow.last_scan,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('[Intel Stats GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch intel stats' },
      { status: 500 }
    )
  }
}
