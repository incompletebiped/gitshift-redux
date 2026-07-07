/**
 * GitShift - Friendly git error messages
 *
 * Raw git stderr (rejected pushes, hints, etc.) is accurate but unreadable
 * for non-technical users. This module recognizes a few common failure
 * shapes and maps them to a plain-language explanation + suggested action.
 */

/**
 * Detects the classic "non-fast-forward" push rejection, i.e. the remote
 * has commits the local branch doesn't have yet.
 */
export function isNonFastForwardError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    /\[rejected\]/i.test(message) ||
    /\(fetch first\)/i.test(message) ||
    /non-fast-forward/i.test(message) ||
    /updates were rejected because the remote contains work/i.test(message)
  );
}

/**
 * Returns a simple, actionable message for a push failure. Falls back to
 * the original error message when it doesn't match a known pattern.
 */
export function getFriendlyPushErrorMessage(message: string | undefined): string {
  if (isNonFastForwardError(message)) {
    return "The GitHub repo has changes you don't have on your computer yet. Click \"Pull\" to get those changes, then try pushing again.";
  }
  return message || 'Unknown error';
}
