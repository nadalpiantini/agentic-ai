/**
 * Intel Event Action API Route
 *
 * POST /api/intel/[id]/action
 * Body: { action: 'dismiss' | 'act', notes?: string }
 *
 * Updates the status of a neglect_event in the NRS SQLite database.
 * - 'dismiss' sets status to 'dismissed'
 * - 'act' sets status to 'acted' and records notes as action_taken
 */

import { NextRequest, NextResponse } from 'next/server'
import { getIntelDB } from '@/lib/intel/db'

interface ActionBody {
  action: 'dismiss' | 'act'
  notes?: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    const body = (await req.json()) as ActionBody

    if (!body.action || !['dismiss', 'act'].includes(body.action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "dismiss" or "act".' },
        { status: 400 }
      )
    }

    const db = getIntelDB()

    // Verify event exists
    const existing = db
      .prepare('SELECT id, status FROM neglect_events WHERE id = ?')
      .get(eventId) as { id: string; status: string } | undefined

    if (!existing) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (existing.status !== 'active') {
      return NextResponse.json(
        { error: `Event already has status "${existing.status}". Only active events can be actioned.` },
        { status: 409 }
      )
    }

    if (body.action === 'dismiss') {
      db.prepare('UPDATE neglect_events SET status = ? WHERE id = ?')
        .run('dismissed', eventId)
    } else {
      // 'act' — set status and record the action notes
      db.prepare('UPDATE neglect_events SET status = ?, action_taken = ? WHERE id = ?')
        .run('acted', body.notes || '', eventId)
    }

    return NextResponse.json({
      id: eventId,
      status: body.action === 'dismiss' ? 'dismissed' : 'acted',
      action_taken: body.action === 'act' ? (body.notes || '') : null,
    })
  } catch (error) {
    console.error('[Intel Action POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}
