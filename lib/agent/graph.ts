import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, type AgentStateType } from "./state";
import { routerNode } from "./nodes/router";
import { plannerNode } from "./nodes/planner";
import { executorNode } from "./nodes/executor";
import { getCheckpointer } from "./checkpointer";
import { AGENT_CONFIG } from "@/config/agent";
import type { AIMessage } from "@langchain/core/messages";

function shouldContinue(state: AgentStateType): "executor" | "__end__" {
  if (state.shouldEnd || state.llmCalls >= AGENT_CONFIG.maxLlmCalls) {
    return "__end__";
  }

  const lastMessage = state.messages[state.messages.length - 1];
  if (
    lastMessage &&
    "tool_calls" in lastMessage &&
    (lastMessage as AIMessage).tool_calls &&
    ((lastMessage as AIMessage).tool_calls?.length ?? 0) > 0
  ) {
    return "executor";
  }

  return "__end__";
}

function buildGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("router", routerNode)
    .addNode("planner", plannerNode)
    .addNode("executor", executorNode)
    .addEdge(START, "router")
    .addEdge("router", "planner")
    .addConditionalEdges("planner", shouldContinue, {
      executor: "executor",
      __end__: END,
    })
    .addEdge("executor", "planner");

  return graph;
}

export async function createCompiledGraph() {
  const checkpointer = await getCheckpointer();
  const graph = buildGraph();

  return graph.compile({
    checkpointer,
  });
}

export { buildGraph };
