/**
 * Supabase Client for Server-Side Usage
 *
 * This client is used in Server Components, Route Handlers, and Server Actions
 * It uses cookies to maintain the user's session
 */

import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
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
 * Falls back to DEV_USER_ID in development when no auth session exists
 */
export async function requireUserId() {
  const user = await getCurrentUser()
  if (user) return user.id

  // Dev fallback: allow local development without auth
  if (process.env.NODE_ENV === 'development') {
    return process.env.DEV_USER_ID || 'dev-user-local'
  }

  throw new Error('Authentication required')
}
