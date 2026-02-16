import { AgentState } from "../state";

/**
 * Planner Node - LLM invocation and response generation
 *
 * Core node that:
 * - Invokes the selected LLM model (Claude/DeepSeek/Ollama)
 * - Passes conversation history and context
 * - Receives response with potential tool calls
 * - Tracks LLM call count for loop guard
 *
 * Currently a placeholder - future implementation will include:
 * - Model adapter integration (Claude/DeepSeek/Ollama)
 * - Tool binding for available functions
 * - Prompt construction with context stack
 * - Response parsing and validation
 *
 * @param state - Current agent state
 * @returns Next node name ("executor" if tools called, "__end__" if done)
 */
export async function plannerNode(
  state: typeof AgentState.State
): Promise<Partial<typeof AgentState.State> & { next: string }> {
  const { messages, selectedModel, llmCalls } = state;

  console.log("[Planner] Using model:", selectedModel);
  console.log("[Planner] LLM calls so far:", llmCalls);

  // Placeholder: Check loop guard
  const MAX_LLM_CALLS = Number(process.env.MAX_LLM_CALLS) || 25;
  if (llmCalls >= MAX_LLM_CALLS) {
    console.error("[Planner] Max LLM calls reached, terminating");
    return {
      llmCalls: 1, // Increment counter
      next: "__end__",
    };
  }

  // Placeholder: Extract latest user message
  const latestMessage = messages[messages.length - 1];
  console.log("[Planner] Processing:", latestMessage?.content);

  // TODO: Initialize model adapter
  // const model = getModelAdapter(selectedModel);
  // const response = await model.invoke(messages);

  // TODO: Bind tools to model
  // const tools = getAvailableTools();
  // const modelWithTools = model.bindTools(tools);

  // TODO: Invoke model with current state
  // const result = await modelWithTools.invoke(messages);

  // Placeholder: Simulate LLM response
  // In real implementation, check for tool_calls in response
  const hasToolCalls = false; // Placeholder

  if (hasToolCalls) {
    console.log("[Planner] Tool calls detected, routing to executor");
    return {
      llmCalls: 1, // Increment counter
      next: "executor",
    };
  }

  console.log("[Planner] No tool calls, ending workflow");
  return {
    llmCalls: 1, // Increment counter
    next: "__end__",
  };
}
