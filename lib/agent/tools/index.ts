import type { StructuredToolInterface } from "@langchain/core/tools";
import { supabaseCrudTool } from "./supabase-crud";
import { httpFetchTool } from "./http-fetch";
import { ragSearchTool } from "./rag-search";
import { fileSystemTool } from "./file-system";

const tools: StructuredToolInterface[] = [
  supabaseCrudTool,
  httpFetchTool,
  ragSearchTool,
  fileSystemTool, // Sprint 1: File system operations
];

export function getTools(): StructuredToolInterface[] {
  return tools;
}

export function getToolsByName(names: string[]): StructuredToolInterface[] {
  return tools.filter((t) => names.includes(t.name));
}
