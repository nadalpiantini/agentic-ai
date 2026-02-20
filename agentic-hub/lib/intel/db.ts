/**
 * Intel DB — NRS SQLite Database Access
 *
 * Opens the NRS (Neglect Recognition System) SQLite database using Node.js
 * built-in node:sqlite module (available in Node.js 22+).
 *
 * Database location defaults to ~/.openclaw/workspace-sephirot/squadron-watchdog/memory/nrs.db
 * Override with NRS_DB_PATH environment variable.
 */

// @ts-expect-error -- node:sqlite is experimental in Node 22+
import { DatabaseSync } from 'node:sqlite'
import path from 'path'

const NRS_DB_PATH = process.env.NRS_DB_PATH
  || path.join(process.env.HOME || '', '.openclaw/workspace-sephirot/squadron-watchdog/memory/nrs.db')

let db: DatabaseSync | null = null

export function getIntelDB(): DatabaseSync {
  if (!db) {
    db = new DatabaseSync(NRS_DB_PATH)
  }
  return db
}

const DROPALERT_CATEGORIES = [
  'ssl_critical_expiry',
  'site_down_extended',
  'orphan_domain_available',
]

const SHADOWWATCH_CATEGORIES = [
  'ssl_pattern_late_renewal',
  'repeated_small_failures',
  'infra_stagnation',
  'erratic_dns_changes',
]

const ASSETHUNTER_CATEGORIES = [
  'unmaintained_working_domain',
  'dead_email_mx',
  'public_repo_valuable_fork',
]

export function getSquadronType(
  category: string
): 'dropalert' | 'shadowwatch' | 'assethunter' | 'nrs' {
  if (DROPALERT_CATEGORIES.includes(category)) return 'dropalert'
  if (SHADOWWATCH_CATEGORIES.includes(category)) return 'shadowwatch'
  if (ASSETHUNTER_CATEGORIES.includes(category)) return 'assethunter'
  return 'nrs'
}

/**
 * Map a squadron type back to its corresponding category list.
 * Returns undefined for 'nrs' (catch-all type with no fixed category list).
 */
export function getSquadronCategories(
  type: 'dropalert' | 'shadowwatch' | 'assethunter' | 'nrs'
): string[] | undefined {
  switch (type) {
    case 'dropalert':
      return DROPALERT_CATEGORIES
    case 'shadowwatch':
      return SHADOWWATCH_CATEGORIES
    case 'assethunter':
      return ASSETHUNTER_CATEGORIES
    default:
      return undefined
  }
}

export { DROPALERT_CATEGORIES, SHADOWWATCH_CATEGORIES, ASSETHUNTER_CATEGORIES }
