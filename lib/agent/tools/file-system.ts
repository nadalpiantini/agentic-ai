/**
 * File System Tool
 * Provides safe file operations within a sandboxed workspace directory
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { readFile, writeFile, readdir } from "fs/promises";
import { join, resolve, relative } from "path";
import { existsSync } from "fs";

// Workspace directory for file operations (sandbox)
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || "/tmp/agentic-workspace";

/**
 * Ensure workspace directory exists
 */
function ensureWorkspace() {
  if (!existsSync(WORKSPACE_DIR)) {
    // Note: In production, this should be created by the system
    // For now, we'll assume it exists or return error
  }
}

/**
 * Validate path is within workspace (sandbox security)
 */
function validatePath(path: string): string {
  const resolved = resolve(WORKSPACE_DIR, path);
  const relPath = relative(WORKSPACE_DIR, resolved);

  // Check if path tries to escape workspace
  if (relPath.startsWith("..") || resolve(WORKSPACE_DIR) !== resolve(resolved, "..")) {
    throw new Error("Access denied: Path outside workspace");
  }

  return resolved;
}

export const fileSystemTool = new DynamicStructuredTool({
  name: "file_system",
  description: `Read, write, and list files in the workspace directory.

Supported operations:
- read: Read file contents
- write: Write content to a file (creates if not exists)
- list: List files and directories

All operations are restricted to the workspace directory for security.`,

  schema: z.object({
    operation: z
      .enum(["read", "write", "list"])
      .describe("The file operation to perform"),
    path: z.string().describe("File or directory path (relative to workspace)"),
    content: z
      .string()
      .optional()
      .describe("Content to write (required for write operation)"),
  }),

  func: async ({ operation, path, content }) => {
    try {
      ensureWorkspace();

      switch (operation) {
        case "read": {
          const safePath = validatePath(path);
          const fileContent = await readFile(safePath, "utf-8");
          return fileContent;
        }

        case "write": {
          if (!content) {
            return "Error: content is required for write operation";
          }
          const safePath = validatePath(path);
          await writeFile(safePath, content, "utf-8");
          return `Successfully wrote to ${path}`;
        }

        case "list": {
          const safePath = validatePath(path || ".");
          const entries = await readdir(safePath, { withFileTypes: true });
          const items = entries.map((entry) => ({
            name: entry.name,
            type: entry.isDirectory() ? "directory" : "file",
          }));
          return JSON.stringify(items, null, 2);
        }

        default:
          return `Unknown operation: ${operation}`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return `Error: ${message}`;
    }
  },
});
