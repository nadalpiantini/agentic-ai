import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthenticatedUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ threadId: string }> };

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuthenticatedUser();
  if (authResult.error || !authResult.user) {
    return authResult.response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const supabase = createAdminClient();

  // Get thread
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("*")
    .eq("id", threadId)
    .eq("user_id", authResult.user.id)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Get messages
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return NextResponse.json({ error: messagesError.message }, { status: 500 });
  }

  return NextResponse.json({ thread, messages });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuthenticatedUser();
  if (authResult.error || !authResult.user) {
    return authResult.response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("threads")
    .delete()
    .eq("id", threadId)
    .eq("user_id", authResult.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuthenticatedUser();
  if (authResult.error || !authResult.user) {
    return authResult.response ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;
  const body = await req.json();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("threads")
    .update({ title: body.title })
    .eq("id", threadId)
    .eq("user_id", authResult.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ thread: data });
}
