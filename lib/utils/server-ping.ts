/**
 * Returns the current server timestamp as an ISO 8601 string.
 * Useful for server-side time calculations and client-server time synchronization.
 */
export function getServerTimestamp(): string {
  return new Date().toISOString();
}
