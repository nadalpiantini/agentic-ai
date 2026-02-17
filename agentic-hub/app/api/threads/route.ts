/**
 * Threads API Routes
 *
 * GET /api/threads - List all threads for current user
 * POST /api/threads - Create a new thread
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireUserId, createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/threads
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId()
    const supabase = await createAdminClient()

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
    const offset = Number(searchParams.get('offset')) || 0

    const { data: threads, error } = await supabase
      .from('threads')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Threads GET] Database error:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      )
    }

    return NextResponse.json(threads || [])
  } catch (error) {
    console.error('[Threads GET] Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}

/**
 * POST /api/threads
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId()
    const supabase = await createAdminClient()

    const body = await req.json()
    const { title } = body

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase SSR types don't resolve Insert generics
    const { data: thread, error } = await (supabase.from('threads') as any)
      .insert({
        user_id: userId,
        title: title || 'New Thread',
      })
      .select()
      .single()

    if (error) {
      console.error('[Threads POST] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create thread' },
        { status: 500 }
      )
    }

    return NextResponse.json(thread, { status: 201 })
  } catch (error) {
    console.error('[Threads POST] Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}
