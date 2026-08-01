export function extractWikiLinks(content: string): string[] {
  const wikiLinkPattern = /(?<!\\)\[\[([^[\]]+?)\]\]/g;
  const titles = new Set<string>();

  let match: RegExpExecArray | null;
  while ((match = wikiLinkPattern.exec(content)) !== null) {
    let target = match[1];

    if (!target.trim()) {
      continue;
    }

    const pipeIndex = target.indexOf('|');
    if (pipeIndex !== -1) {
      target = target.substring(0, pipeIndex);
    }

    const hashIndex = target.indexOf('#');
    if (hashIndex !== -1) {
      target = target.substring(0, hashIndex);
    }

    const trimmed = target.trim();
    if (trimmed) {
      titles.add(trimmed);
    }
  }

  return Array.from(titles);
}
