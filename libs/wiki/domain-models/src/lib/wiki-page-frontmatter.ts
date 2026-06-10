export interface WikiPageFrontmatter {
  title: string;
  type: 'entity' | 'concept' | 'source';
  tags: string[];
  sources?: string[];
  author?: string;
  date?: string;
  url?: string;
  created: string;
  updated: string;
}
