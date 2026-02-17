import { createClient as createServerClient } from "@supabase/supabase-js";

interface SessionEvent {
  type:
    | "session_start"
    | "session_end"
    | "thread_created"
    | "message_sent"
    | "tool_executed"
    | "error_occurred"
    | "model_selected";
  userId: string;
  threadId?: string;
  metadata?: Record<string, unknown>;
}

interface ActivityLogRow {
  event_type: string;
  created_at: string;
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

export class SessionTracker {
  static async trackEvent(event: SessionEvent): Promise<void> {
    const supabase = getSupabaseClient();

    try {
      const eventTypeMap: Record<SessionEvent["type"], string> = {
        session_start: "session_start",
        session_end: "session_end",
        thread_created: "thread_created",
        message_sent: "message_sent",
        tool_executed: "tool_executed",
        error_occurred: "error",
        model_selected: "model_selected",
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase untyped client for activity_logs
      await (supabase.from("activity_logs") as any)
        .insert({
          event_type: eventTypeMap[event.type],
          user_id: event.userId,
          thread_id: event.threadId,
          metadata: {
            event_type: event.type,
            ...event.metadata,
          },
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error("[SessionTracker] Failed to track event:", error);
    }
  }

  static async getUserActivity(
    userId: string,
    options: {
      threadId?: string;
      limit?: number;
      offset?: number;
      eventTypes?: string[];
    } = {}
  ) {
    const supabase = getSupabaseClient();
    const { threadId, limit = 50, offset = 0, eventTypes } = options;

    try {
      let query = supabase
        .from("activity_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (threadId) {
        query = query.eq("thread_id", threadId);
      }

      if (eventTypes && eventTypes.length > 0) {
        query = query.in("event_type", eventTypes);
      }

      const { data, error } = (await query) as { data: ActivityLogRow[] | null; error: unknown };

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[SessionTracker] Failed to get user activity:", error);
      return [];
    }
  }

  static async getSessionStats(
    userId: string,
    timeRange: "1h" | "24h" | "7d" | "30d" = "24h"
  ) {
    const supabase = getSupabaseClient();

    const hoursBack = timeRange === "1h" ? 1 : timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;
    const thresholdTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();

    try {
      const { data, error } = (await supabase
        .from("activity_logs")
        .select("event_type, created_at")
        .eq("user_id", userId)
        .gte("created_at", thresholdTime)) as { data: ActivityLogRow[] | null; error: unknown };

      if (error) throw error;

      const logs = data || [];
      const stats = {
        totalEvents: logs.length,
        eventBreakdown: {} as Record<string, number>,
        lastActivity: null as string | null,
      };

      logs.forEach((log) => {
        stats.eventBreakdown[log.event_type] = (stats.eventBreakdown[log.event_type] || 0) + 1;
      });

      if (logs.length > 0) {
        stats.lastActivity = logs[0].created_at;
      }

      return stats;
    } catch (error) {
      console.error("[SessionTracker] Failed to get session stats:", error);
      return {
        totalEvents: 0,
        eventBreakdown: {},
        lastActivity: null,
      };
    }
  }
}
