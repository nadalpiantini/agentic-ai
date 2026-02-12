import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/utils/env", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
    DATABASE_URL: "postgres://localhost:5432/test",
    ANTHROPIC_API_KEY: "test-anthropic-key",
    DEEPSEEK_API_KEY: "test-deepseek-key",
    OLLAMA_BASE_URL: "http://localhost:11434",
    DEFAULT_MODEL: "claude",
    MAX_LLM_CALLS: 25,
    MAX_RECURSION_DEPTH: 10,
  },
}));

describe("Model Router", () => {
  it("should export routeModel function", async () => {
    const { routeModel } = await import("@/lib/models/index");
    expect(routeModel).toBeDefined();
    expect(typeof routeModel).toBe("function");
  });

  it("should route quality tasks to claude", async () => {
    const { routeModel } = await import("@/lib/models/index");
    const provider = routeModel({ quality: true });
    expect(provider).toBe("claude");
  });

  it("should route privacy tasks to ollama", async () => {
    const { routeModel } = await import("@/lib/models/index");
    const provider = routeModel({ privacy: true });
    expect(provider).toBe("ollama");
  });

  it("should route cost-sensitive tasks to deepseek", async () => {
    const { routeModel } = await import("@/lib/models/index");
    const provider = routeModel({ costSensitive: true });
    expect(provider).toBe("deepseek");
  });

  it("should route speed tasks to deepseek", async () => {
    const { routeModel } = await import("@/lib/models/index");
    const provider = routeModel({ speed: true });
    expect(provider).toBe("deepseek");
  });

  it("should export createModel function", async () => {
    const { createModel } = await import("@/lib/models/index");
    expect(createModel).toBeDefined();
    expect(typeof createModel).toBe("function");
  });

  it("should export getDefaultModel function", async () => {
    const { getDefaultModel } = await import("@/lib/models/index");
    expect(getDefaultModel).toBeDefined();
    expect(typeof getDefaultModel).toBe("function");
  });
});
