import { AgentState } from "../state";
import { ToolMessage, AIMessage } from "@langchain/core/messages";
import { getToolByName } from "../tools";

/**
 * Executor Node - Tool execution and result collection
 *
 * Executes tool calls requested by the planner:
 * - Supabase CRUD operations (database queries)
 * - HTTP requests (external API calls)
 * - RAG search (vector similarity queries)
 * - File operations, data processing, etc.
 *
 * @param state - Current agent state
 * @returns Next node name ("planner" for loop, "__end__" if complete)
 */
export async function executorNode(
  state: typeof AgentState.State
): Promise<Partial<typeof AgentState.State> & { next: string }> {
  const { messages, contextStack } = state;

  console.log("[Executor] Context stack depth:", contextStack.length);

  // Extract tool calls from latest AI message
  const latestMessage = messages[messages.length - 1];

  if (!latestMessage || !("tool_calls" in latestMessage)) {
    console.log("[Executor] No tool calls found, ending workflow");
    return {
      next: "__end__",
    };
  }

  const toolCalls = (latestMessage as AIMessage).tool_calls;

  if (!toolCalls || toolCalls.length === 0) {
    console.log("[Executor] No tool calls to execute, ending workflow");
    return {
      next: "__end__",
    };
  }

  console.log(
    "[Executor] Executing",
    toolCalls.length,
    "tool(s):",
    toolCalls.map((tc) => tc.name).join(", ")
  );

  // Execute each tool call
  const toolMessages: ToolMessage[] = [];

  for (const toolCall of toolCalls) {
    const { name, args, id } = toolCall;

    try {
      console.log(`[Executor] Executing tool: ${name}`, args);

      // Get tool from registry
      const tool = getToolByName(name);

      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      // Execute tool
      const result = await tool.invoke(args);

      console.log(`[Executor] Tool ${name} succeeded`);

      // Create tool message with result
      toolMessages.push(
        new ToolMessage({
          content: JSON.stringify(result),
          name: name || "unknown",
          tool_call_id: id || "",
        })
      );
    } catch (error) {
      console.error(`[Executor] Tool ${name} failed:`, error);

      // Return error as tool message so LLM can handle it
      toolMessages.push(
        new ToolMessage({
          content: JSON.stringify({
            error: (error as Error).message,
            tool: name,
          }),
          name: name || "unknown",
          tool_call_id: id || "",
        })
      );
    }
  }

  if (toolMessages.length > 0) {
    console.log("[Executor] All tools executed, routing back to planner");
    return {
      messages: toolMessages,
      next: "planner",
    };
  }

  console.log("[Executor] No tool results, ending workflow");
  return {
    next: "__end__",
  };
}
