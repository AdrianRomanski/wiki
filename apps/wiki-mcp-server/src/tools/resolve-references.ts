/**
 * Tool Handler: wiki_resolve_references
 *
 * Resolves outgoing and incoming cross-references for a page.
 */

import { WikiIndex, ResolveRefsResult } from '../types';

/**
 * Handles the wiki_resolve_references tool invocation.
 * Returns { error: string } if the page is not found.
 */
export function handleResolveReferences(
  index: WikiIndex,
  params: { title: string }
): ResolveRefsResult | { error: string } {
  const normalizedTitle = params.title.toLowerCase();
  const meta = index.pages.get(normalizedTitle);

  if (!meta) {
    return { error: `Page not found: "${params.title}"` };
  }

  // Outgoing links with exists flag
  const outgoing = meta.outgoingLinks.map((linkTitle) => ({
    title: linkTitle,
    exists: index.pages.has(linkTitle.toLowerCase()),
  }));

  // Incoming links (backlinks)
  const incoming = index.backlinks.get(normalizedTitle) ?? [];

  return { outgoing, incoming };
}
