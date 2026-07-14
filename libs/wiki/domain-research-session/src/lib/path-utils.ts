/**
 * Path utilities for the research workflow
 * Feature: polished-research-workflow
 * Requirement 9.7: Organize artifacts in structured session directory with clear naming conventions
 *
 * This is a pure Domain Layer module: it performs no I/O and must not depend
 * on Node.js built-ins (e.g. the `path` module), so it can be bundled for any
 * target (Node, browser, etc.) without a module-resolution shim.
 */

/**
 * Returns true if `filePath` is an absolute path on POSIX or Windows.
 * Pure string check — equivalent in effect to Node's `path.isAbsolute`,
 * but with no dependency on the `path` module.
 */
function isAbsolutePath(filePath: string): boolean {
  // POSIX absolute path: starts with '/'
  if (filePath.startsWith('/')) {
    return true;
  }

  // Windows absolute path: drive letter (e.g. "C:\" or "C:/"), or UNC path (e.g. "\\server\share")
  if (/^[a-zA-Z]:[\\/]/.test(filePath)) {
    return true;
  }
  if (filePath.startsWith('\\\\')) {
    return true;
  }

  return false;
}

/**
 * Validates a file path for safety (no directory traversal, valid characters)
 */
export function validatePath(filePath: string): boolean {
  // Reject empty paths
  if (!filePath || filePath.trim().length === 0) {
    return false;
  }

  // Reject directory traversal attempts
  if (filePath.includes('..')) {
    return false;
  }

  // Reject absolute paths
  if (isAbsolutePath(filePath)) {
    return false;
  }

  // Reject paths with null bytes
  if (filePath.includes('\0')) {
    return false;
  }

  // Reject paths that are too long (255 chars per segment, 4096 total)
  if (filePath.length > 4096) {
    return false;
  }

  const segments = filePath.split(/[\\/]/);
  for (const segment of segments) {
    if (segment.length > 255) {
      return false;
    }
  }

  return true;
}

/**
 * Sanitizes a string for use in file/directory names.
 * Removes or replaces unsafe characters while preserving readability.
 */
export function sanitizeName(name: string): string {
  return name
    .replace(/^@/, '')           // Remove leading @ (scoped packages)
    .replace(/\//g, '-')         // Replace slashes with dashes
    .replace(/[^\w.-]/g, '-')    // Replace non-word chars (except . and -) with dashes
    .replace(/-+/g, '-')         // Collapse multiple dashes
    .replace(/^-|-$/g, '')       // Remove leading/trailing dashes
    .toLowerCase()
    .substring(0, 100);          // Limit length
}
