import { Section } from './section';
import { WikiPageFrontmatter } from './wiki-page-frontmatter';

export interface WikiPage {
  path: string;
  filename: string;
  frontmatter: WikiPageFrontmatter;
  content: string;
  sections: Section[];
  outgoingLinks: string[];
  incomingLinks: string[];
}
