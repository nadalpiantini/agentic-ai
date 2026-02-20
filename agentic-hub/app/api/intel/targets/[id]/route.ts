/**
 * Intel Target Patch API Route
 *
 * PATCH /api/intel/targets/[id]
 * Body: { active: boolean }
 *
 * Toggles the active status of a monitoring target in Supabase.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetId } = await params
    const body = await req.json()

    if (typeof body.active !== 'boolean') {
      return NextResponse.json(
        { error: 'active field (boolean) is required' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase types don't resolve Update generics for intel_targets
    const { data: target, error } = await (supabaseAdmin.from('intel_targets') as any)
      .update({ active: body.active })
      .eq('id', targetId)
      .select()
      .single()

    if (error) {
      console.error('[Intel Target PATCH] Database error:', JSON.stringify(error))

      // Supabase returns PGRST116 when no rows match
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Target not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to update target' },
        { status: 500 }
      )
    }

    if (!target) {
      return NextResponse.json(
        { error: 'Target not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(target)
  } catch (error) {
    console.error('[Intel Target PATCH] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update target' },
      { status: 500 }
    )
  }
}
