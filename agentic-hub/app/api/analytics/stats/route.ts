import { NextRequest, NextResponse } from "next/server";
import { SessionTracker } from "@/lib/utils/session-tracker";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 401 });
    }

    const timeRange = (req.nextUrl.searchParams.get("range") as "1h" | "24h" | "7d" | "30d") || "24h";

    const stats = await SessionTracker.getSessionStats(userId, timeRange);

    return NextResponse.json({
      userId,
      timeRange,
      ...stats,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
