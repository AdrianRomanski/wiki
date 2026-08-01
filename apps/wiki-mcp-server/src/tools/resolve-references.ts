import { WikiIndex, ResolveRefsResult } from '../models/types';

export function handleResolveReferences(
  index: WikiIndex,
  params: { title: string }
): ResolveRefsResult | { error: string } {
  const normalizedTitle = params.title.toLowerCase();
  const meta = index.pages.get(normalizedTitle);

  if (!meta) {
    return { error: `Page not found: "${params.title}"` };
  }

  const outgoing = meta.outgoingLinks.map((linkTitle) => ({
    title: linkTitle,
    exists: index.pages.has(linkTitle.toLowerCase()),
  }));

  const incoming = index.backlinks.get(normalizedTitle) ?? [];

  return { outgoing, incoming };
}
