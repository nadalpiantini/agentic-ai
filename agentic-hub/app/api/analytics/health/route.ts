import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createServerClient(url, serviceRoleKey);
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Get health summary from database
    const { data: healthData, error: healthError } = await supabase
      .from("database_health")
      .select("*")
      .order("checked_at", { ascending: false })
      .limit(1);

    if (healthError) throw healthError;

    const latestHealth = healthData?.[0];

    // Get error count from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentErrors, error: errorsError } = await supabase
      .from("activity_logs")
      .select("id")
      .eq("event_type", "error")
      .gte("created_at", oneDayAgo);

    if (errorsError) throw errorsError;

    // Get API request stats from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentRequests, error: requestsError } = await supabase
      .from("api_requests")
      .select("status_code, duration_ms")
      .gte("created_at", oneHourAgo);

    if (requestsError) throw requestsError;

    const avgDuration =
      recentRequests && recentRequests.length > 0
        ? recentRequests.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / recentRequests.length
        : 0;

    const errorCount = recentRequests?.filter((r) => (r.status_code || 0) >= 400).length || 0;

    const health = {
      status: latestHealth?.status || "unknown",
      timestamp: latestHealth?.checked_at || new Date().toISOString(),
      metrics: {
        databaseConnections: latestHealth?.connection_count || 0,
        tableSize: latestHealth?.total_size_bytes || 0,
        recentErrors: recentErrors?.length || 0,
        avgResponseTime: Math.round(avgDuration),
        errorRate: recentRequests
          ? Math.round((errorCount / recentRequests.length) * 100)
          : 0,
      },
      checks: {
        database: latestHealth?.status === "healthy" ? "pass" : "fail",
        replicationLag: (latestHealth?.replication_lag_ms || 0) < 1000 ? "pass" : "warn",
        diskSpace: (latestHealth?.disk_available_bytes || 0) > 1000000000 ? "pass" : "warn",
      },
    };

    return NextResponse.json(health);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch health status";
    return NextResponse.json(
      {
        status: "unhealthy",
        error: message,
      },
      { status: 500 }
    );
  }
}
