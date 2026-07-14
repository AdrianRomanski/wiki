/**
 * Session ID generation utility
 * Feature: article-research-session
 * Requirements: 1.1, 10.2
 *
 * Converts a topic string into a valid kebab-case session ID:
 * - Lowercase all characters
 * - Replace spaces and special characters with hyphens
 * - Collapse consecutive hyphens
 * - Strip leading/trailing hyphens
 * - Truncate to a maximum of 80 characters
 * - Handle unicode characters, empty strings, and edge cases
 */

/** Maximum length for a generated session ID */
const MAX_SESSION_ID_LENGTH = 80;

/**
 * Generates a kebab-case session ID from a topic string.
 *
 * The generated ID will:
 * - Be lowercase
 * - Contain only alphanumeric characters [a-z0-9] and hyphens
 * - Not begin or end with a hyphen
 * - Have a maximum length of 80 characters
 *
 * @param topic - The human-readable research topic
 * @returns A valid kebab-case session ID
 * @throws Error if the topic is empty or produces an empty ID after processing
 */
export function generateSessionId(topic: string): string {
  if (!topic || topic.trim().length === 0) {
    throw new Error('Topic must be a non-empty string');
  }

  let id = topic;

  // Normalize unicode: decompose accented characters into base + combining marks
  id = id.normalize('NFKD');

  // Remove combining diacritical marks (accents, tildes, etc.)
  id = id.replace(/[\u0300-\u036f]/g, '');

  // Lowercase
  id = id.toLowerCase();

  // Replace any character that is not alphanumeric (a-z, 0-9) with a hyphen
  id = id.replace(/[^a-z0-9]/g, '-');

  // Collapse consecutive hyphens into a single hyphen
  id = id.replace(/-+/g, '-');

  // Strip leading and trailing hyphens
  id = id.replace(/^-+|-+$/g, '');

  // Truncate to max length, ensuring we don't cut in the middle and leave a trailing hyphen
  if (id.length > MAX_SESSION_ID_LENGTH) {
    id = id.substring(0, MAX_SESSION_ID_LENGTH);
    // Remove any trailing hyphen that may result from truncation
    id = id.replace(/-+$/, '');
  }

  // If after all processing the ID is empty, throw
  if (id.length === 0) {
    throw new Error(
      'Topic contains no alphanumeric characters and cannot produce a valid session ID'
    );
  }

  return id;
}
