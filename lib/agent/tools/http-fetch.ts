import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const httpFetchTool = new DynamicStructuredTool({
  name: "http_fetch",
  description:
    "Make HTTP requests to external URLs. Supports GET and POST methods.",
  schema: z.object({
    url: z.string().url().describe("The URL to fetch"),
    method: z
      .enum(["GET", "POST"])
      .default("GET")
      .describe("HTTP method"),
    body: z
      .string()
      .optional()
      .describe("Request body for POST requests (JSON string)"),
    headers: z
      .record(z.string(), z.string())
      .optional()
      .describe("Additional request headers"),
  }),
  func: async ({ url, method, body, headers }) => {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        ...(body && method === "POST" ? { body } : {}),
      });

      if (!response.ok) {
        return `HTTP Error ${response.status}: ${response.statusText}`;
      }

      const text = await response.text();
      return text.length > 4000
        ? text.slice(0, 4000) + "\n...(truncated)"
        : text;
    } catch (error) {
      return `Fetch error: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
