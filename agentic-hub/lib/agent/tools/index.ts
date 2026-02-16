import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { supabaseTools } from "./supabase";
import { httpTools } from "./http";
import { ragTools } from "./rag";

/**
 * Tool Registry - Central registry for all agent tools
 *
 * Provides LangChain-compatible DynamicStructuredTool instances
 * that can be used by the LLM planner.
 */

/**
 * Convert our tool definitions to LangChain DynamicStructuredTool
 */
function createLangChainTool(tool: any): DynamicStructuredTool<any> {
  return new DynamicStructuredTool({
    name: tool.name,
    description: tool.description,
    schema: tool.schema,
    func: async (input: any) => {
      try {
        const result = await tool.handler(input);
        return JSON.stringify(result);
      } catch (error) {
        return JSON.stringify({
          error: (error as Error).message,
          tool: tool.name,
        });
      }
    },
  });
}

/**
 * All available tools for the agent
 */
export const allTools = [
  // Supabase database tools
  ...supabaseTools.map(createLangChainTool),

  // HTTP tools
  ...httpTools.map(createLangChainTool),

  // RAG tools
  ...ragTools.map(createLangChainTool),
];

/**
 * Get tool by name
 */
export function getToolByName(name: string): DynamicStructuredTool<any> | undefined {
  return allTools.find((tool) => tool.name === name);
}

/**
 * Get tools by category/prefix
 */
export function getToolsByPrefix(prefix: string): DynamicStructuredTool<any>[] {
  return allTools.filter((tool) => tool.name.startsWith(prefix));
}

// Export tool names for easy reference
export const TOOL_NAMES = {
  // Supabase
  QUERY_THREADS: "query_threads",
  CREATE_THREAD: "create_thread",
  QUERY_MESSAGES: "query_messages",
  CREATE_MESSAGE: "create_message",
  UPDATE_THREAD: "update_thread",

  // HTTP
  HTTP_GET: "http_get",
  HTTP_POST: "http_post",
  HTTP_PUT: "http_put",
  HTTP_DELETE: "http_delete",

  // RAG
  SEMANTIC_SEARCH: "semantic_search",
  ADD_DOCUMENT: "add_document",
} as const;
