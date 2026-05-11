/**
 * A default retry function that disables retries for all queries.
 * This can be replaced with a more advanced strategy if needed.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const noRetry = (_failureCount: number, _error: unknown): boolean => {
  return false;
};
