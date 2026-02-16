/**
 * Threads API Routes
 *
 * GET /api/threads - List all threads for current user
 * POST /api/threads - Create a new thread
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/threads
 *
 * List all threads for the authenticated user
 *
 * Query params:
 * - limit: number - Maximum threads to return (default: 50)
 * - offset: number - Pagination offset (default: 0)
 *
 * Response: JSON array of threads
 */
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId()
    const supabase = await createClient()

    // Parse query params
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
    const offset = Number(searchParams.get('offset')) || 0

    // Fetch threads with message count
    const { data: threads, error } = await supabase
      .from('threads')
      .select(
        `
        *,
        messages(count)
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Threads GET] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch threads' },
        { status: 500 }
      )
    }

    // Transform message count to flat property
    const transformedThreads = threads?.map((thread: any) => ({
      ...thread,
      messageCount: thread.messages?.[0]?.count || 0,
    })) || []

    return NextResponse.json(transformedThreads)
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
 *
 * Create a new thread for the authenticated user
 *
 * Request body:
 * - title: string - Optional thread title
 * - metadata: object - Optional metadata
 *
 * Response: JSON object with created thread
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId()
    const supabase = await createClient()

    // Parse request body
    const body = await req.json()
    const { title, metadata } = body

    // Create thread
    const { data: thread, error } = await (supabase.from('threads') as any)
      .insert({
        user_id: userId,
        title: title || null,
        metadata: metadata || {},
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
