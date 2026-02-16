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
import { NextRequest } from "next/server";
import { requireUserId } from "@/lib/supabase/server";
import { agentGraph } from "@/lib/agent/graph";
import { HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const userId = await requireUserId();

    // Parse request body
    const body = await req.json();
    const { threadId, messages, selectedModel } = body;

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Convert messages to LangChain format
    const langchainMessages = messages.map((msg: any) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else if (msg.role === "assistant") {
        return new AIMessage(msg.content);
      } else if (msg.role === "tool") {
        return new ToolMessage({ content: msg.content, name: msg.name, tool_call_id: msg.toolCallId });
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
                    const chunk = {
                      type: "token",
                      content: token,
                    };

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                  },
                  handleLLMEnd(output: any) {
                    console.log("[Agent Stream] LLM generation complete");
                  },
                  handleToolStart(tool: any, input: any) {
                    // Notify that a tool is being executed
                    const toolName = typeof tool === "string" ? tool : tool.name || "unknown";
                    const chunk = {
                      type: "tool_start",
                      tool: toolName,
                      input,
                    };

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                  },
                  handleToolEnd(tool: any, output: any) {
                    // Notify that tool execution is complete
                    const toolName = typeof tool === "string" ? tool : tool.name || "unknown";
                    const chunk = {
                      type: "tool_end",
                      tool: toolName,
                      output,
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

            const chunk = {
              type: "message",
              content: message.content,
              role: message.getType(),
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
              })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("[Agent Stream] Error:", error);
          const errorChunk = {
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
