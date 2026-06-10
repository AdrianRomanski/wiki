import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WikiPage } from '@wiki/domain-models';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';
import { SearchUseCase } from '@wiki/application-query';
import { SearchByTagUseCase } from '@wiki/application-query';
import { FindEntitiesUseCase } from '@wiki/application-query';
import { FindConceptsUseCase } from '@wiki/application-query';
import { FindSourcesUseCase } from '@wiki/application-query';

describe('Query and Search Examples', () => {
  let fileSystemAdapter: FileSystemAdapter;
  let frontmatterAdapter: FrontmatterAdapter;
  let markdownAdapter: MarkdownAdapter;

  beforeEach(() => {
    fileSystemAdapter = new FileSystemAdapter({
      rootDir: process.cwd(),
      rawDir: './raw',
      wikiDir: './wiki'
    });
    frontmatterAdapter = new FrontmatterAdapter();
    markdownAdapter = new MarkdownAdapter();
  });

  describe('fullTextSearchExample', () => {
    it('should initialize SearchUseCase correctly', () => {
      const searchUseCase = new SearchUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      expect(searchUseCase).toBeDefined();
      expect(searchUseCase.execute).toBeInstanceOf(Function);
    });

    it('should handle search with valid query', async () => {
      const searchUseCase = new SearchUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([]);

      const results = await searchUseCase.execute('Angular framework');

      expect(results).toBeInstanceOf(Array);
    });

    it('should return empty array when no pages exist', async () => {
      const searchUseCase = new SearchUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([]);

      const results = await searchUseCase.execute('nonexistent');

      expect(results).toEqual([]);
    });
  });

  describe('fullTextSearchWithOptionsExample', () => {
    it('should accept search options', async () => {
      const searchUseCase = new SearchUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([]);

      const options = {
        maxResults: 5,
        includeRelatedPages: true,
        caseSensitive: false,
        snippetLength: 200,
        sortByDate: false
      };

      const results = await searchUseCase.execute('component', options);

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('should respect maxResults option', async () => {
      const searchUseCase = new SearchUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      const mockPages = Array.from({ length: 10 }, (_, i) => ({
        path: `page-${i}.md`,
        filename: `page-${i}.md`,
        frontmatter: {
          title: `Page ${i}`,
          type: 'entity' as const,
          tags: ['test'],
          created: '2024-01-01',
          updated: '2024-01-01'
        },
        content: 'component test content',
        sections: [],
        outgoingLinks: [],
        incomingLinks: []
      }));

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue(
        mockPages.map(p => p.path)
      );

      vi.spyOn(fileSystemAdapter, 'readWikiFile').mockImplementation(async (path: string) => {
        const page = mockPages.find(p => p.path === path);
        if (!page) throw new Error('Page not found');
        
        const frontmatter = frontmatterAdapter.generateFrontmatter(page.frontmatter, page.content);
        return frontmatter;
      });

      const results = await searchUseCase.execute('component', { maxResults: 3 });

      expect(results.length).toBeLessThanOrEqual(3);
    });
  });

  describe('tagBasedSearchExample', () => {
    it('should initialize SearchByTagUseCase correctly', () => {
      const searchByTagUseCase = new SearchByTagUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      expect(searchByTagUseCase).toBeDefined();
      expect(searchByTagUseCase.execute).toBeInstanceOf(Function);
    });

    it('should search by tag', async () => {
      const searchByTagUseCase = new SearchByTagUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([]);

      const results = await searchByTagUseCase.execute('typescript');

      expect(results).toBeInstanceOf(Array);
    });

    it('should find pages with matching tags', async () => {
      const searchByTagUseCase = new SearchByTagUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      const mockPage: WikiPage = {
        path: 'typescript.md',
        filename: 'typescript.md',
        frontmatter: {
          title: 'TypeScript',
          type: 'entity',
          tags: ['typescript', 'language'],
          created: '2024-01-01',
          updated: '2024-01-01'
        },
        content: 'TypeScript content',
        sections: [],
        outgoingLinks: [],
        incomingLinks: []
      };

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue(['typescript.md']);
      vi.spyOn(fileSystemAdapter, 'readWikiFile').mockResolvedValue(
        frontmatterAdapter.generateFrontmatter(mockPage.frontmatter, mockPage.content)
      );

      const results = await searchByTagUseCase.execute('typescript');

      expect(results).toHaveLength(1);
      expect(results[0].frontmatter.title).toBe('TypeScript');
    });
  });

  describe('queryByPageTypeExample', () => {
    it('should initialize all type-specific use cases', () => {
      const findEntitiesUseCase = new FindEntitiesUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      const findConceptsUseCase = new FindConceptsUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      const findSourcesUseCase = new FindSourcesUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      expect(findEntitiesUseCase).toBeDefined();
      expect(findConceptsUseCase).toBeDefined();
      expect(findSourcesUseCase).toBeDefined();
    });

    it('should find entities', async () => {
      const findEntitiesUseCase = new FindEntitiesUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([]);

      const entities = await findEntitiesUseCase.execute();

      expect(entities).toBeInstanceOf(Array);
    });

    it('should find concepts matching pattern', async () => {
      const findConceptsUseCase = new FindConceptsUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([]);

      const concepts = await findConceptsUseCase.execute('pattern');

      expect(concepts).toBeInstanceOf(Array);
    });

    it('should find sources', async () => {
      const findSourcesUseCase = new FindSourcesUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([]);

      const sources = await findSourcesUseCase.execute();

      expect(sources).toBeInstanceOf(Array);
    });

    it('should filter pages by type correctly', async () => {
      const findEntitiesUseCase = new FindEntitiesUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      const mockEntity: WikiPage = {
        path: 'angular.md',
        filename: 'angular.md',
        frontmatter: {
          title: 'Angular',
          type: 'entity',
          tags: ['framework'],
          created: '2024-01-01',
          updated: '2024-01-01'
        },
        content: 'Angular content',
        sections: [],
        outgoingLinks: [],
        incomingLinks: []
      };

      const mockConcept: WikiPage = {
        path: 'dependency-injection.md',
        filename: 'dependency-injection.md',
        frontmatter: {
          title: 'Dependency Injection',
          type: 'concept',
          tags: ['pattern'],
          created: '2024-01-01',
          updated: '2024-01-01'
        },
        content: 'DI content',
        sections: [],
        outgoingLinks: [],
        incomingLinks: []
      };

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([
        'angular.md',
        'dependency-injection.md'
      ]);

      let callIndex = 0;
      vi.spyOn(fileSystemAdapter, 'readWikiFile').mockImplementation(async () => {
        const page = callIndex === 0 ? mockEntity : mockConcept;
        callIndex++;
        return frontmatterAdapter.generateFrontmatter(page.frontmatter, page.content);
      });

      const entities = await findEntitiesUseCase.execute();

      expect(entities).toHaveLength(1);
      expect(entities[0].frontmatter.type).toBe('entity');
    });
  });

  describe('combineMultipleCriteriaExample', () => {
    it('should combine tag search with type filtering', async () => {
      const searchByTagUseCase = new SearchByTagUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      const mockPages: WikiPage[] = [
        {
          path: 'angular.md',
          filename: 'angular.md',
          frontmatter: {
            title: 'Angular',
            type: 'entity',
            tags: ['angular', 'framework'],
            created: '2024-01-01',
            updated: '2024-01-01'
          },
          content: 'Angular content',
          sections: [],
          outgoingLinks: [],
          incomingLinks: []
        },
        {
          path: 'angular-guide.md',
          filename: 'angular-guide.md',
          frontmatter: {
            title: 'Angular Guide',
            type: 'source',
            tags: ['angular', 'documentation'],
            created: '2024-01-01',
            updated: '2024-01-01'
          },
          content: 'Guide content',
          sections: [],
          outgoingLinks: [],
          incomingLinks: []
        }
      ];

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue(
        mockPages.map(p => p.path)
      );

      let callIndex = 0;
      vi.spyOn(fileSystemAdapter, 'readWikiFile').mockImplementation(async () => {
        const page = mockPages[callIndex++];
        return frontmatterAdapter.generateFrontmatter(page.frontmatter, page.content);
      });

      const angularPages = await searchByTagUseCase.execute('angular');
      const angularEntities = angularPages.filter(page => page.frontmatter.type === 'entity');

      expect(angularPages).toHaveLength(2);
      expect(angularEntities).toHaveLength(1);
      expect(angularEntities[0].frontmatter.title).toBe('Angular');
    });

    it('should apply source filters', async () => {
      const findSourcesUseCase = new FindSourcesUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([]);

      const filters = {
        libraryName: 'angular'
      };

      const sources = await findSourcesUseCase.execute(filters);

      expect(sources).toBeInstanceOf(Array);
    });
  });

  describe('searchResultRankingExample', () => {
    it('should rank results by relevance', async () => {
      const searchUseCase = new SearchUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      const mockPages: WikiPage[] = [
        {
          path: 'dependency-injection.md',
          filename: 'dependency-injection.md',
          frontmatter: {
            title: 'Dependency Injection',
            type: 'concept',
            tags: ['dependency-injection', 'pattern'],
            created: '2024-01-01',
            updated: '2024-01-01'
          },
          content: 'Dependency injection is a design pattern',
          sections: [],
          outgoingLinks: [],
          incomingLinks: []
        },
        {
          path: 'angular.md',
          filename: 'angular.md',
          frontmatter: {
            title: 'Angular',
            type: 'entity',
            tags: ['framework'],
            created: '2024-01-01',
            updated: '2024-01-01'
          },
          content: 'Angular uses dependency injection throughout the framework',
          sections: [],
          outgoingLinks: [],
          incomingLinks: []
        }
      ];

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue(
        mockPages.map(p => p.path)
      );

      let callIndex = 0;
      vi.spyOn(fileSystemAdapter, 'readWikiFile').mockImplementation(async () => {
        const page = mockPages[callIndex++];
        return frontmatterAdapter.generateFrontmatter(page.frontmatter, page.content);
      });

      const results = await searchUseCase.execute('dependency injection', {
        maxResults: 10,
        includeRelatedPages: false
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].relevance).toBeGreaterThan(0);

      if (results.length > 1) {
        expect(results[0].relevance).toBeGreaterThanOrEqual(results[1].relevance);
      }
    });
  });

  describe('comprehensiveQueryWorkflowExample', () => {
    it('should execute multiple query types in sequence', async () => {
      const searchUseCase = new SearchUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      const searchByTagUseCase = new SearchByTagUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      const findEntitiesUseCase = new FindEntitiesUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      const findSourcesUseCase = new FindSourcesUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([]);

      const searchResults = await searchUseCase.execute('component', { maxResults: 3 });
      const componentEntities = await findEntitiesUseCase.execute('component');
      const taggedPages = await searchByTagUseCase.execute('components');
      const componentSources = await findSourcesUseCase.execute({
        libraryName: 'component'
      });

      expect(searchResults).toBeInstanceOf(Array);
      expect(componentEntities).toBeInstanceOf(Array);
      expect(taggedPages).toBeInstanceOf(Array);
      expect(componentSources).toBeInstanceOf(Array);
    });

    it('should handle empty results gracefully', async () => {
      const searchUseCase = new SearchUseCase(
        fileSystemAdapter,
        frontmatterAdapter,
        markdownAdapter
      );

      vi.spyOn(fileSystemAdapter, 'listWikiFiles').mockResolvedValue([]);

      const results = await searchUseCase.execute('nonexistent query');

      expect(results).toEqual([]);
    });
  });
});
