/**
 * Context Stack Manager
 * Manages multiple conversation contexts with merge and window management
 */

import { Annotation } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

export interface ContextFrame {
  id: string;
  threadId: string;
  messages: BaseMessage[];
  metadata: {
    createdAt: number;
    updatedAt: number;
    language?: string;
    agentType?: string;
  };
}

export interface ContextStackOptions {
  maxFrames?: number; // Maximum number of contexts to keep
  maxTokens?: number; // Approximate token limit per context
  mergeStrategy?: "append" | "interleave" | "replace";
}

/**
 * Context Stack Manager
 * Handles multi-thread context management with smart merging
 */
export class ContextStackManager {
  private stacks: Map<string, ContextFrame[]> = new Map();
  private options: Required<ContextStackOptions>;

  constructor(options: ContextStackOptions = {}) {
    this.options = {
      maxFrames: options.maxFrames ?? 10,
      maxTokens: options.maxTokens ?? 16000,
      mergeStrategy: options.mergeStrategy ?? "append",
    };
  }

  /**
   * Push a new context frame onto a thread's stack
   */
  push(threadId: string, messages: BaseMessage[], metadata?: ContextFrame["metadata"]): string {
    const frameId = `${threadId}-${Date.now()}`;
    const frame: ContextFrame = {
      id: frameId,
      threadId,
      messages: this.trimMessages(messages, this.options.maxTokens),
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...metadata,
      },
    };

    const stack = this.stacks.get(threadId) || [];
    stack.push(frame);

    // Enforce max frames limit
    if (stack.length > this.options.maxFrames) {
      stack.shift(); // Remove oldest
    }

    this.stacks.set(threadId, stack);
    return frameId;
  }

  /**
   * Pop the most recent context frame from a thread's stack
   */
  pop(threadId: string): ContextFrame | undefined {
    const stack = this.stacks.get(threadId);
    if (!stack || stack.length === 0) {
      return undefined;
    }

    const frame = stack.pop();
    if (stack.length === 0) {
      this.stacks.delete(threadId);
    } else {
      this.stacks.set(threadId, stack);
    }

    return frame;
  }

  /**
   * Get all messages from a thread's context stack
   */
  getStack(threadId: string): BaseMessage[] {
    const stack = this.stacks.get(threadId) || [];
    return this.mergeContexts(stack);
  }

  /**
   * Get a specific context frame by ID
   */
  getFrame(frameId: string): ContextFrame | undefined {
    for (const stack of this.stacks.values()) {
      const frame = stack.find((f) => f.id === frameId);
      if (frame) {
        return frame;
      }
    }
    return undefined;
  }

  /**
   * Merge multiple context frames into a single message array
   */
  private mergeContexts(frames: ContextFrame[]): BaseMessage[] {
    switch (this.options.mergeStrategy) {
      case "append":
        return frames.flatMap((f) => f.messages);

      case "interleave":
        return this.interleaveMessages(frames);

      case "replace":
        // Only use the most recent frame
        return frames.length > 0 ? frames[frames.length - 1].messages : [];

      default:
        return frames.flatMap((f) => f.messages);
    }
  }

  /**
   * Interleave messages from multiple contexts by timestamp
   */
  private interleaveMessages(frames: ContextFrame[]): BaseMessage[] {
    const allMessages = frames.flatMap((frame, frameIndex) =>
      frame.messages.map((msg) => ({ msg, frameIndex }))
    );

    // Sort by frame order (assuming chronological frame order)
    return allMessages.map(({ msg }) => msg);
  }

  /**
   * Trim messages to fit within token limit
   * Keeps newest messages, drops oldest
   */
  private trimMessages(messages: BaseMessage[], maxTokens: number): BaseMessage[] {
    // Simple heuristic: assume avg 100 tokens per message
    const maxMessages = Math.ceil(maxTokens / 100);

    if (messages.length <= maxMessages) {
      return messages;
    }

    // Keep newest messages
    return messages.slice(-maxMessages);
  }

  /**
   * Clear all contexts for a thread
   */
  clear(threadId: string): void {
    this.stacks.delete(threadId);
  }

  /**
   * Get all thread IDs with active contexts
   */
  getActiveThreads(): string[] {
    return Array.from(this.stacks.keys());
  }

  /**
   * Get statistics about context stacks
   */
  getStats(): {
    totalThreads: number;
    totalFrames: number;
    avgFramesPerThread: number;
  } {
    const frames = Array.from(this.stacks.values()).flat();
    return {
      totalThreads: this.stacks.size,
      totalFrames: frames.length,
      avgFramesPerThread: this.stacks.size > 0
        ? frames.length / this.stacks.size
        : 0,
    };
  }
}

// Singleton instance for the application
let globalContextManager: ContextStackManager | undefined;

export function getGlobalContextManager(): ContextStackManager {
  if (!globalContextManager) {
    globalContextManager = new ContextStackManager({
      maxFrames: 10,
      maxTokens: 16000,
      mergeStrategy: "append",
    });
  }
  return globalContextManager;
}

export function resetGlobalContextManager(): void {
  globalContextManager = undefined;
}
