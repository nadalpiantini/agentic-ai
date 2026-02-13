import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { createCompiledGraph } from "@/lib/agent/graph";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { message, threadId, model } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    if (!threadId || typeof threadId !== "string") {
      return NextResponse.json(
        { error: "threadId is required" },
        { status: 400 }
      );
    }

    const graph = await createCompiledGraph();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const eventStream = await graph.stream(
            {
              messages: [new HumanMessage(message)],
              ...(model ? { currentModel: model } : {}),
            },
            {
              configurable: { thread_id: threadId },
              streamMode: "updates",
            }
          );

          for await (const event of eventStream) {
            const data = JSON.stringify(event);
            controller.enqueue(
              encoder.encode(`data: ${data}\n\n`)
            );
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
