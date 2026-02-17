import { StateGraph, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { routerNode } from "./nodes/router";
import { plannerNode } from "./nodes/planner";
import { executorNode } from "./nodes/executor";
import { BaseMessage } from "@langchain/core/messages";

interface ToolCallMessage extends BaseMessage {
  tool_calls?: Array<{ name: string; args: Record<string, unknown>; id: string }>;
}

/**
 * LangGraph StateGraph for Agentic Hub workflow
 *
 * Workflow: router → planner → executor → (loop back to planner) → END
 *
 * - Router: Analyzes input, selects model, routes to planner
 * - Planner: Invokes LLM, generates response or tool calls
 * - Executor: Executes tool calls, returns results to planner
 * - Loop guard: MAX_LLM_CALLS prevents infinite loops
 *
 * @returns Compiled StateGraph ready for invocation
 */
export function createAgentGraph() {
  // Initialize state graph with AgentState annotation
  const graph = new StateGraph(AgentState)
    // Add nodes
    .addNode("router", routerNode)
    .addNode("planner", plannerNode)
    .addNode("executor", executorNode);

  // Define edges (workflow connections)
  // Entry point: always start at router
  graph.setEntryPoint("router");

  // Simple edge: router → planner (always)
  graph.addEdge("router", "planner");

  // Conditional routing from planner → executor OR planner → END
  // Based on whether LLM made tool calls
  graph.addConditionalEdges(
    "planner",
    // State transition function
    (state: typeof AgentState.State) => {
      const latestMessage = state.messages[state.messages.length - 1];
      const msgWithToolCalls = latestMessage as ToolCallMessage | undefined;
      const hasToolCalls =
        latestMessage &&
        "tool_calls" in (msgWithToolCalls || {}) &&
        Array.isArray(msgWithToolCalls?.tool_calls) &&
        msgWithToolCalls.tool_calls.length > 0;

      return hasToolCalls ? "executor" : END;
    },
    {
      executor: "executor",
      [END]: END,
    }
  );

  // Conditional routing from executor → planner OR executor → END
  // Based on whether more work needed
  graph.addConditionalEdges(
    "executor",
    // State transition function
    (state: typeof AgentState.State) => {
      const { llmCalls } = state;
      const MAX_LLM_CALLS = Number(process.env.MAX_LLM_CALLS) || 25;

      // Loop guard: prevent infinite loops
      if (llmCalls >= MAX_LLM_CALLS) {
        return END;
      }

      // After executor runs, always loop back to planner so
      // the LLM can process tool results and decide next step
      return "planner";
    },
    {
      planner: "planner",
      [END]: END,
    }
  );

  // Compile the graph
  return graph.compile();
}

/**
 * Singleton instance of the agent graph
 * Import and use this directly in API routes
 */
export const agentGraph = createAgentGraph();
