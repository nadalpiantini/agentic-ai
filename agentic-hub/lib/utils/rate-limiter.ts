import { createClient as createServerClient } from "@supabase/supabase-js";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000,
};

interface RateLimitRow {
  user_id: string;
  endpoint: string;
  request_count: number;
  reset_at: string;
  metadata: unknown;
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

export class RateLimiter {
  static async checkLimit(
    userId: string,
    config: Partial<RateLimitConfig> = {}
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
  }> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const supabase = getSupabaseClient();

    try {
      const { data: existing, error: fetchError } = (await supabase
        .from("rate_limits")
        .select("*")
        .eq("user_id", userId)
        .eq("endpoint", "global")
        .single()) as { data: RateLimitRow | null; error: { code?: string; message?: string } | null };

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      const now = Date.now();

      if (!existing || new Date(existing.reset_at).getTime() < now) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase untyped client for rate_limits
        await (supabase.from("rate_limits") as any).upsert({
          user_id: userId,
          endpoint: "global",
          request_count: 1,
          reset_at: new Date(now + finalConfig.windowMs).toISOString(),
          metadata: { config: finalConfig },
        });

        return {
          allowed: true,
          remaining: finalConfig.maxRequests - 1,
          resetAt: now + finalConfig.windowMs,
        };
      }

      if (existing.request_count >= finalConfig.maxRequests) {
        const retryAfter = Math.ceil(
          (new Date(existing.reset_at).getTime() - now) / 1000
        );

        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(existing.reset_at).getTime(),
          retryAfter,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase untyped client for rate_limits
      await (supabase.from("rate_limits") as any)
        .update({ request_count: existing.request_count + 1 })
        .eq("user_id", userId)
        .eq("endpoint", "global");

      return {
        allowed: true,
        remaining: finalConfig.maxRequests - existing.request_count - 1,
        resetAt: new Date(existing.reset_at).getTime(),
      };
    } catch (error) {
      console.error("[RateLimiter] Error checking limit:", error);
      return {
        allowed: true,
        remaining: finalConfig.maxRequests,
        resetAt: Date.now() + finalConfig.windowMs,
      };
    }
  }

  static async checkEndpointLimit(
    userId: string,
    endpoint: string,
    config: Partial<RateLimitConfig> = {}
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    retryAfter?: number;
  }> {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const supabase = getSupabaseClient();

    try {
      const { data: existing, error: fetchError } = (await supabase
        .from("rate_limits")
        .select("*")
        .eq("user_id", userId)
        .eq("endpoint", endpoint)
        .single()) as { data: RateLimitRow | null; error: { code?: string; message?: string } | null };

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      const now = Date.now();

      if (!existing || new Date(existing.reset_at).getTime() < now) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase untyped client for rate_limits
        await (supabase.from("rate_limits") as any).upsert({
          user_id: userId,
          endpoint: endpoint,
          request_count: 1,
          reset_at: new Date(now + finalConfig.windowMs).toISOString(),
          metadata: { config: finalConfig },
        });

        return {
          allowed: true,
          remaining: finalConfig.maxRequests - 1,
          resetAt: now + finalConfig.windowMs,
        };
      }

      if (existing.request_count >= finalConfig.maxRequests) {
        const retryAfter = Math.ceil(
          (new Date(existing.reset_at).getTime() - now) / 1000
        );

        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(existing.reset_at).getTime(),
          retryAfter,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase untyped client for rate_limits
      await (supabase.from("rate_limits") as any)
        .update({ request_count: existing.request_count + 1 })
        .eq("user_id", userId)
        .eq("endpoint", endpoint);

      return {
        allowed: true,
        remaining: finalConfig.maxRequests - existing.request_count - 1,
        resetAt: new Date(existing.reset_at).getTime(),
      };
    } catch (error) {
      console.error("[RateLimiter] Error checking endpoint limit:", error);
      return {
        allowed: true,
        remaining: finalConfig.maxRequests,
        resetAt: Date.now() + finalConfig.windowMs,
      };
    }
  }
}
