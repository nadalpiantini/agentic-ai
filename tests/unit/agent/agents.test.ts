import { describe, it, expect } from "vitest";
import {
  detectAgentType,
  getAgentConfig,
  getModelForAgent,
  AGENTS,
  type AgentType,
} from "@/lib/agent/agents";

describe("Agent Types", () => {
  describe("Agent Configurations", () => {
    it("should have three agent types defined", () => {
      expect(Object.keys(AGENTS)).toHaveLength(3);
      expect(AGENTS.chat).toBeDefined();
      expect(AGENTS.code).toBeDefined();
      expect(AGENTS.search).toBeDefined();
    });

    it("should have chat agent with zai as default", () => {
      expect(AGENTS.chat.defaultModel).toBe("zai");
      expect(AGENTS.chat.type).toBe("chat");
    });

    it("should have code agent with claude as default", () => {
      expect(AGENTS.code.defaultModel).toBe("claude");
      expect(AGENTS.code.type).toBe("code");
    });

    it("should have search agent with deepseek as default", () => {
      expect(AGENTS.search.defaultModel).toBe("deepseek");
      expect(AGENTS.search.type).toBe("search");
    });
  });

  describe("detectAgentType", () => {
    it("should detect code agent from programming keywords", () => {
      expect(detectAgentType("help me write a function")).toBe("code");
      expect(detectAgentType("fix this bug in my code")).toBe("code");
      expect(detectAgentType("implement a new api endpoint")).toBe("code");
      expect(detectAgentType("debug this error")).toBe("code");
    });

    it("should detect search agent from web-related keywords", () => {
      expect(detectAgentType("search for the latest news")).toBe("search");
      expect(detectAgentType("find information about x")).toBe("search");
      expect(detectAgentType("fetch the url content")).toBe("search");
      expect(detectAgentType("translate this text")).toBe("search");
    });

    it("should detect chat agent from general conversation", () => {
      expect(detectAgentType("hello how are you")).toBe("chat");
      expect(detectAgentType("can you help me")).toBe("chat");
      expect(detectAgentType("tell me a joke")).toBe("chat");
    });

    it("should default to chat for unrecognized content", () => {
      expect(detectAgentType("asdfgh")).toBe("chat");
      expect(detectAgentType("")).toBe("chat");
    });

    it("should handle multi-language keywords", () => {
      expect(detectAgentType("ayuda con el código")).toBe("code");
      expect(detectAgentType("帮我写代码")).toBe("code");
      expect(detectAgentType("hola cómo estás")).toBe("chat");
      expect(detectAgentType("你好吗")).toBe("chat");
    });
  });

  describe("getModelForAgent", () => {
    it("should return default model for agent without constraints", () => {
      expect(getModelForAgent("chat")).toBe("zai");
      expect(getModelForAgent("code")).toBe("claude");
      expect(getModelForAgent("search")).toBe("deepseek");
    });

    it("should prioritize code agent on ties", () => {
      // "write code to search" - has both code and search keywords
      expect(detectAgentType("write code to search data")).toBe("code");
    });

    it("should force ollama when privacy constraint is set", () => {
      expect(getModelForAgent("chat", { privacy: true })).toBe("ollama");
      expect(getModelForAgent("code", { privacy: true })).toBe("ollama");
      expect(getModelForAgent("search", { privacy: true })).toBe("ollama");
    });

    it("should force deepseek when cost constraint is set", () => {
      expect(getModelForAgent("chat", { cost: true })).toBe("deepseek");
      expect(getModelForAgent("code", { cost: true })).toBe("deepseek");
      expect(getModelForAgent("search", { cost: true })).toBe("deepseek");
    });

    it("should force claude when quality constraint is set", () => {
      expect(getModelForAgent("chat", { quality: true })).toBe("claude");
      expect(getModelForAgent("code", { quality: true })).toBe("claude");
      expect(getModelForAgent("search", { quality: true })).toBe("claude");
    });
  });

  describe("getAgentConfig", () => {
    it("should return correct config for each agent type", () => {
      const chatConfig = getAgentConfig("chat");
      expect(chatConfig.type).toBe("chat");
      expect(chatConfig.name).toBe("Chat Agent");
      expect(chatConfig.keywords).toBeInstanceOf(Array);
      expect(chatConfig.capabilities).toBeInstanceOf(Array);
    });
  });
});
