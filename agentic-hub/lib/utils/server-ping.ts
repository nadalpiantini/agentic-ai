/**
 * Gets the current server timestamp as an ISO string.
 * @returns The current UTC timestamp in ISO 8601 format.
 */
export function getServerTimestamp(): string {
  return new Date().toISOString();
}
