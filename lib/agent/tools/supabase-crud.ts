import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const supabaseCrudTool = new DynamicStructuredTool({
  name: "supabase_crud",
  description:
    "Perform CRUD operations on the Supabase database. Supports select, insert, update, and delete operations on any table.",
  schema: z.object({
    operation: z
      .enum(["select", "insert", "update", "delete"])
      .describe("The CRUD operation to perform"),
    table: z.string().describe("The table name to operate on"),
    data: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Data for insert/update operations"),
    filters: z
      .record(z.string(), z.string())
      .optional()
      .describe("Filters for select/update/delete (column: value)"),
    limit: z.number().optional().describe("Limit for select operations"),
  }),
  func: async ({ operation, table, data, filters, limit }) => {
    const supabase = createAdminClient();

    switch (operation) {
      case "select": {
        let query = supabase.from(table).select("*");
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
        }
        if (limit) query = query.limit(limit);
        const { data: rows, error } = await query;
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(rows);
      }
      case "insert": {
        if (!data) return "Error: data is required for insert";
        const { data: inserted, error } = await supabase
          .from(table)
          .insert(data)
          .select();
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(inserted);
      }
      case "update": {
        if (!data) return "Error: data is required for update";
        let query = supabase.from(table).update(data);
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
        }
        const { data: updated, error } = await query.select();
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(updated);
      }
      case "delete": {
        let query = supabase.from(table).delete();
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            query = query.eq(key, value);
          }
        }
        const { data: deleted, error } = await query.select();
        if (error) return `Error: ${error.message}`;
        return JSON.stringify(deleted);
      }
      default:
        return `Unknown operation: ${operation}`;
    }
  },
});
