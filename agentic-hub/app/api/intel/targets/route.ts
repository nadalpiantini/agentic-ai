/**
 * Intel Targets API Routes
 *
 * GET  /api/intel/targets        — List all targets from Supabase
 * POST /api/intel/targets        — Add a new target manually
 *
 * Targets represent domains, repos, or APIs monitored by the NRS scanner.
 * Stored in Supabase (not SQLite) for cross-system accessibility.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/intel/targets
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'
    const targetType = searchParams.get('type')
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

    let query = supabaseAdmin
      .from('intel_targets')
      .select('*')
      .order('discovered_at', { ascending: false })
      .limit(limit)

    if (activeOnly) {
      query = query.eq('active', true)
    }

    if (targetType) {
      query = query.eq('target_type', targetType)
    }

    const { data: targets, error } = await query

    if (error) {
      console.error('[Intel Targets GET] Database error:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'Failed to fetch targets' },
        { status: 500 }
      )
    }

    return NextResponse.json(targets || [])
  } catch (error) {
    console.error('[Intel Targets GET] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch targets' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/intel/targets
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { target_type, identifier, category, note, source } = body as {
      target_type: 'domain' | 'repo' | 'api'
      identifier: string
      category?: string
      note?: string
      source?: string
    }

    // Validate required fields
    if (!target_type || !identifier) {
      return NextResponse.json(
        { error: 'target_type and identifier are required' },
        { status: 400 }
      )
    }

    if (!['domain', 'repo', 'api'].includes(target_type)) {
      return NextResponse.json(
        { error: 'target_type must be one of: domain, repo, api' },
        { status: 400 }
      )
    }

    // Check for duplicate identifier
    const { data: existing } = await supabaseAdmin
      .from('intel_targets')
      .select('id')
      .eq('identifier', identifier)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: `Target with identifier "${identifier}" already exists` },
        { status: 409 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase types don't resolve Insert generics for intel_targets
    const { data: target, error } = await (supabaseAdmin.from('intel_targets') as any)
      .insert({
        target_type,
        identifier,
        category: category || 'general',
        note: note || null,
        source: source || 'manual',
        discovered_at: new Date().toISOString(),
        scan_count: 0,
        active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('[Intel Targets POST] Database error:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'Failed to create target' },
        { status: 500 }
      )
    }

    return NextResponse.json(target, { status: 201 })
  } catch (error) {
    console.error('[Intel Targets POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create target' },
      { status: 500 }
    )
  }
}
