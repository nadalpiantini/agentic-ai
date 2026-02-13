import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Security: Only allow from localhost or with admin key
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Execute migration to change user_id from uuid to text
    const { error } = await supabase.rpc("execute_migration", {
      sql: `
        alter table public.threads
        drop constraint threads_user_id_fkey;

        alter table public.messages
        drop constraint messages_user_id_fkey;

        alter table public.threads
        alter column user_id type text using user_id::text;

        alter table public.messages
        alter column user_id type text using user_id::text;
      `,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Migration executed successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Migration failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
