/**
 * Unit tests for index page manager.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  addEntityToIndex,
  addConceptToIndex,
  addSourceToIndex,
  removeEntryFromIndex,
  regenerateIndex,
  IndexEntry,
} from './index-manager';
import { WikiPage } from './models';
import * as filesystem from './filesystem';

// Mock the filesystem module
vi.mock('./filesystem');

describe('Index Manager', () => {
  const mockReadWikiFile = vi.mocked(filesystem.readWikiFile);
  const mockWriteWikiFile = vi.mocked(filesystem.writeWikiFile);
  const mockListWikiFiles = vi.mocked(filesystem.listWikiFiles);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addEntityToIndex', () => {
    it('should add a new entity to the index', async () => {
      const entityPage: WikiPage = {
        path: 'entities/angular-cdk.md',
        filename: 'angular-cdk.md',
        frontmatter: {
          title: 'Angular CDK',
          type: 'entity',
          tags: ['angular', 'accessibility'],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'Test content',
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      };

      // Mock reading existing index
      mockReadWikiFile.mockResolvedValue(`# Wiki Index

## Entities

*Entity pages describe specific things: libraries, tools, components, APIs*

## Concepts

*Concept pages explain ideas, patterns, and principles*
`);

      await addEntityToIndex(entityPage, 'Angular Component Dev Kit');

      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'index.md',
        expect.stringContaining('[[Angular CDK]] - Angular Component Dev Kit')
      );
    });

    it('should update an existing entity in the index', async () => {
      const entityPage: WikiPage = {
        path: 'entities/angular-cdk.md',
        filename: 'angular-cdk.md',
        frontmatter: {
          title: 'Angular CDK',
          type: 'entity',
          tags: ['angular', 'accessibility'],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'Test content',
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      };

      // Mock reading existing index with the entity already present
      mockReadWikiFile.mockResolvedValue(`# Wiki Index

## Entities

- [[Angular CDK]] - Old description

## Concepts

*Concept pages explain ideas, patterns, and principles*
`);

      await addEntityToIndex(entityPage, 'Updated description');

      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'index.md',
        expect.stringContaining('[[Angular CDK]] - Updated description')
      );
    });
  });

  describe('addConceptToIndex', () => {
    it('should add a new concept to the index', async () => {
      const conceptPage: WikiPage = {
        path: 'concepts/progressive-enhancement.md',
        filename: 'progressive-enhancement.md',
        frontmatter: {
          title: 'Progressive Enhancement',
          type: 'concept',
          tags: ['accessibility', 'web-development'],
          created: '2024-01-01',
          updated: '2024-01-01',
        },
        content: 'Test content',
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      };

      mockReadWikiFile.mockResolvedValue(`# Wiki Index

## Entities

*Entity pages describe specific things: libraries, tools, components, APIs*

## Concepts

*Concept pages explain ideas, patterns, and principles*
`);

      await addConceptToIndex(
        conceptPage,
        'Building accessible experiences that work for everyone'
      );

      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'index.md',
        expect.stringContaining(
          '[[Progressive Enhancement]] - Building accessible experiences that work for everyone'
        )
      );
    });
  });

  describe('addSourceToIndex', () => {
    it('should add a new source to the index with date', async () => {
      const sourcePage: WikiPage = {
        path: 'sources/example-source-2024-05-10.md',
        filename: 'example-source-2024-05-10.md',
        frontmatter: {
          title: 'Example Source',
          type: 'source',
          tags: ['research'],
          date: '2024-05-10',
          created: '2024-05-10',
          updated: '2024-05-10',
        },
        content: 'Test content',
        sections: [],
        outgoingLinks: [],
        incomingLinks: [],
      };

      mockReadWikiFile.mockResolvedValue(`# Wiki Index

## Recent Sources

*Source summaries distill key information from raw documents*
`);

      await addSourceToIndex(sourcePage, 'Example source summary');

      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'index.md',
        expect.stringContaining('[[Example Source]] (2024-05-10) - Example source summary')
      );
    });
  });

  describe('removeEntryFromIndex', () => {
    it('should remove an entry from the index', async () => {
      mockReadWikiFile.mockResolvedValue(`# Wiki Index

## Entities

- [[Angular CDK]] - Angular Component Dev Kit
- [[Old Entity]] - This should be removed

## Concepts

*Concept pages explain ideas, patterns, and principles*
`);

      await removeEntryFromIndex('entities/old-entity.md');

      const writtenContent = mockWriteWikiFile.mock.calls[0][1];
      expect(writtenContent).toContain('[[Angular CDK]]');
      expect(writtenContent).not.toContain('[[Old Entity]]');
    });
  });

  describe('regenerateIndex', () => {
    it('should regenerate index from provided entries', async () => {
      const entries: IndexEntry[] = [
        {
          title: 'Angular CDK',
          path: 'entities/angular-cdk.md',
          description: 'Angular Component Dev Kit',
          type: 'entity',
        },
        {
          title: 'Progressive Enhancement',
          path: 'concepts/progressive-enhancement.md',
          description: 'Building accessible experiences',
          type: 'concept',
        },
        {
          title: 'Example Source',
          path: 'sources/example-source-2024-05-10.md',
          description: 'Example source summary',
          type: 'source',
          date: '2024-05-10',
        },
      ];

      await regenerateIndex(entries);

      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'index.md',
        expect.stringContaining('[[Angular CDK]] - Angular Component Dev Kit')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'index.md',
        expect.stringContaining('[[Progressive Enhancement]] - Building accessible experiences')
      );
      expect(mockWriteWikiFile).toHaveBeenCalledWith(
        'index.md',
        expect.stringContaining('[[Example Source]] (2024-05-10) - Example source summary')
      );
    });

    it('should scan wiki pages when no entries provided', async () => {
      mockListWikiFiles.mockImplementation(async (pattern: string) => {
        if (pattern === 'entities/*.md') {
          return ['entities/angular-cdk.md'];
        } else if (pattern === 'concepts/*.md') {
          return ['concepts/progressive-enhancement.md'];
        } else if (pattern === 'sources/*.md') {
          return ['sources/example-source-2024-05-10.md'];
        }
        return [];
      });

      mockReadWikiFile.mockImplementation(async (path: string) => {
        if (path === 'entities/angular-cdk.md') {
          return `---
title: Angular CDK
type: entity
tags: [angular, accessibility]
created: 2024-01-01
updated: 2024-01-01
---

# Angular CDK

The Angular Component Dev Kit (CDK) is a set of behavior primitives.`;
        } else if (path === 'concepts/progressive-enhancement.md') {
          return `---
title: Progressive Enhancement
type: concept
tags: [accessibility]
created: 2024-01-01
updated: 2024-01-01
---

# Progressive Enhancement

Progressive Enhancement is a web design strategy.`;
        } else if (path === 'sources/example-source-2024-05-10.md') {
          return `---
title: Example Source
type: source
tags: [research]
date: 2024-05-10
created: 2024-05-10
updated: 2024-05-10
---

# Example Source

This is an example source summary.`;
        }
        return '';
      });

      await regenerateIndex();

      expect(mockListWikiFiles).toHaveBeenCalledWith('entities/*.md');
      expect(mockListWikiFiles).toHaveBeenCalledWith('concepts/*.md');
      expect(mockListWikiFiles).toHaveBeenCalledWith('sources/*.md');
      expect(mockWriteWikiFile).toHaveBeenCalled();
    });

    it('should sort entities and concepts alphabetically', async () => {
      const entries: IndexEntry[] = [
        {
          title: 'Zebra Entity',
          path: 'entities/zebra-entity.md',
          description: 'Last alphabetically',
          type: 'entity',
        },
        {
          title: 'Alpha Entity',
          path: 'entities/alpha-entity.md',
          description: 'First alphabetically',
          type: 'entity',
        },
      ];

      await regenerateIndex(entries);

      const writtenContent = mockWriteWikiFile.mock.calls[0][1];
      const alphaIndex = writtenContent.indexOf('[[Alpha Entity]]');
      const zebraIndex = writtenContent.indexOf('[[Zebra Entity]]');
      expect(alphaIndex).toBeLessThan(zebraIndex);
    });

    it('should sort sources by date descending', async () => {
      const entries: IndexEntry[] = [
        {
          title: 'Old Source',
          path: 'sources/old-source.md',
          description: 'Older source',
          type: 'source',
          date: '2024-01-01',
        },
        {
          title: 'New Source',
          path: 'sources/new-source.md',
          description: 'Newer source',
          type: 'source',
          date: '2024-12-31',
        },
      ];

      await regenerateIndex(entries);

      const writtenContent = mockWriteWikiFile.mock.calls[0][1];
      const newIndex = writtenContent.indexOf('[[New Source]]');
      const oldIndex = writtenContent.indexOf('[[Old Source]]');
      expect(newIndex).toBeLessThan(oldIndex);
    });

    it('should limit recent sources to configured maximum', async () => {
      const entries: IndexEntry[] = Array.from({ length: 15 }, (_, i) => ({
        title: `Source ${i}`,
        path: `sources/source-${i}.md`,
        description: `Source ${i} description`,
        type: 'source' as const,
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      }));

      await regenerateIndex(entries, { maxRecentSources: 5 });

      const writtenContent = mockWriteWikiFile.mock.calls[0][1];
      // Should only contain 5 sources
      const sourceMatches = writtenContent.match(/\[\[Source \d+\]\]/g);
      expect(sourceMatches?.length).toBe(5);
    });
  });
});
