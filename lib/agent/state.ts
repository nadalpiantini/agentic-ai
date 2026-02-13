import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import type { BaseMessage } from "@langchain/core/messages";
import type { SupportedLanguage } from "./prompts";
import type { AgentType } from "./agents";

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
    default: () => "zai",
  }),
  currentAgent: Annotation<AgentType>({
    reducer: (_prev: AgentType, next: AgentType) => next,
    default: () => "chat",
  }),
  shouldEnd: Annotation<boolean>({
    reducer: (_prev: boolean, next: boolean) => next,
    default: () => false,
  }),
  detectedLanguage: Annotation<SupportedLanguage>({
    reducer: (_prev: SupportedLanguage, next: SupportedLanguage) => next,
    default: () => "en",
  }),
});

export type AgentStateType = typeof AgentState.State;
