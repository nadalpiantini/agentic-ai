/**
 * Single Thread API Routes
 *
 * GET /api/threads/[id] - Get a specific thread
 * PATCH /api/threads/[id] - Update a thread
 * DELETE /api/threads/[id] - Delete a thread
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireUserId } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

interface ThreadRow {
  id: string
  user_id: string
  title: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

/**
 * GET /api/threads/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createClient()
    const threadId = params.id

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
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createClient()
    const threadId = params.id

    const body = await req.json()
    const { title, metadata } = body

    const updateData: Partial<Pick<ThreadRow, 'title' | 'metadata'>> = {}
    if (title !== undefined) updateData.title = title
    if (metadata !== undefined) updateData.metadata = metadata

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase SSR types don't resolve Update generics
    const { data: thread, error } = await (supabase.from('threads') as any)
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
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
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createClient()
    const threadId = params.id

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
