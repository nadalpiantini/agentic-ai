import type { AgentStateType } from "../state";
import { ToolMessage } from "@langchain/core/messages";
import type { AIMessage } from "@langchain/core/messages";
import { getTools } from "../tools";

export async function executorNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
  const toolCalls = lastMessage.tool_calls;

  if (!toolCalls || toolCalls.length === 0) {
    return {};
  }

  const tools = getTools();
  const toolResults: ToolMessage[] = [];

  for (const toolCall of toolCalls) {
    const tool = tools.find((t) => t.name === toolCall.name);
    if (tool) {
      try {
        const result = await tool.invoke(toolCall.args);
        toolResults.push(
          new ToolMessage({
            content:
              typeof result === "string" ? result : JSON.stringify(result),
            tool_call_id: toolCall.id ?? "",
            name: toolCall.name,
          })
        );
      } catch (error) {
        toolResults.push(
          new ToolMessage({
            content: `Error executing tool ${toolCall.name}: ${error instanceof Error ? error.message : String(error)}`,
            tool_call_id: toolCall.id ?? "",
            name: toolCall.name,
          })
        );
      }
    }
  }

  return { messages: toolResults };
}
