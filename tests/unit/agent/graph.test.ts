import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env before imports
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

vi.mock("@langchain/langgraph-checkpoint-postgres", () => ({
  PostgresSaver: {
    fromConnString: vi.fn().mockReturnValue({
      setup: vi.fn(),
    }),
  },
}));

vi.mock("@langchain/langgraph", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    StateGraph: vi.fn().mockImplementation(() => ({
      addNode: vi.fn().mockReturnThis(),
      addEdge: vi.fn().mockReturnThis(),
      addConditionalEdges: vi.fn().mockReturnThis(),
      compile: vi.fn().mockReturnValue({
        invoke: vi.fn(),
        stream: vi.fn(),
      }),
    })),
  };
});

describe("Agent Graph", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export buildGraph and createCompiledGraph functions", async () => {
    const { buildGraph, createCompiledGraph } = await import(
      "@/lib/agent/graph"
    );
    expect(buildGraph).toBeDefined();
    expect(typeof buildGraph).toBe("function");
    expect(createCompiledGraph).toBeDefined();
    expect(typeof createCompiledGraph).toBe("function");
  });

  it("should export AgentState annotation", async () => {
    const { AgentState } = await import("@/lib/agent/state");
    expect(AgentState).toBeDefined();
  });
});

describe("Agent State", () => {
  it("should define state annotation with required channels", async () => {
    const { AgentState } = await import("@/lib/agent/state");
    expect(AgentState).toBeDefined();
    expect(AgentState.spec).toBeDefined();
  });
});
