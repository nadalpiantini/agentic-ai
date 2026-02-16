/**
 * SSE Streaming Endpoint for Agent Execution
 *
 * POST /api/agent/stream
 *
 * Streams agent responses in real-time using Server-Sent Events (SSE).
 * Each event contains a chunk of the agent's response as it's generated.
 *
 * Request body:
 * - threadId: string - Thread ID (creates new if omitted)
 * - messages: Array<{role: string, content: string}> - Conversation history
 *
 * Response: SSE stream with events:
 * - data: JSON-encoded chunks with message content
 */
import { NextRequest } from 'next/server'
import { requireUserId } from '@/lib/supabase/server'
import { agentGraph } from '@/lib/agent/graph'
import { HumanMessage } from '@langchain/core/messages'

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireUserId()

    // Parse request body
    const body = await req.json()
    const { threadId, messages } = body

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    // Convert messages to LangChain format
    const langchainMessages = messages.map((msg: any) => {
      if (msg.role === 'user') {
        return new HumanMessage(msg.content)
      }
      // TODO: Handle other message types (assistant, system, tool)
      throw new Error(`Unsupported message role: ${msg.role}`)
    })

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Invoke agent graph
          const result = await agentGraph.invoke({
            messages: langchainMessages,
            llmCalls: 0,
            selectedModel: 'claude', // Default model
            contextStack: [],
          })

          // Stream each message in the result
          for (const message of result.messages) {
            const chunk = {
              type: 'message',
              content: message.content,
              role: message.getType(),
            }

            // Send SSE event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            )
          }

          // Send done event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))
          controller.close()
        } catch (error) {
          console.error('[Agent Stream] Error:', error)
          const errorChunk = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          }
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`)
          )
          controller.close()
        }
      },
    })

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[Agent Stream] Auth error:', error)
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }
}
