import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { v5 as uuidv5 } from "uuid";

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

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const userIdString = req.headers.get("x-user-id") || "default-user";
    const userId = generateUserUUID(userIdString);

    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ threads: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const userIdString = req.headers.get("x-user-id") || "default-user";
    const userId = generateUserUUID(userIdString);
    const body = await req.json();
    const title = body.title || "New Chat";

    console.log("[POST /api/threads] Creating thread:", { userId, title });

    const { data, error } = await supabase
      .from("threads")
      .insert({
        user_id: userId,
        title: title,
      })
      .select()
      .single();

    if (error) {
      console.error("[POST /api/threads] Supabase error:", error);
      throw error;
    }

    console.log("[POST /api/threads] Thread created:", data);
    return NextResponse.json({ thread: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[POST /api/threads] Exception:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
