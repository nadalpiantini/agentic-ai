import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function getAuthenticatedUser(): Promise<
  | { user: User; error: null }
  | { user: null; error: string; response: NextResponse }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: "Unauthorized",
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, error: null };
}

export async function requireAuthenticatedUser(): Promise<
  | { user: User; error: null }
  | { user: null; error: string; response: NextResponse }
> {
  const result = await getAuthenticatedUser();

  if (!result.user) {
    return result;
  }

  return { user: result.user, error: null };
}
