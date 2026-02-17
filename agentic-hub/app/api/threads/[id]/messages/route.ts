/**
 * Thread Messages API Route
 *
 * GET /api/threads/[id]/messages - Get all messages for a thread
 * POST /api/threads/[id]/messages - Create a new message in a thread
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireUserId, createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/threads/[id]/messages
 *
 * Get all messages for a specific thread
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createAdminClient()
    const { id: threadId } = await params

    // Verify thread belongs to user
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('id')
      .eq('id', threadId)
      .eq('user_id', userId)
      .single()

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)
    const offset = Number(searchParams.get('offset')) || 0

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('messages')
      .select()
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('[Messages GET] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json(messages || [])
  } catch (error) {
    console.error('[Messages GET] Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}

/**
 * POST /api/threads/[id]/messages
 *
 * Create a new message in a thread
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createAdminClient()
    const { id: threadId } = await params

    // Verify thread belongs to user
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .select('id')
      .eq('id', threadId)
      .eq('user_id', userId)
      .single()

    if (threadError || !thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const { role, content } = body

    if (!role || !content) {
      return NextResponse.json(
        { error: 'role and content are required' },
        { status: 400 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase SSR types don't resolve Insert generics
    const { data: message, error } = await (supabase.from('messages') as any)
      .insert({
        thread_id: threadId,
        user_id: userId,
        role,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error('[Messages POST] Insert error:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'Failed to create message', dbError: JSON.stringify(error) },
        { status: 500 }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase SSR types don't resolve Update generics
    await (supabase.from('threads') as any)
      .update({ updated_at: new Date().toISOString() })
      .eq('id', threadId)

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('[Messages POST] Unhandled error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Internal server error', details: msg },
      { status: 500 }
    )
  }
}
