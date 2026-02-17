/**
 * Supabase Client for Server-Side Usage
 *
 * Two clients available:
 * - createClient(): Uses anon key + cookies (for auth-aware operations)
 * - createAdminClient(): Uses service role key (bypasses RLS for API routes)
 */

import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Auth-aware client with cookies (for Server Components)
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required')
  }

  const { createServerClient } = await import('@supabase/ssr')
  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored in Server Components
          }
        },
      },
    }
  )
}

/**
 * Admin client that bypasses RLS (for API Route Handlers)
 * Uses SUPABASE_SERVICE_ROLE_KEY - never expose to client
 */
export async function createAdminClient(): Promise<SupabaseClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase URL and Service Role Key are required for admin client')
  }

  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
}

/**
 * Get the current user from the server-side session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Get the current user's ID from the server-side session
 * Falls back to DEV_USER_ID env var when no auth session exists
 *
 * TODO: Remove fallback once Supabase Auth login UI is implemented
 */
export async function requireUserId() {
  try {
    const user = await getCurrentUser()
    if (user) return user.id
  } catch {
    // Supabase auth failed (missing config, network error, etc.)
  }

  // Fallback: use DEV_USER_ID from env (works in dev and prod)
  const fallbackId = process.env.DEV_USER_ID
  if (fallbackId) return fallbackId

  // Final fallback for development
  if (process.env.NODE_ENV === 'development') {
    return 'dev-user-local'
  }

  // Production without DEV_USER_ID: use a fixed UUID for anonymous access
  // This allows the app to work without auth until login UI is built
  return '00000000-0000-0000-0000-000000000000'
}
