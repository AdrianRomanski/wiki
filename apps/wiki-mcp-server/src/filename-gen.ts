/**
 * Filename Generator - Generates filenames following wiki naming conventions.
 *
 * Entity/concept: kebab-case-noun.md
 * Source: source-title-yyyy-mm-dd.md
 */

const MAX_FILENAME_LENGTH = 100;

/**
 * Converts a title string to kebab-case.
 * - Lowercases the string
 * - Replaces spaces and non-alphanumeric characters with hyphens
 * - Collapses multiple consecutive hyphens into one
 * - Trims leading/trailing hyphens
 */
function toKebabCase(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generates a filename for a new wiki page based on title and type.
 *
 * - Entity/concept: `kebab-case-title.md`
 * - Source: `source-kebab-title-yyyy-mm-dd.md` (uses current date)
 *
 * Handles edge cases: special characters, unicode, and very long titles
 * (truncated at 100 characters before the extension).
 */
export function generateFileName(title: string, type: 'entity' | 'concept' | 'source'): string {
  const kebab = toKebabCase(title);

  if (type === 'source') {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateSuffix = `${yyyy}-${mm}-${dd}`;

    // "source-" (7) + "-" (1) + date (10) = 18 chars reserved
    const maxKebabLength = MAX_FILENAME_LENGTH - 18;
    const truncatedKebab = truncateAtHyphen(kebab, maxKebabLength);

    return `source-${truncatedKebab}-${dateSuffix}.md`;
  }

  // Entity or concept
  const truncatedKebab = truncateAtHyphen(kebab, MAX_FILENAME_LENGTH);
  return `${truncatedKebab}.md`;
}

/**
 * Truncates a kebab-case string to a maximum length, cutting at a hyphen
 * boundary when possible to avoid splitting words. Removes trailing hyphens.
 */
function truncateAtHyphen(kebab: string, maxLength: number): string {
  if (kebab.length <= maxLength) {
    return kebab;
  }

  const truncated = kebab.slice(0, maxLength);
  // Try to cut at the last hyphen to avoid splitting a word
  const lastHyphen = truncated.lastIndexOf('-');
  if (lastHyphen > 0) {
    return truncated.slice(0, lastHyphen);
  }
  return truncated.replace(/-+$/, '');
}
