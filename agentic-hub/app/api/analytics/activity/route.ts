import { NextRequest, NextResponse } from "next/server";
import { SessionTracker } from "@/lib/utils/session-tracker";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 });
    }

    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "50");
    const offset = parseInt(req.nextUrl.searchParams.get("offset") || "0");
    const threadId = req.nextUrl.searchParams.get("threadId") || undefined;

    const activity = await SessionTracker.getUserActivity(userId, {
      limit,
      offset,
      threadId,
    });

    return NextResponse.json({
      activity,
      pagination: {
        limit,
        offset,
        hasMore: activity.length === limit,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
