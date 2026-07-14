/**
 * Shared in-memory FakeFrontmatterPort test double for application-wiki-publisher specs.
 *
 * Provides a minimal but faithful round-trip of a WikiPageFrontmatter block through a
 * simple YAML-like format (one `key: value` per line, arrays as `[a, b, c]`), sufficient
 * for the author/publication-source page append paths exercised in these tests.
 *
 * This is a local copy of the fake used by `@wiki/application-research-session`
 * (task 7.2) to avoid a cross-dependency from application-wiki-publisher onto
 * application-research-session.
 */

import type { FrontmatterPort, ParsedFrontmatter } from '@wiki/application-ports';
import type { WikiPageFrontmatter } from '@wiki/domain-models';

export class FakeFrontmatterPort implements FrontmatterPort {
  parseFrontmatter(markdownContent: string): ParsedFrontmatter {
    const match = markdownContent.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) {
      throw new Error('FakeFrontmatterPort: no frontmatter block found');
    }

    const [, rawFrontmatter, content] = match;
    const data: Record<string, unknown> = {};

    for (const line of rawFrontmatter.split('\n')) {
      if (!line.trim()) continue;
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) continue;
      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      data[key] = parseValue(rawValue);
    }

    return {
      frontmatter: data as WikiPageFrontmatter,
      content: content.trim(),
    };
  }

  generateFrontmatter(frontmatter: WikiPageFrontmatter, content = ''): string {
    const record = frontmatter as unknown as Record<string, unknown>;
    const lines: string[] = ['---'];

    for (const [key, value] of Object.entries(record)) {
      if (value === undefined) continue;
      lines.push(`${key}: ${serializeValue(value)}`);
    }

    lines.push('---');

    return `${lines.join('\n')}\n\n${content}`;
  }

  createFrontmatter(partial: Partial<WikiPageFrontmatter>): WikiPageFrontmatter {
    const now = new Date().toISOString().split('T')[0];
    return {
      title: partial.title ?? '',
      type: partial.type ?? 'entity',
      tags: partial.tags ?? [],
      sources: partial.sources,
      author: partial.author,
      date: partial.date,
      url: partial.url,
      created: partial.created ?? now,
      updated: partial.updated ?? now,
    };
  }

  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter {
    const now = new Date().toISOString().split('T')[0];
    return { ...frontmatter, updated: now };
  }
}

function parseValue(raw: string): unknown {
  if (raw.startsWith('[') && raw.endsWith(']')) {
    const inner = raw.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => stripQuotes(item.trim()));
  }
  return stripQuotes(raw);
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function serializeValue(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => String(item)).join(', ')}]`;
  }
  if (typeof value === 'string') {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return String(value);
}
