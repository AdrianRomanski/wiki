import { WikiIndex, ListPagesResult } from '../models/types';

export function handleListPages(
  index: WikiIndex,
  params: { type?: string; tag?: string }
): ListPagesResult {
  const { type, tag } = params;

  let pages = Array.from(index.pages.values());

  if (type) {
    pages = pages.filter((page) => page.type === type);
  }

  if (tag) {
    const normalizedTag = tag.toLowerCase();
    pages = pages.filter((page) =>
      page.tags.some((t) => t.toLowerCase() === normalizedTag)
    );
  }

  pages.sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  );

  return {
    pages: pages.map((page) => ({
      title: page.title,
      type: page.type,
      tags: page.tags,
      filePath: page.filePath,
    })),
  };
}
