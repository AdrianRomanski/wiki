import { WikiPageFrontmatter } from '@wiki/domain-models';

export interface EntityPageOptions {
  name: string;
  definition: string;
  properties?: string[];
  relationships?: {
    target: string;
    description: string;
  }[];
  examples?: string[];
  tags?: string[];
  sources?: string[];
  created?: string;
}

export interface ConceptPageOptions {
  name: string;
  explanation: string;
  applications?: string[];
  relatedConcepts?: string[];
  examples?: string[];
  tags?: string[];
  sources?: string[];
  created?: string;
}

export interface SourceSummaryOptions {
  title: string;
  author?: string;
  date?: string;
  url?: string;
  sourceType?: 'article' | 'paper' | 'code' | 'note';
  rawSourcePath?: string;
  keyPoints: string[];
  insights?: string;
  relevantEntities?: string[];
  relevantConcepts?: string[];
  quotes?: string[];
  tags?: string[];
  created?: string;
}

export interface GeneratedPage {
  content: string;
  filename: string;
  frontmatter: WikiPageFrontmatter;
}
