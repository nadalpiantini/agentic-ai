import { NextRequest, NextResponse } from "next/server";
import { getGlobalScheduler } from "@/lib/agent/scheduler";

export const dynamic = "force-dynamic";

/**
 * POST /api/schedule
 * Schedule a new task for an agent
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, threadId, scheduledFor, taskType, payload, maxRetries } = body;

    if (!agentId || !threadId || !scheduledFor || !taskType) {
      return NextResponse.json(
        { error: "Missing required fields: agentId, threadId, scheduledFor, taskType" },
        { status: 400 }
      );
    }

    const scheduler = getGlobalScheduler();
    const taskId = await scheduler.schedule(agentId, threadId, {
      scheduledFor,
      taskType,
      payload,
      maxRetries,
    });

    return NextResponse.json({ taskId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/schedule
 * Get scheduler statistics and tasks for a thread
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get("threadId");
    const action = searchParams.get("action");

    const scheduler = getGlobalScheduler();

    if (action === "stats") {
      const stats = await scheduler.getStats();
      return NextResponse.json({ stats });
    }

    if (action === "start") {
      await scheduler.start();
      return NextResponse.json({ message: "Scheduler started" });
    }

    if (action === "stop") {
      await scheduler.stop();
      return NextResponse.json({ message: "Scheduler stopped" });
    }

    if (threadId) {
      const tasks = await scheduler.getTasksForThread(threadId);
      return NextResponse.json({ tasks });
    }

    // Default: return stats
    const stats = await scheduler.getStats();
    return NextResponse.json({ stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/schedule
 * Cancel a scheduled task or cleanup old tasks
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const cleanupDays = searchParams.get("cleanup");

    const scheduler = getGlobalScheduler();

    if (taskId) {
      const cancelled = await scheduler.cancel(taskId);
      if (!cancelled) {
        return NextResponse.json(
          { error: "Task not found or cannot be cancelled" },
          { status: 404 }
        );
      }
      return NextResponse.json({ message: "Task cancelled" });
    }

    if (cleanupDays) {
      const days = parseInt(cleanupDays, 10);
      const deleted = await scheduler.cleanup(days);
      return NextResponse.json({ deleted });
    }

    return NextResponse.json(
      { error: "Must specify taskId or cleanup parameter" },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
