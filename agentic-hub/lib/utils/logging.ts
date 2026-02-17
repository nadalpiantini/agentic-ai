import { createClient as createServerClient } from "@supabase/supabase-js";

interface LogContext {
  userId?: string;
  threadId?: string;
  requestId: string;
  method: string;
  path: string;
  timestamp: number;
  duration?: number;
  statusCode?: number;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

interface RequestLog extends LogContext {
  type: "request";
  body?: Record<string, unknown>;
  response?: Record<string, unknown>;
}

interface ErrorLog extends LogContext {
  type: "error";
  error: string;
  stack?: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface MetricLog extends LogContext {
  type: "metric";
  metric: string;
  value: number;
  unit: string;
}

let supabaseClient: ReturnType<typeof createServerClient> | null = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    supabaseClient = createServerClient(url, serviceRoleKey);
  }
  return supabaseClient;
}

export class Logger {
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async logRequest(
    context: Omit<LogContext, "metadata">,
    body?: Record<string, unknown>
  ) {
    const entry: RequestLog = {
      ...context,
      type: "request",
      body: body,
    };

    console.log(
      `[${entry.method} ${entry.path}] ${entry.requestId}`,
      {
        userId: entry.userId,
        threadId: entry.threadId,
        timestamp: new Date(entry.timestamp).toISOString(),
      }
    );

    try {
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase untyped client for logging tables
      await (supabase.from("api_requests") as any)
        .insert({
          request_id: entry.requestId,
          method: entry.method,
          path: entry.path,
          user_id: entry.userId,
          thread_id: entry.threadId,
          status_code: entry.statusCode || 0,
          duration_ms: entry.duration || 0,
          metadata: {
            body: entry.body,
            response: entry.response,
            ...entry.metadata,
          },
          created_at: new Date(entry.timestamp).toISOString(),
        });
    } catch (err) {
      console.error("[Logger] Failed to log request:", err);
    }
  }

  static async logError(
    context: Omit<LogContext, "metadata">,
    error: Error | string,
    severity: "low" | "medium" | "high" | "critical" = "medium"
  ) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const entry: ErrorLog = {
      ...context,
      type: "error",
      error: errorMessage,
      stack: stack,
      severity: severity,
    };

    console.error(
      `[${severity.toUpperCase()}] ${entry.method} ${entry.path} - ${errorMessage}`,
      {
        requestId: entry.requestId,
        userId: entry.userId,
        timestamp: new Date(entry.timestamp).toISOString(),
      }
    );

    try {
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase untyped client for logging tables
      await (supabase.from("activity_logs") as any)
        .insert({
          event_type: "error",
          user_id: entry.userId,
          thread_id: entry.threadId,
          metadata: {
            request_id: entry.requestId,
            method: entry.method,
            path: entry.path,
            error: errorMessage,
            stack: stack,
            severity: severity,
            ...entry.metadata,
          },
          created_at: new Date(entry.timestamp).toISOString(),
        });
    } catch (err) {
      console.error("[Logger] Failed to log error:", err);
    }
  }

  static async logMetric(
    context: Omit<LogContext, "metadata">,
    metric: string,
    value: number,
    unit: string
  ) {
    const entry: MetricLog = {
      ...context,
      type: "metric",
      metric: metric,
      value: value,
      unit: unit,
    };

    try {
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase untyped client for logging tables
      await (supabase.from("metrics") as any)
        .insert({
          metric_name: entry.metric,
          metric_value: entry.value,
          unit: entry.unit,
          user_id: entry.userId,
          thread_id: entry.threadId,
          metadata: {
            request_id: entry.requestId,
            ...entry.metadata,
          },
          recorded_at: new Date(entry.timestamp).toISOString(),
        });
    } catch (err) {
      console.error("[Logger] Failed to log metric:", err);
    }
  }
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("password")) return "Authentication error";
    if (error.message.includes("API key")) return "Service configuration error";
    return error.message;
  }
  return "An unexpected error occurred";
}
