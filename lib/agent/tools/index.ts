import type { StructuredToolInterface } from "@langchain/core/tools";
import { supabaseCrudTool } from "./supabase-crud";
import { httpFetchTool } from "./http-fetch";
import { ragSearchTool } from "./rag-search";

const tools: StructuredToolInterface[] = [
  supabaseCrudTool,
  httpFetchTool,
  ragSearchTool,
];

export function getTools(): StructuredToolInterface[] {
  return tools;
}

export function getToolsByName(names: string[]): StructuredToolInterface[] {
  return tools.filter((t) => names.includes(t.name));
}
