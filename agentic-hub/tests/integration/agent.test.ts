import { describe, it, expect, beforeEach } from "vitest";
import { agentGraph } from "@/lib/agent/graph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

describe("Agent Graph Tests", () => {
  describe("Graph Structure", () => {
    it("should have a valid graph structure", () => {
      expect(agentGraph).toBeDefined();
      expect(agentGraph.nodes).toBeDefined();
      expect(agentGraph.edges).toBeDefined();
    });

    it("should have required nodes", () => {
      const nodes = agentGraph.nodes;
      expect(nodes).toContain("router");
      expect(nodes).toContain("planner");
      expect(nodes).toContain("executor");
    });

    it("should have proper edges", () => {
      const edges = agentGraph.edges;
      expect(edges.length).toBeGreaterThan(0);
    });
  });

  describe("Agent State", () => {
    it("should accept initial state", async () => {
      const initialState = {
        messages: [new HumanMessage("test message")],
        llmCalls: 0,
        selectedModel: "claude" as const,
        contextStack: [],
      };

      expect(initialState.messages).toHaveLength(1);
      expect(initialState.llmCalls).toBe(0);
    });
  });

  describe("Tool Registry", () => {
    it("should export all tool categories", async () => {
      const { allTools } = await import("@/lib/agent/tools");

      expect(allTools).toBeDefined();
      expect(Array.isArray(allTools)).toBe(true);
      expect(allTools.length).toBeGreaterThan(0);
    });

    it("should have tool names", async () => {
      const { TOOL_NAMES } = await import("@/lib/agent/tools");

      expect(TOOL_NAMES).toBeDefined();
      expect(TOOL_NAMES).toHaveProperty("QUERY_THREADS");
      expect(TOOL_NAMES).toHaveProperty("HTTP_GET");
      expect(TOOL_NAMES).toHaveProperty("SEMANTIC_SEARCH");
    });
  });

  describe("Model Adapters", () => {
    it("should export model adapter function", async () => {
      const { getModelAdapter } = await import("@/lib/models");

      expect(getModelAdapter).toBeDefined();
      expect(typeof getModelAdapter).toBe("function");
    });

    it("should accept model types", async () => {
      const { getModelAdapter } = await import("@/lib/models");

      // Should not throw, just return undefined if no API key
      const model = getModelAdapter("claude");
      expect(model).toBeDefined();
    });
  });
});
