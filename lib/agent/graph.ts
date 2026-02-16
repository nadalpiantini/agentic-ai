import { StateGraph, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { routerNode } from "./nodes/router";
import { plannerNode } from "./nodes/planner";
import { executorNode } from "./nodes/executor";

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
      // TODO: Check for tool_calls in AI message
      // For now, we check if the node returned next: "executor"
      // const hasToolCalls = latestMessage?.tool_calls?.length > 0;
      const hasToolCalls = false; // Placeholder

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

      // TODO: Check if executor completed all tool calls
      // const hasMoreWork = checkForRemainingToolCalls(state);
      const hasMoreWork = false; // Placeholder

      return hasMoreWork ? "planner" : END;
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
