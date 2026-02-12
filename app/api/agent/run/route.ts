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

    const result = await graph.invoke(
      {
        messages: [new HumanMessage(message)],
        ...(model ? { currentModel: model } : {}),
      },
      {
        configurable: { thread_id: threadId },
      }
    );

    const lastMessage = result.messages[result.messages.length - 1];

    return NextResponse.json({
      threadId,
      message: {
        role: "assistant",
        content: typeof lastMessage.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage.content),
      },
      llmCalls: result.llmCalls,
      model: result.currentModel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
