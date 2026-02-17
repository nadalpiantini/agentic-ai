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
 * - selectedModel: "claude" | "deepseek" | "ollama" - Model selection
 *
 * Response: SSE stream with events:
 * - data: JSON-encoded chunks with message content
 */

export const dynamic = 'force-dynamic';

import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/supabase/server";
import { agentGraph } from "@/lib/agent/graph";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

interface MessageInput {
  role: string;
  content: string;
  name?: string;
  toolCallId?: string;
}

interface StreamChunk {
  type: "token" | "tool_start" | "tool_end" | "done" | "error";
  content?: string;
  tool?: string;
  input?: string;
  error?: string;
  llmCalls?: number;
  selectedModel?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user (currently unused but required for auth)
    await requireUserId();

    // Parse request body
    const body = await req.json();
    const { messages, selectedModel } = body;

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Convert messages to LangChain format
    const langchainMessages = messages.map((msg: MessageInput) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else if (msg.role === "assistant") {
        return new AIMessage(msg.content);
      } else if (msg.role === "tool") {
        return new ToolMessage({ content: msg.content, name: msg.name || "unknown", tool_call_id: msg.toolCallId || "" });
      }
      throw new Error(`Unsupported message role: ${msg.role}`);
    });

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("[Agent Stream] Starting agent execution with model:", selectedModel || "auto");

          // Invoke agent graph with streaming callback
          const result = await agentGraph.invoke(
            {
              messages: langchainMessages,
              llmCalls: 0,
              selectedModel: selectedModel || "claude",
              contextStack: [],
            },
            {
              callbacks: [
                {
                  handleLLMNewToken(token: string) {
                    // Stream each token as it's generated
                    const chunk: StreamChunk = {
                      type: "token",
                      content: token,
                    };

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                  },
                  handleLLMEnd() {
                    console.log("[Agent Stream] LLM generation complete");
                  },
                  handleToolStart(tool: unknown, input: string) {
                    // Notify that a tool is being executed
                    const toolName = typeof tool === "string" ? tool : (tool as { name?: string }).name || "unknown";
                    const chunk: StreamChunk = {
                      type: "tool_start",
                      tool: toolName,
                      input,
                    };

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                  },
                  handleToolEnd(tool: unknown) {
                    // Notify that tool execution is complete
                    const toolName = typeof tool === "string" ? tool : (tool as { name?: string }).name || "unknown";
                    const chunk: StreamChunk = {
                      type: "tool_end",
                      tool: toolName,
                    };

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                  },
                },
              ],
            }
          );

          console.log("[Agent Stream] Agent execution complete");

          // Send final messages (non-streamed)
          for (const message of result.messages) {
            // Skip messages that were already streamed
            if (message.getType() === "human") continue;

            const chunk: StreamChunk = {
              type: "done",
            };

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          }

          // Send done event with final state
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                llmCalls: result.llmCalls,
                selectedModel: result.selectedModel,
              } satisfies StreamChunk)}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("[Agent Stream] Error:", error);
          const errorChunk: StreamChunk = {
            type: "error",
            error: error instanceof Error ? error.message : "Unknown error",
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Agent Stream] Auth error:", error);
    return Response.json({ error: "Authentication required" }, { status: 401 });
  }
}
