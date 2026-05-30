/**
 * Unit tests for article session type definitions
 * Feature: article-research-session
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */

import { describe, it, expect } from 'vitest';
import type {
  SessionState,
  ArticleInputType,
  SessionJson,
  ArticleContent,
  CodeBlock,
  FetchResult,
  ArticleMetadata,
  ScriptResult,
  FailedReference,
  EntityCandidate,
  ConceptCandidate,
} from './article-session.js';

describe('Article Session Types', () => {
  describe('SessionJson', () => {
    it('should accept a minimal valid article session', () => {
      const session: SessionJson = {
        id: 'my-article-session',
        topic: 'Understanding Signals in Angular',
        state: 'EXPLORE',
        scope: 'article',
        createdAt: '2025-01-15',
        articleInputType: 'url',
      };

      expect(session.scope).toBe('article');
      expect(session.state).toBe('EXPLORE');
      expect(session.articleInputType).toBe('url');
    });

    it('should accept a fully populated article session with URL input', () => {
      const session: SessionJson = {
        id: 'angular-signals-article',
        topic: 'Angular Signals Deep Dive',
        state: 'FINALIZED',
        scope: 'article',
        createdAt: '2025-01-15',
        articleInputType: 'url',
        articleUrl: 'https://blog.angular.dev/signals',
        articleTitle: 'Angular Signals Deep Dive',
        articleAuthor: 'Angular Team',
        articleDate: '2025-01-10',
        finalizedAt: '2025-01-16',
        wikiPages: [
          'wiki/sources/angular-signals-article-2025-01-16.md',
          'wiki/entities/angular-signals.md',
        ],
      };

      expect(session.articleUrl).toBe('https://blog.angular.dev/signals');
      expect(session.articleTitle).toBe('Angular Signals Deep Dive');
      expect(session.finalizedAt).toBe('2025-01-16');
      expect(session.wikiPages).toHaveLength(2);
    });

    it('should accept a paused session with resumeFrom', () => {
      const session: SessionJson = {
        id: 'paused-session',
        topic: 'Some Article',
        state: 'PAUSED',
        scope: 'article',
        createdAt: '2025-01-15',
        articleInputType: 'pasted-text',
        pausedAt: '2025-01-16',
        resumeFrom: 'SYNTHESIZE',
      };

      expect(session.state).toBe('PAUSED');
      expect(session.pausedAt).toBe('2025-01-16');
      expect(session.resumeFrom).toBe('SYNTHESIZE');
    });

    it('should not require library-specific fields', () => {
      const session: SessionJson = {
        id: 'article-only',
        topic: 'Article Topic',
        state: 'EXPLORE',
        scope: 'article',
        createdAt: '2025-01-15',
        articleInputType: 'pasted-text',
      };

      // Verify no library-specific fields exist on the type
      const keys = Object.keys(session);
      expect(keys).not.toContain('libraries');
      expect(keys).not.toContain('version');
      expect(keys).not.toContain('repositoryUrl');
      expect(keys).not.toContain('githubRef');
      expect(keys).not.toContain('sourceStrategy');
      expect(keys).not.toContain('fallbackSources');
    });
  });

  describe('SessionState', () => {
    it('should accept all valid session states', () => {
      const states: SessionState[] = [
        'EXPLORE',
        'SYNTHESIZE',
        'FINALIZE',
        'FINALIZED',
        'PAUSED',
      ];

      expect(states).toHaveLength(5);
      expect(states).toContain('EXPLORE');
      expect(states).toContain('SYNTHESIZE');
      expect(states).toContain('FINALIZE');
      expect(states).toContain('FINALIZED');
      expect(states).toContain('PAUSED');
    });
  });

  describe('ArticleInputType', () => {
    it('should accept url and pasted-text', () => {
      const types: ArticleInputType[] = ['url', 'pasted-text'];

      expect(types).toHaveLength(2);
      expect(types).toContain('url');
      expect(types).toContain('pasted-text');
    });
  });

  describe('ArticleContent', () => {
    it('should accept a fully populated article content', () => {
      const content: ArticleContent = {
        title: 'Understanding Reactive Programming',
        author: 'Jane Doe',
        date: '2025-01-10',
        body: 'Reactive programming is a paradigm...',
        codeBlocks: [
          { language: 'typescript', content: 'const obs$ = of(1, 2, 3);' },
          { content: 'plain code block without language' },
        ],
        links: ['https://rxjs.dev', 'https://angular.dev'],
        candidateEntities: ['RxJS', 'Angular Signals'],
        candidateConcepts: ['reactive programming', 'fine-grained reactivity'],
      };

      expect(content.title).toBe('Understanding Reactive Programming');
      expect(content.codeBlocks).toHaveLength(2);
      expect(content.codeBlocks[0].language).toBe('typescript');
      expect(content.codeBlocks[1].language).toBeUndefined();
      expect(content.links).toHaveLength(2);
      expect(content.candidateEntities).toHaveLength(2);
      expect(content.candidateConcepts).toHaveLength(2);
    });

    it('should accept minimal article content without optional fields', () => {
      const content: ArticleContent = {
        title: 'Minimal Article',
        body: 'Some body text',
        codeBlocks: [],
        links: [],
        candidateEntities: [],
        candidateConcepts: [],
      };

      expect(content.author).toBeUndefined();
      expect(content.date).toBeUndefined();
      expect(content.codeBlocks).toHaveLength(0);
    });
  });

  describe('CodeBlock', () => {
    it('should accept a code block with language', () => {
      const block: CodeBlock = {
        language: 'typescript',
        content: 'const x = 1;',
      };

      expect(block.language).toBe('typescript');
      expect(block.content).toBe('const x = 1;');
    });

    it('should accept a code block without language', () => {
      const block: CodeBlock = {
        content: 'some code',
      };

      expect(block.language).toBeUndefined();
      expect(block.content).toBe('some code');
    });
  });

  describe('FetchResult', () => {
    it('should represent a successful fetch', () => {
      const result: FetchResult = {
        success: true,
        content: '<html>...</html>',
        statusCode: 200,
      };

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.statusCode).toBe(200);
      expect(result.errorReason).toBeUndefined();
    });

    it('should represent a failed fetch', () => {
      const result: FetchResult = {
        success: false,
        statusCode: 404,
        errorReason: 'Not Found',
      };

      expect(result.success).toBe(false);
      expect(result.content).toBeUndefined();
      expect(result.statusCode).toBe(404);
      expect(result.errorReason).toBe('Not Found');
    });

    it('should represent a timeout failure', () => {
      const result: FetchResult = {
        success: false,
        errorReason: 'Request timed out after 30 seconds',
      };

      expect(result.success).toBe(false);
      expect(result.statusCode).toBeUndefined();
    });
  });

  describe('ArticleMetadata', () => {
    it('should accept full metadata for URL-sourced article', () => {
      const metadata: ArticleMetadata = {
        title: 'My Article',
        author: 'Author Name',
        date: '2025-01-10',
        sourceUrl: 'https://example.com/article',
        inputType: 'url',
      };

      expect(metadata.title).toBe('My Article');
      expect(metadata.inputType).toBe('url');
      expect(metadata.sourceUrl).toBeDefined();
    });

    it('should accept minimal metadata for pasted-text article', () => {
      const metadata: ArticleMetadata = {
        title: 'Pasted Article',
        inputType: 'pasted-text',
      };

      expect(metadata.author).toBeUndefined();
      expect(metadata.date).toBeUndefined();
      expect(metadata.sourceUrl).toBeUndefined();
      expect(metadata.inputType).toBe('pasted-text');
    });
  });

  describe('ScriptResult', () => {
    it('should represent a successful script execution', () => {
      const result: ScriptResult = {
        success: true,
      };

      expect(result.success).toBe(true);
      expect(result.failedScript).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    });

    it('should represent a failed script execution', () => {
      const result: ScriptResult = {
        success: false,
        failedScript: 'generate-wiki-manifest.mjs',
        errorMessage: 'ENOENT: no such file or directory',
      };

      expect(result.success).toBe(false);
      expect(result.failedScript).toBe('generate-wiki-manifest.mjs');
      expect(result.errorMessage).toBeDefined();
    });
  });

  describe('FailedReference', () => {
    it('should capture all failure details', () => {
      const ref: FailedReference = {
        targetPage: 'wiki/entities/rxjs.md',
        sourcePage: 'wiki/sources/rxjs-article-2025-01-15.md',
        reason: 'File not writable',
      };

      expect(ref.targetPage).toBe('wiki/entities/rxjs.md');
      expect(ref.sourcePage).toBe('wiki/sources/rxjs-article-2025-01-15.md');
      expect(ref.reason).toBe('File not writable');
    });
  });

  describe('EntityCandidate', () => {
    it('should represent a candidate entity for wiki publication', () => {
      const entity: EntityCandidate = {
        name: 'Angular Signals',
        description: 'A reactive primitive in Angular for fine-grained reactivity.',
        proposedPath: 'wiki/entities/angular-signals.md',
      };

      expect(entity.name).toBe('Angular Signals');
      expect(entity.description).toContain('reactive');
      expect(entity.proposedPath).toMatch(/^wiki\/entities\//);
    });
  });

  describe('ConceptCandidate', () => {
    it('should represent a candidate concept for wiki publication', () => {
      const concept: ConceptCandidate = {
        name: 'Fine-Grained Reactivity',
        description: 'A pattern where only the specific parts of the UI that depend on changed data are updated.',
        proposedPath: 'wiki/concepts/fine-grained-reactivity.md',
      };

      expect(concept.name).toBe('Fine-Grained Reactivity');
      expect(concept.description).toContain('UI');
      expect(concept.proposedPath).toMatch(/^wiki\/concepts\//);
    });
  });
});
