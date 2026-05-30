/**
 * Pasted text acceptance for the Article_Fetcher subsystem
 * Feature: article-research-session
 * Requirements: 2.4
 *
 * Accepts pasted content directly without making any network request.
 * Validates that the input contains at least 1 non-whitespace character.
 * Returns the validated text content on success.
 */

/**
 * Accepts pasted text content directly without network request.
 *
 * The function validates that the input contains at least one non-whitespace
 * character. If valid, it returns the text as-is (preserving original content
 * including any URLs that may be present in the text).
 *
 * @param text - The pasted text content from the user
 * @returns The validated text content
 * @throws Error if the input is empty or contains only whitespace
 */
export function acceptPastedText(text: string): string {
  if (!text || text.trim().length === 0) {
    throw new Error(
      'Pasted text must contain at least 1 non-whitespace character'
    );
  }

  return text;
}
