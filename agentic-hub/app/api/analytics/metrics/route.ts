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
    const timeRange = req.nextUrl.searchParams.get("range") || "24h";

    // Calculate time threshold
    let hoursBack = 24;
    if (timeRange === "7d") hoursBack = 168;
    if (timeRange === "30d") hoursBack = 720;
    if (timeRange === "1h") hoursBack = 1;

    const thresholdTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    // Get API request metrics
    const { data: requests, error: requestsError } = await supabase
      .from("api_requests")
      .select("status_code, duration_ms, method, path")
      .gte("created_at", thresholdTime);

    if (requestsError) throw requestsError;

    // Get error metrics
    const { data: errors, error: errorsError } = await supabase
      .from("activity_logs")
      .select("metadata")
      .eq("event_type", "error")
      .gte("created_at", thresholdTime);

    if (errorsError) throw errorsError;

    // Get performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from("metrics")
      .select("metric_name, metric_value, unit")
      .gte("recorded_at", thresholdTime);

    if (metricsError) throw metricsError;

    // Calculate aggregates
    const totalRequests = requests?.length || 0;
    const totalErrors = errors?.length || 0;
    const avgResponseTime = requests
      ? Math.round(
          requests.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / Math.max(totalRequests, 1)
        )
      : 0;

    // Group by status code
    const statusCodeDistribution: Record<number, number> = {};
    requests?.forEach((r) => {
      const code = r.status_code || 500;
      statusCodeDistribution[code] = (statusCodeDistribution[code] || 0) + 1;
    });

    // Group by endpoint
    const endpointMetrics: Record<string, { count: number; avgTime: number }> = {};
    requests?.forEach((r) => {
      const endpoint = r.path || "unknown";
      if (!endpointMetrics[endpoint]) {
        endpointMetrics[endpoint] = { count: 0, avgTime: 0 };
      }
      endpointMetrics[endpoint].count += 1;
      endpointMetrics[endpoint].avgTime = Math.round(
        (endpointMetrics[endpoint].avgTime * (endpointMetrics[endpoint].count - 1) +
          (r.duration_ms || 0)) /
          endpointMetrics[endpoint].count
      );
    });

    // Get error severity distribution
    const errorsBySeverity: Record<string, number> = {};
    errors?.forEach((e) => {
      const severity = (e.metadata as Record<string, unknown>)?.severity || "unknown";
      errorsBySeverity[String(severity)] = (errorsBySeverity[String(severity)] || 0) + 1;
    });

    return NextResponse.json({
      timeRange,
      summary: {
        totalRequests,
        totalErrors,
        errorRate: totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 100) : 0,
        avgResponseTime,
      },
      distribution: {
        byStatusCode: statusCodeDistribution,
        byEndpoint: endpointMetrics,
        errorsBySeverity,
      },
      topMetrics: (metrics || [])
        .slice(0, 10)
        .reduce((acc: Record<string, number>, m) => {
          acc[m.metric_name] = Math.round(m.metric_value);
          return acc;
        }, {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch metrics";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
