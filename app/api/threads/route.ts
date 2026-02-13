import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { v5 as uuidv5 } from "uuid";
import { createAPIHandler } from "@/lib/utils/api-handler";
import { Logger } from "@/lib/utils/logging";

export const dynamic = "force-dynamic";

// Create admin client with service role key for server-side operations
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return createServerClient(url, serviceRoleKey);
}

// Generate consistent UUID from string user ID
function generateUserUUID(userIdString: string): string {
  // Use a fixed namespace for consistent UUID generation
  const NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // DNS namespace
  return uuidv5(userIdString, NAMESPACE);
}

const getHandler = createAPIHandler(
  { method: "GET", path: "/api/threads" },
  async ({ req, requestId, userId }) => {
    const supabase = createAdminClient();
    const userIdString = req.headers.get("x-user-id") || "default-user";
    const userUUID = generateUserUUID(userIdString);

    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .eq("user_id", userUUID)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    await Logger.logMetric(
      {
        requestId,
        method: "GET",
        path: "/api/threads",
        userId,
        timestamp: Date.now(),
      },
      "threads_retrieved",
      (data || []).length,
      "count"
    );

    return {
      data: { threads: data },
      statusCode: 200,
    };
  }
);

const postHandler = createAPIHandler(
  { method: "POST", path: "/api/threads", requireBody: true },
  async ({ req, requestId, userId }) => {
    const supabase = createAdminClient();
    const userIdString = req.headers.get("x-user-id") || "default-user";
    const userUUID = generateUserUUID(userIdString);

    let body: Record<string, unknown> = {};
    try {
      const text = await req.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      throw new Error("Invalid JSON in request body");
    }

    const title = (body.title as string) || "New Chat";

    const { data, error } = await supabase
      .from("threads")
      .insert({
        user_id: userUUID,
        title: title,
      })
      .select()
      .single();

    if (error) throw error;

    // Log thread creation event
    await Logger.logMetric(
      {
        requestId,
        method: "POST",
        path: "/api/threads",
        userId,
        timestamp: Date.now(),
      },
      "thread_created",
      1,
      "count"
    );

    return {
      data: { thread: data },
      statusCode: 201,
    };
  }
);

export const GET = getHandler;
export const POST = postHandler;
