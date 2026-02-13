import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Explicit environment variables for Vercel Edge Runtime compatibility
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            try {
              cookieStore.set(name, value, options);
            } catch {
              // setAll is called from a Server Component where cookies
              // cannot be modified. This can safely be ignored when
              // middleware is refreshing auth tokens.
            }
          }
        },
      },
    }
  );
}
