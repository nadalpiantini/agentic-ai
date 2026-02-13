import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdir, rm } from "fs/promises";

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
    WORKSPACE_DIR: "/tmp/test-agentic-workspace",
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    }),
  }),
}));

describe("Tool Registry", () => {
  it("should export getTools function", async () => {
    const { getTools } = await import("@/lib/agent/tools/index");
    expect(getTools).toBeDefined();
    expect(typeof getTools).toBe("function");
  });

  it("should return an array of tools", async () => {
    const { getTools } = await import("@/lib/agent/tools/index");
    const tools = getTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
  });

  it("should include supabase_crud tool", async () => {
    const { getTools } = await import("@/lib/agent/tools/index");
    const tools = getTools();
    const crudTool = tools.find((t) => t.name === "supabase_crud");
    expect(crudTool).toBeDefined();
  });

  it("should include http_fetch tool", async () => {
    const { getTools } = await import("@/lib/agent/tools/index");
    const tools = getTools();
    const fetchTool = tools.find((t) => t.name === "http_fetch");
    expect(fetchTool).toBeDefined();
  });

  it("should include file_system tool (Sprint 1)", async () => {
    const { getTools } = await import("@/lib/agent/tools/index");
    const tools = getTools();
    const fsTool = tools.find((t) => t.name === "file_system");
    expect(fsTool).toBeDefined();
  });

  it("should export getToolsByName function", async () => {
    const { getToolsByName } = await import("@/lib/agent/tools/index");
    expect(getToolsByName).toBeDefined();
    expect(typeof getToolsByName).toBe("function");
  });
});

describe("Multi-Language Prompts (Sprint 1)", () => {
  it("should detect Spanish language", async () => {
    const { detectLanguage } = await import("@/lib/agent/prompts");
    expect(detectLanguage("hola cómo estás")).toBe("es");
    expect(detectLanguage("gracias por tu ayuda")).toBe("es");
  });

  it("should detect Chinese language", async () => {
    const { detectLanguage } = await import("@/lib/agent/prompts");
    expect(detectLanguage("你好")).toBe("zh");
    expect(detectLanguage("谢谢你")).toBe("zh");
  });

  it("should detect French language", async () => {
    const { detectLanguage } = await import("@/lib/agent/prompts");
    expect(detectLanguage("bonjour comment allez-vous")).toBe("fr");
    expect(detectLanguage("merci beaucoup")).toBe("fr");
  });

  it("should default to English for unknown languages", async () => {
    const { detectLanguage } = await import("@/lib/agent/prompts");
    expect(detectLanguage("hello how are you")).toBe("en");
    expect(detectLanguage("random text")).toBe("en");
  });

  it("should return system prompt for each language", async () => {
    const { getSystemPrompt } = await import("@/lib/agent/prompts");
    expect(getSystemPrompt("en")).toContain("helpful AI assistant");
    expect(getSystemPrompt("es")).toContain("asistente de IA útil");
    expect(getSystemPrompt("zh")).toContain("有用的AI助手");
    expect(getSystemPrompt("fr")).toContain("assistant IA utile");
  });
});

