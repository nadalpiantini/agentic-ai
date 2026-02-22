/**
 * Returns the current server timestamp as an ISO 8601 string.
 * Useful for health checks and verifying server connectivity.
 */
export function getServerTimestamp(): string {
  return new Date().toISOString();
}
