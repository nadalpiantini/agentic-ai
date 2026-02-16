import { createClient as createServerClient } from "@supabase/supabase-js";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
};

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

    const windowStart = new Date(Date.now() - finalConfig.windowMs).toISOString();

    try {
      // Get or create rate limit record
      const { data: existing, error: fetchError } = (await supabase
        .from("rate_limits")
        .select("*")
        .eq("user_id", userId)
        .eq("endpoint", "global")
        .single()) as any;

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      const now = Date.now();
      const resetAt = existing
        ? new Date(existing.reset_at).getTime()
        : now + finalConfig.windowMs;

      // If window has reset, create new record
      if (!existing || new Date(existing.reset_at).getTime() < now) {
        // @ts-ignore - Supabase types not fully compatible
        const upsertData = {
          user_id: userId,
          endpoint: "global",
          request_count: 1,
          reset_at: new Date(now + finalConfig.windowMs).toISOString(),
          metadata: {
            config: finalConfig,
          },
        };
        // @ts-ignore
        await supabase.from("rate_limits").upsert(upsertData);

        return {
          allowed: true,
          remaining: finalConfig.maxRequests - 1,
          resetAt: now + finalConfig.windowMs,
        };
      }

      // Check if limit exceeded
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

      // Increment counter
      await supabase
        .from("rate_limits")
        // @ts-ignore - Supabase types not fully compatible
        .update({
          request_count: existing.request_count + 1,
        })
        .eq("user_id", userId)
        .eq("endpoint", "global");

      return {
        allowed: true,
        remaining: finalConfig.maxRequests - existing.request_count - 1,
        resetAt: new Date(existing.reset_at).getTime(),
      };
    } catch (error) {
      console.error("[RateLimiter] Error checking limit:", error);
      // On error, allow request but log it
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
        .single()) as any;

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      const now = Date.now();
      const resetAt = existing
        ? new Date(existing.reset_at).getTime()
        : now + finalConfig.windowMs;

      // If window has reset, create new record
      if (!existing || new Date(existing.reset_at).getTime() < now) {
        // @ts-ignore - Supabase types not fully compatible
        const upsertData = {
          user_id: userId,
          endpoint: endpoint,
          request_count: 1,
          reset_at: new Date(now + finalConfig.windowMs).toISOString(),
          metadata: {
            config: finalConfig,
          },
        };
        // @ts-ignore
        await supabase.from("rate_limits").upsert(upsertData);

        return {
          allowed: true,
          remaining: finalConfig.maxRequests - 1,
          resetAt: now + finalConfig.windowMs,
        };
      }

      // Check if limit exceeded
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

      // Increment counter
      await supabase
        .from("rate_limits")
        // @ts-ignore - Supabase types not fully compatible
        .update({
          request_count: existing.request_count + 1,
        })
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
