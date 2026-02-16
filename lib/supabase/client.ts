/**
 * Supabase Client for Client-Side Usage
 *
 * This client is used in browser environments (React components, hooks)
 * It uses the anonymous key and respects RLS policies based on the user's session
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Singleton instance for client-side usage
 * Use this in React components through hooks
 */
export const supabase = createClient()
