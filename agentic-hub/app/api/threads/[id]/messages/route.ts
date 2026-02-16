/**
 * Thread Messages API Route
 *
 * GET /api/threads/[id]/messages - Get all messages for a thread
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/threads/[id]/messages
 *
 * Get all messages for a specific thread
 *
 * Query params:
 * - limit: number - Maximum messages to return (default: 100)
 * - offset: number - Pagination offset (default: 0)
 *
 * Response: JSON array of messages ordered by created_at
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createClient()
    const threadId = params.id

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
