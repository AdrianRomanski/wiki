import * as grayMatter from 'gray-matter';
import { FrontmatterPort, ParsedFrontmatter } from '@wiki/application-ports';
import { WikiPageFrontmatter } from '@wiki/domain-models';
import { FrontmatterValidationError } from './frontmatter-validation-error';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const matter = (grayMatter as any).default || grayMatter;

export class FrontmatterAdapter implements FrontmatterPort {
  parseFrontmatter(markdownContent: string): ParsedFrontmatter {
    const parsed = matter(markdownContent);
    
    if (!parsed.data || Object.keys(parsed.data).length === 0) {
      throw new FrontmatterValidationError('Frontmatter is missing or empty');
    }
    
    const frontmatter = parsed.data as Partial<WikiPageFrontmatter>;
    
    this.validateRequiredFields(frontmatter);
    
    return {
      frontmatter: frontmatter as WikiPageFrontmatter,
      content: parsed.content.trim(),
    };
  }

  generateFrontmatter(
    frontmatter: WikiPageFrontmatter,
    content = ''
  ): string {
    this.validateRequiredFields(frontmatter);
    
    const cleanFrontmatter: Record<string, unknown> = {
      title: frontmatter.title,
      type: frontmatter.type,
      tags: frontmatter.tags,
      created: frontmatter.created,
      updated: frontmatter.updated,
    };
    
    if (frontmatter.sources !== undefined) {
      cleanFrontmatter['sources'] = frontmatter.sources;
    }
    if (frontmatter.author !== undefined) {
      cleanFrontmatter['author'] = frontmatter.author;
    }
    if (frontmatter.date !== undefined) {
      cleanFrontmatter['date'] = frontmatter.date;
    }
    if (frontmatter.url !== undefined) {
      cleanFrontmatter['url'] = frontmatter.url;
    }
    
    const markdown = matter.stringify(content, cleanFrontmatter);
    
    return markdown;
  }

  createFrontmatter(
    partial: Partial<WikiPageFrontmatter>
  ): WikiPageFrontmatter {
    const now = new Date().toISOString().split('T')[0];
    
    if (!partial.title || !partial.type) {
      throw new FrontmatterValidationError(
        'Title and type are required to create frontmatter'
      );
    }
    
    return {
      title: partial.title,
      type: partial.type,
      tags: partial.tags || [],
      sources: partial.sources,
      author: partial.author,
      date: partial.date,
      url: partial.url,
      created: partial.created || now,
      updated: partial.updated || now,
    };
  }

  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter {
    const now = new Date().toISOString().split('T')[0];
    
    return {
      ...frontmatter,
      updated: now,
    };
  }

  private validateRequiredFields(frontmatter: Partial<WikiPageFrontmatter>): void {
    const requiredFields: (keyof WikiPageFrontmatter)[] = [
      'title',
      'type',
      'tags',
      'created',
      'updated',
    ];
    
    for (const field of requiredFields) {
      if (!(field in frontmatter) || frontmatter[field] === undefined || frontmatter[field] === null) {
        throw new FrontmatterValidationError(
          `Required field '${field}' is missing`,
          field
        );
      }
    }
    
    if (typeof frontmatter.title !== 'string' || frontmatter.title.trim() === '') {
      throw new FrontmatterValidationError(
        'Field "title" must be a non-empty string',
        'title'
      );
    }
    
    if (!['entity', 'concept', 'source'].includes(frontmatter.type as string)) {
      throw new FrontmatterValidationError(
        'Field "type" must be one of: entity, concept, source',
        'type'
      );
    }
    
    if (!Array.isArray(frontmatter.tags)) {
      throw new FrontmatterValidationError(
        'Field "tags" must be an array',
        'tags'
      );
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((frontmatter.created as any) instanceof Date) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      frontmatter.created = (frontmatter.created as any).toISOString().split('T')[0];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((frontmatter.updated as any) instanceof Date) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      frontmatter.updated = (frontmatter.updated as any).toISOString().split('T')[0];
    }
    
    if (typeof frontmatter.created !== 'string' || !this.isValidDateString(frontmatter.created)) {
      throw new FrontmatterValidationError(
        'Field "created" must be a valid ISO date string (YYYY-MM-DD)',
        'created'
      );
    }
    
    if (typeof frontmatter.updated !== 'string' || !this.isValidDateString(frontmatter.updated)) {
      throw new FrontmatterValidationError(
        'Field "updated" must be a valid ISO date string (YYYY-MM-DD)',
        'updated'
      );
    }
    
    if (frontmatter.sources !== undefined && !Array.isArray(frontmatter.sources)) {
      throw new FrontmatterValidationError(
        'Field "sources" must be an array',
        'sources'
      );
    }
    
    if (frontmatter.author !== undefined && typeof frontmatter.author !== 'string') {
      throw new FrontmatterValidationError(
        'Field "author" must be a string',
        'author'
      );
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((frontmatter.date as any) instanceof Date) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      frontmatter.date = (frontmatter.date as any).toISOString().split('T')[0];
    }
    
    if (frontmatter.date !== undefined && typeof frontmatter.date !== 'string') {
      throw new FrontmatterValidationError(
        'Field "date" must be a string',
        'date'
      );
    }
    
    if (frontmatter.url !== undefined && typeof frontmatter.url !== 'string') {
      throw new FrontmatterValidationError(
        'Field "url" must be a string',
        'url'
      );
    }
  }

  private isValidDateString(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}
