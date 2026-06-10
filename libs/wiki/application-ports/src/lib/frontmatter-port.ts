import { WikiPageFrontmatter } from '@wiki/domain-models';

export interface ParsedFrontmatter {
  frontmatter: WikiPageFrontmatter;
  content: string;
}

export interface FrontmatterPort {
  parseFrontmatter(markdownContent: string): ParsedFrontmatter;
  generateFrontmatter(frontmatter: WikiPageFrontmatter, content?: string): string;
  createFrontmatter(partial: Partial<WikiPageFrontmatter>): WikiPageFrontmatter;
  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter;
}
