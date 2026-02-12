import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getVectorStore } from "@/lib/vector-store";

export const ragSearchTool = new DynamicStructuredTool({
  name: "rag_search",
  description:
    "Search the knowledge base for relevant documents using semantic similarity search.",
  schema: z.object({
    query: z.string().describe("The search query"),
    k: z.number().default(4).describe("Number of results to return"),
  }),
  func: async ({ query, k }) => {
    try {
      const vectorStore = getVectorStore();
      if (!vectorStore) {
        return "Vector store not configured. RAG search unavailable.";
      }
      const results = await vectorStore.similaritySearch(query, k);
      return results
        .map(
          (doc, i) =>
            `[${i + 1}] ${doc.pageContent}\nMetadata: ${JSON.stringify(doc.metadata)}`
        )
        .join("\n\n");
    } catch (error) {
      return `RAG search error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
