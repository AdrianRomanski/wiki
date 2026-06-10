import { Section } from '@wiki/domain-models';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
  suggestions?: string[];
}

export interface MarkdownPort {
  parseMarkdownSections(content: string): Section[];
  extractWikiLinks(content: string): string[];
  generateWikiLink(target: string, displayText?: string, section?: string): string;
  generateHeading(text: string, level: number): string;
  generateList(items: string[], ordered?: boolean, indent?: number): string;
  generateCodeBlock(code: string, language?: string): string;
  generateBlockquote(text: string): string;
  generateTable(headers: string[], rows: string[][]): string;
  validateMarkdownSyntax(content: string): ValidationResult;
  sectionsToMarkdown(sections: Section[]): string;
  escapeMarkdown(text: string): string;
}
