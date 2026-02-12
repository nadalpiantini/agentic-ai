import { describe, it, expect, vi } from "vitest";

describe("Environment Configuration", () => {
  it("should validate required environment variables", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
    vi.stubEnv("DATABASE_URL", "postgres://localhost:5432/test");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-deepseek-key");

    const mod = await import("@/lib/utils/env");
    expect(mod.env).toBeDefined();
    expect(mod.env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://localhost:54321");
  });

  it("should have default values for optional vars", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
    vi.stubEnv("DATABASE_URL", "postgres://localhost:5432/test");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    vi.stubEnv("DEEPSEEK_API_KEY", "test-deepseek-key");

    const mod = await import("@/lib/utils/env");
    expect(mod.env.DEFAULT_MODEL).toBeDefined();
    expect(mod.env.MAX_LLM_CALLS).toBeDefined();
    expect(mod.env.MAX_RECURSION_DEPTH).toBeDefined();
  });
});
