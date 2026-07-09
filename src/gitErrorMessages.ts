/**
 * GitShift - Friendly git error messages
 *
 * Raw git stderr (rejected pushes, hints, scope errors, etc.) is accurate
 * but unreadable for non-technical users. This module recognizes common
 * failure shapes and maps them to a plain-language explanation, plus an
 * optional suggested action the UI can offer as a button.
 */

export type PushErrorKind = 'non-fast-forward' | 'workflow-scope' | 'unknown';

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
 * Detects GitHub's rejection of pushes that create/modify files under
 * `.github/workflows/` when the credential used lacks the `workflow` scope.
 */
export function isWorkflowScopeError(message: string | undefined): boolean {
  if (!message) return false;
  return (
    /refusing to allow.*(oauth app|token).*workflow/i.test(message) ||
    /without [`']workflow[`'] scope/i.test(message)
  );
}

/**
 * Classifies a push error message into a known kind, or 'unknown' if it
 * doesn't match a recognized pattern.
 */
export function classifyPushError(message: string | undefined): PushErrorKind {
  if (isWorkflowScopeError(message)) return 'workflow-scope';
  if (isNonFastForwardError(message)) return 'non-fast-forward';
  return 'unknown';
}

/**
 * Returns a simple, actionable message for a push failure. Falls back to
 * the original error message when it doesn't match a known pattern.
 */
export function getFriendlyPushErrorMessage(message: string | undefined): string {
  switch (classifyPushError(message)) {
    case 'non-fast-forward':
      return "The GitHub repo has changes you don't have on your computer yet. Click \"Pull\" to get those changes, then try pushing again.";
    case 'workflow-scope':
      return "This push includes changes to a workflow file (in .github/workflows/), and your current GitHub sign-in isn't allowed to update those. If you signed in with GitHub, click \"Sign In Again\" to grant that permission. If you're using a Personal Access Token, edit it on GitHub.com and turn on the \"workflow\" scope, then try again.";
    default:
      return message || 'Unknown error';
  }
}
