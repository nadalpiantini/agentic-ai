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
import type { Json } from '@/types/supabase'

/**
 * GET /api/threads/[id]
 *
 * Get a specific thread by ID
 *
 * Response: JSON object with thread data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createClient()
    const threadId = params.id

    // Fetch thread
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
 *
 * Update a thread (title, metadata)
 *
 * Request body:
 * - title: string - Optional new title
 * - metadata: object - Optional new metadata
 *
 * Response: JSON object with updated thread
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createClient()
    const threadId = params.id

    // Parse request body
    const body = await req.json()
    const { title, metadata } = body

    // Build update object with proper typing
    const updateData: {
      title?: string | null
      metadata?: Json
    } = {}
    if (title !== undefined) updateData.title = title
    if (metadata !== undefined) updateData.metadata = metadata

    // Update thread
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
 *
 * Delete a thread and all its messages
 *
 * Response: 204 No Content
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId()
    const supabase = await createClient()
    const threadId = params.id

    // Delete thread (messages will be deleted by cascade)
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
