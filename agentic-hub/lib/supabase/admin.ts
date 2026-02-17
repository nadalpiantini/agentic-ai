/**
 * Supabase Admin Client for Server-Side Operations
 *
 * This client bypasses RLS policies and should ONLY be used in:
 * - Server-side code (API routes, Server Components, Server Actions)
 * - Operations that require elevated privileges (e.g., inserting documents)
 * - Never use this in client-side code or expose the service role key
 */

import { createClient as supabaseCreateClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return supabaseCreateClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export const supabaseAdmin = createAdminClient()

export async function insertDocuments(
  documents: Array<{
    content: string
    embedding: number[]
    metadata?: Record<string, unknown>
  }>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase v2.95 types don't resolve Insert generics for documents table
  const { data, error } = await (supabaseAdmin.from('documents') as any)
    .insert(
      documents.map(doc => ({
        content: doc.content,
        embedding: doc.embedding,
        metadata: doc.metadata || {}
      }))
    )
    .select()

  if (error) {
    throw new Error(`Failed to insert documents: ${error.message}`)
  }

  return data
}

export async function deleteDocuments(metadataFilter: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase v2.95 types don't resolve delete filter generics
  const { error } = await (supabaseAdmin.from('documents') as any)
    .delete()
    .filter('metadata', 'eq', metadataFilter)

  if (error) {
    throw new Error(`Failed to delete documents: ${error.message}`)
  }
}
