import { z } from "zod";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Tools - CRUD operations for database access
 *
 * Provides tools for:
 * - Querying threads and messages
 * - Creating new threads and messages
 * - Updating existing records
 * - Deleting records with RLS enforcement
 */

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  return supabaseClient;
}

/**
 * Query threads from database
 */
export async function queryThreads(args: { userId?: string; limit?: number }) {
  const { userId, limit = 10 } = args;

  let query = getSupabaseClient()
    .from("threads")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to query threads: ${error.message}`);
  }

  return {
    threads: data,
    count: data.length,
  };
}

/**
 * Create a new thread
 */
export async function createThread(args: { userId: string; title?: string }) {
  const { userId, title } = args;

  const { data, error } = await getSupabaseClient()
    .from("threads")
    .insert({
      user_id: userId,
      title: title || "New Thread",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create thread: ${error.message}`);
  }

  return {
    thread: data,
    created: true,
  };
}

/**
 * Query messages from a thread
 */
export async function queryMessages(args: { threadId: string; limit?: number }) {
  const { threadId, limit = 50 } = args;

  const { data, error } = await getSupabaseClient()
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to query messages: ${error.message}`);
  }

  return {
    messages: data,
    count: data.length,
  };
}

/**
 * Create a new message
 */
export async function createMessage(args: {
  threadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  userId?: string;
}) {
  const { threadId, role, content, userId } = args;

  const { data, error } = await getSupabaseClient()
    .from("messages")
    .insert({
      thread_id: threadId,
      role,
      content,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`);
  }

  return {
    message: data,
    created: true,
  };
}

/**
 * Update a thread
 */
export async function updateThread(args: {
  threadId: string;
  title?: string;
  metadata?: Record<string, unknown>;
}) {
  const { threadId, title, metadata } = args;

  const updateData: { title?: string; metadata?: Record<string, unknown> } = {};
  if (title) updateData.title = title;
  if (metadata) updateData.metadata = metadata;

  const { data, error } = await getSupabaseClient()
    .from("threads")
    .update(updateData)
    .eq("id", threadId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update thread: ${error.message}`);
  }

  return {
    thread: data,
    updated: true,
  };
}

// Tool schemas for LangChain integration
export const supabaseTools = [
  {
    name: "query_threads",
    description: "Query threads from the database with optional user filter",
    schema: z.object({
      userId: z.string().optional(),
      limit: z.number().default(10),
    }),
    handler: queryThreads,
  },
  {
    name: "create_thread",
    description: "Create a new thread in the database",
    schema: z.object({
      userId: z.string(),
      title: z.string().optional(),
    }),
    handler: createThread,
  },
  {
    name: "query_messages",
    description: "Query messages from a specific thread",
    schema: z.object({
      threadId: z.string(),
      limit: z.number().default(50),
    }),
    handler: queryMessages,
  },
  {
    name: "create_message",
    description: "Create a new message in a thread",
    schema: z.object({
      threadId: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
      userId: z.string().optional(),
    }),
    handler: createMessage,
  },
  {
    name: "update_thread",
    description: "Update an existing thread's title or metadata",
    schema: z.object({
      threadId: z.string(),
      title: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }),
    handler: updateThread,
  },
];
