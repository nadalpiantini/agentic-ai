/**
 * Gets the current server timestamp in ISO 8601 format.
 * Useful for server-side time operations and ping utilities.
 */
export function getServerTimestamp(): string {
  return new Date().toISOString();
}
