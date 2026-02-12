import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  llmCalls: Annotation<number>({
    reducer: (current: number, update: number) => current + update,
    default: () => 0,
  }),
  currentModel: Annotation<string>({
    reducer: (_prev: string, next: string) => next,
    default: () => "claude",
  }),
  shouldEnd: Annotation<boolean>({
    reducer: (_prev: boolean, next: boolean) => next,
    default: () => false,
  }),
});

export type AgentStateType = typeof AgentState.State;
