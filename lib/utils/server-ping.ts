/**
 * Returns the current server timestamp as an ISO string.
 * Useful for ping checks and server-side time synchronization.
 *
 * @returns The current UTC timestamp in ISO 8601 format (e.g., "2025-02-22T10:30:00.000Z")
 */
export function getServerTimestamp(): string {
  return new Date().toISOString();
}
