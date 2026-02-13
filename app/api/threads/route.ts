import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";
import { createAPIHandler } from "@/lib/utils/api-handler";
import { Logger } from "@/lib/utils/logging";

export const dynamic = "force-dynamic";

const getHandler = createAPIHandler(
  { method: "GET", path: "/api/threads" },
  async ({ req, requestId, userId }) => {
    const authResult = await requireAuthenticatedUser();
    if (authResult.error) {
      return authResult.response!;
    }

    const supabase = createAdminClient();
    const { user } = authResult;

    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    await Logger.logMetric(
      {
        requestId,
        method: "GET",
        path: "/api/threads",
        userId: user.id,
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
    const authResult = await requireAuthenticatedUser();
    if (authResult.error) {
      return authResult.response!;
    }

    const supabase = createAdminClient();
    const { user } = authResult;

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
        user_id: user.id,
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
        userId: user.id,
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
