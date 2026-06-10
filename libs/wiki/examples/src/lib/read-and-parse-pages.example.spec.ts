import { describe, it, expect } from 'vitest';
import {
  readSinglePageExample,
  parseFrontmatterExample,
  parseMarkdownSectionsExample,
  extractWikiLinksExample,
  findBacklinksExample,
  readPagesByTypeExample,
  searchPagesExample,
} from './read-and-parse-pages.example';

describe('Read and Parse Pages Examples', () => {
  describe('readSinglePageExample', () => {
    it('should be a function that reads and parses wiki pages', () => {
      expect(typeof readSinglePageExample).toBe('function');
    });
  });

  describe('parseFrontmatterExample', () => {
    it('should be a function that extracts frontmatter', () => {
      expect(typeof parseFrontmatterExample).toBe('function');
    });
  });

  describe('parseMarkdownSectionsExample', () => {
    it('should be a function that parses markdown sections', () => {
      expect(typeof parseMarkdownSectionsExample).toBe('function');
    });
  });

  describe('extractWikiLinksExample', () => {
    it('should be a function that extracts WikiLinks', () => {
      expect(typeof extractWikiLinksExample).toBe('function');
    });
  });

  describe('findBacklinksExample', () => {
    it('should be a function that finds backlinks', () => {
      expect(typeof findBacklinksExample).toBe('function');
    });
  });

  describe('readPagesByTypeExample', () => {
    it('should be a function that reads pages by type', () => {
      expect(typeof readPagesByTypeExample).toBe('function');
    });
  });

  describe('searchPagesExample', () => {
    it('should be a function that searches pages', () => {
      expect(typeof searchPagesExample).toBe('function');
    });
  });
});
