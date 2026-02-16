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

/**
 * Create a Supabase admin client with service role privileges
 * This client bypasses RLS and has full access to the database
 *
 * WARNING: Only use this in trusted server-side environments!
 */
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

/**
 * Singleton admin client instance
 * Use for operations that require elevated privileges
 */
export const supabaseAdmin = createAdminClient()

/**
 * Batch insert documents with embeddings
 * This is typically done server-side during document ingestion
 */
export async function insertDocuments(
  documents: Array<{
    content: string
    embedding: number[]
    metadata?: Record<string, unknown>
  }>
) {
  const { data, error } = await (supabaseAdmin.from('documents') as any)
    .insert(
      documents.map(doc => ({
        content: doc.content,
        embedding: doc.embedding as any, // pgvector type
        metadata: doc.metadata || {}
      }))
    )
    .select()

  if (error) {
    throw new Error(`Failed to insert documents: ${error.message}`)
  }

  return data
}

/**
 * Delete documents by metadata filter
 * Useful for document management and cleanup
 */
export async function deleteDocuments(metadataFilter: Record<string, unknown>) {
  const { error } = await (supabaseAdmin.from('documents') as any)
    .delete()
    .filter('metadata', 'eq', metadataFilter as any)

  if (error) {
    throw new Error(`Failed to delete documents: ${error.message}`)
  }
}
