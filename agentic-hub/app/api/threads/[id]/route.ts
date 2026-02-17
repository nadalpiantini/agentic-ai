/**
 * Single Thread API Routes
 *
 * GET /api/threads/[id] - Get a specific thread
 * PATCH /api/threads/[id] - Update a thread
 * DELETE /api/threads/[id] - Delete a thread
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireUserId, createAdminClient } from '@/lib/supabase/server'


/**
 * GET /api/threads/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createAdminClient()
    const { id: threadId } = await params

    const { data: thread, error } = await supabase
      .from('threads')
      .select()
      .eq('id', threadId)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[Thread GET] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch thread' },
        { status: 500 }
      )
    }

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(thread)
  } catch (error) {
    console.error('[Thread GET] Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}

/**
 * PATCH /api/threads/[id]
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createAdminClient()
    const { id: threadId } = await params

    const body = await req.json()
    const { title } = body

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase SSR types don't resolve Update generics
    const { data: thread, error } = await (supabase.from('threads') as any)
      .update(updateData)
      .eq('id', threadId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('[Thread PATCH] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update thread' },
        { status: 500 }
      )
    }

    if (!thread) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(thread)
  } catch (error) {
    console.error('[Thread PATCH] Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}

/**
 * DELETE /api/threads/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createAdminClient()
    const { id: threadId } = await params

    const { error } = await supabase
      .from('threads')
      .delete()
      .eq('id', threadId)
      .eq('user_id', userId)

    if (error) {
      console.error('[Thread DELETE] Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete thread' },
        { status: 500 }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[Thread DELETE] Auth error:', error)
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}
