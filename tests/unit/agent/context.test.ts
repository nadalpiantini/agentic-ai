import { describe, it, expect, beforeEach } from "vitest";
import {
  ContextStackManager,
  getGlobalContextManager,
  resetGlobalContextManager,
  type ContextFrame,
} from "@/lib/agent/context";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

describe("ContextStackManager", () => {
  let manager: ContextStackManager;

  beforeEach(() => {
    resetGlobalContextManager();
    manager = new ContextStackManager({
      maxFrames: 3,
      maxTokens: 1000,
      mergeStrategy: "append",
    });
  });

  describe("push and pop", () => {
    it("should push and retrieve context frames", () => {
      const messages = [
        new HumanMessage("Hello"),
        new AIMessage("Hi there!"),
      ];

      const frameId = manager.push("thread-1", messages);
      expect(frameId).toBeDefined();
      expect(frameId).toContain("thread-1");

      const stack = manager.getStack("thread-1");
      expect(stack).toHaveLength(2);
      expect(stack[0]).toBeInstanceOf(HumanMessage);
      expect(stack[1]).toBeInstanceOf(AIMessage);
    });

    it("should pop the most recent frame", () => {
      const messages1 = [new HumanMessage("First")];
      const messages2 = [new HumanMessage("Second")];

      manager.push("thread-1", messages1);
      manager.push("thread-1", messages2);

      const frame = manager.pop("thread-1");
      expect(frame?.messages).toHaveLength(1);
      expect(frame?.messages[0].content).toBe("Second");

      const remainingStack = manager.getStack("thread-1");
      expect(remainingStack).toHaveLength(1);
      expect(remainingStack[0].content).toBe("First");
    });

    it("should return undefined when popping from empty stack", () => {
      const frame = manager.pop("non-existent");
      expect(frame).toBeUndefined();
    });
  });

  describe("max frames limit", () => {
    it("should enforce max frames limit", () => {
      const messages = [new HumanMessage("Test")];

      // Push 4 frames when max is 3
      manager.push("thread-1", messages);
      manager.push("thread-1", messages);
      manager.push("thread-1", messages);
      manager.push("thread-1", messages);

      const stack = manager.getStack("thread-1");
      // Should only have 3 frames (oldest was dropped)
      expect(stack.length).toBeLessThanOrEqual(3 * messages.length);
    });
  });

  describe("merge strategies", () => {
    it("should merge with append strategy (default)", () => {
      const managerAppend = new ContextStackManager({
        mergeStrategy: "append",
      });

      const messages1 = [new HumanMessage("First")];
      const messages2 = [new HumanMessage("Second")];

      managerAppend.push("thread-1", messages1);
      managerAppend.push("thread-1", messages2);

      const stack = managerAppend.getStack("thread-1");
      expect(stack).toHaveLength(2);
      expect(stack[0].content).toBe("First");
      expect(stack[1].content).toBe("Second");
    });

    it("should merge with replace strategy", () => {
      const managerReplace = new ContextStackManager({
        mergeStrategy: "replace",
      });

      const messages1 = [new HumanMessage("First")];
      const messages2 = [new HumanMessage("Second")];

      managerReplace.push("thread-1", messages1);
      managerReplace.push("thread-1", messages2);

      const stack = managerReplace.getStack("thread-1");
      // Should only have the most recent frame
      expect(stack).toHaveLength(1);
      expect(stack[0].content).toBe("Second");
    });
  });

  describe("getFrame", () => {
    it("should retrieve a specific frame by ID", () => {
      const messages = [new HumanMessage("Test")];
      const frameId = manager.push("thread-1", messages);

      const frame = manager.getFrame(frameId);
      expect(frame).toBeDefined();
      expect(frame?.id).toBe(frameId);
      expect(frame?.threadId).toBe("thread-1");
    });

    it("should return undefined for non-existent frame", () => {
      const frame = manager.getFrame("non-existent");
      expect(frame).toBeUndefined();
    });
  });

  describe("clear", () => {
    it("should clear all contexts for a thread", () => {
      const messages = [new HumanMessage("Test")];
      manager.push("thread-1", messages);
      manager.push("thread-1", messages);

      expect(manager.getStack("thread-1")).toHaveLength(2);

      manager.clear("thread-1");

      expect(manager.getStack("thread-1")).toHaveLength(0);
    });
  });

  describe("getActiveThreads", () => {
    it("should return list of active thread IDs", () => {
      const messages = [new HumanMessage("Test")];
      manager.push("thread-1", messages);
      manager.push("thread-2", messages);

      const activeThreads = manager.getActiveThreads();
      expect(activeThreads).toContain("thread-1");
      expect(activeThreads).toContain("thread-2");
      expect(activeThreads).toHaveLength(2);
    });
  });

  describe("getStats", () => {
    it("should return accurate statistics", () => {
      const messages = [new HumanMessage("Test")];

      manager.push("thread-1", messages);
      manager.push("thread-1", messages);
      manager.push("thread-2", messages);

      const stats = manager.getStats();
      expect(stats.totalThreads).toBe(2);
      expect(stats.totalFrames).toBe(3);
      expect(stats.avgFramesPerThread).toBe(1.5);
    });
  });

  describe("getGlobalContextManager", () => {
    it("should return singleton instance", () => {
      const instance1 = getGlobalContextManager();
      const instance2 = getGlobalContextManager();
      expect(instance1).toBe(instance2);
    });

    it("should reset to new instance", () => {
      const instance1 = getGlobalContextManager();
      resetGlobalContextManager();
      const instance2 = getGlobalContextManager();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe("metadata", () => {
    it("should store and retrieve metadata", () => {
      const messages = [new HumanMessage("Test")];
      const frameId = manager.push("thread-1", messages, {
        language: "es",
        agentType: "code",
      });

      const frame = manager.getFrame(frameId);
      expect(frame?.metadata.language).toBe("es");
      expect(frame?.metadata.agentType).toBe("code");
      expect(frame?.metadata.createdAt).toBeDefined();
      expect(frame?.metadata.updatedAt).toBeDefined();
    });
  });
});
