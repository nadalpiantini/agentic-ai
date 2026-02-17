import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AgentState } from "../state";
import { getModelAdapter } from "../../models";
import { allTools } from "../tools";

interface ToolBindableModel extends BaseChatModel {
  bindTools(tools: unknown[]): BaseChatModel;
}

function hasBindTools(model: BaseChatModel): model is ToolBindableModel {
  return typeof (model as ToolBindableModel).bindTools === 'function';
}

/**
 * Planner Node - LLM invocation and response generation
 *
 * Core node that:
 * - Invokes the selected LLM model (Claude/DeepSeek/Ollama)
 * - Passes conversation history and context
 * - Receives response with potential tool calls
 * - Tracks LLM call count for loop guard
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

  // Check loop guard
  const MAX_LLM_CALLS = Number(process.env.MAX_LLM_CALLS) || 25;
  if (llmCalls >= MAX_LLM_CALLS) {
    console.error("[Planner] Max LLM calls reached, terminating");
    return {
      llmCalls: llmCalls + 1,
      next: "__end__",
    };
  }

  // Extract latest user message
  const latestMessage = messages[messages.length - 1];
  console.log("[Planner] Processing:", latestMessage?.content);

  try {
    // Initialize model adapter
    const model = getModelAdapter(selectedModel);

    // Bind tools to model if supported
    const modelWithTools = hasBindTools(model) ? model.bindTools(allTools) : model;

    // Invoke model with current state
    const result = await modelWithTools.invoke(messages);

    console.log("[Planner] Model response received");

    // Check for tool calls in response
    const hasToolCalls =
      result.tool_calls &&
      Array.isArray(result.tool_calls) &&
      result.tool_calls.length > 0;

    if (hasToolCalls) {
      console.log(
        "[Planner] Tool calls detected:",
        result.tool_calls!.map((tc: { name: string }) => tc.name).join(", ")
      );
      return {
        messages: [result],
        llmCalls: llmCalls + 1,
        next: "executor",
      };
    }

    console.log("[Planner] No tool calls, ending workflow");
    return {
      messages: [result],
      llmCalls: llmCalls + 1,
      next: "__end__",
    };
  } catch (error) {
    console.error("[Planner] Error invoking model:", error);
    return {
      llmCalls: llmCalls + 1,
      next: "__end__",
    };
  }
}
