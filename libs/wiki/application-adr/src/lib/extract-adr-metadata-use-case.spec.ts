import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ExtractADRMetadataUseCase,
  ADRParseError,
} from './extract-adr-metadata-use-case';
import {
  FrontmatterPort,
  ParsedFrontmatter,
} from '@wiki/application-ports';
import { WikiPageFrontmatter } from '@wiki/domain-models';

class MockFrontmatterPort implements FrontmatterPort {
  parseFrontmatter = vi.fn();
  generateFrontmatter() {
    return '';
  }
  createFrontmatter(
    partial: Partial<WikiPageFrontmatter>
  ): WikiPageFrontmatter {
    return {
      title: partial.title || '',
      type: partial.type || 'entity',
      tags: partial.tags || [],
      sources: partial.sources,
      created: partial.created || '2024-01-01',
      updated: partial.created || '2024-01-01',
    };
  }
  updateTimestamp(frontmatter: WikiPageFrontmatter): WikiPageFrontmatter {
    return frontmatter;
  }
}

describe('ExtractADRMetadataUseCase', () => {
  let useCase: ExtractADRMetadataUseCase;
  let mockFrontmatterPort: MockFrontmatterPort;

  beforeEach(() => {
    mockFrontmatterPort = new MockFrontmatterPort();
    useCase = new ExtractADRMetadataUseCase(mockFrontmatterPort);
  });

  describe('detectLibraries', () => {
    it('should detect library names from numbered list', async () => {
      const content = `
## Considered Options
1. @angular/cdk/a11y
2. focus-trap
3. Custom solution
`;

      (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
        frontmatter: {
          title: 'Test',
          date: '2024-01-15',
          status: 'Accepted',
          context: 'Test',
        },
        content,
      } as ParsedFrontmatter);

      const metadata = await useCase.execute('---\ntitle: Test\n---\n' + content);

      expect(metadata.libraries).toEqual([
        '@angular/cdk/a11y',
        'focus-trap',
        'Custom solution',
      ]);
    });

    it('should handle various list formats', async () => {
      const content = `
## Considered Options
1) Library One
2) Library Two
3) Library Three
`;

      (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
        frontmatter: {
          title: 'Test',
          date: '2024-01-15',
          status: 'Accepted',
          context: 'Test',
        },
        content,
      } as ParsedFrontmatter);

      const metadata = await useCase.execute('---\ntitle: Test\n---\n' + content);

      expect(metadata.libraries).toEqual(['Library One', 'Library Two', 'Library Three']);
    });

    it('should handle bulleted lists', async () => {
      const content = `
## Considered Options
- Library A
- Library B
- Library C
`;

      (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
        frontmatter: {
          title: 'Test',
          date: '2024-01-15',
          status: 'Accepted',
          context: 'Test',
        },
        content,
      } as ParsedFrontmatter);

      const metadata = await useCase.execute('---\ntitle: Test\n---\n' + content);

      expect(metadata.libraries).toEqual(['Library A', 'Library B', 'Library C']);
    });

    it('should return empty array if no libraries found', async () => {
      const content = `
## Some Other Section
No libraries here
`;

      (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
        frontmatter: {
          title: 'Test',
          date: '2024-01-15',
          status: 'Accepted',
          context: 'Test',
        },
        content,
      } as ParsedFrontmatter);

      const metadata = await useCase.execute('---\ntitle: Test\n---\n' + content);

      expect(metadata.libraries).toEqual([]);
    });
  });

  describe('parseComparisonMatrix', () => {
    it('should parse a valid markdown table', () => {
      const table = `
| Criterion    | CDK  | focus-trap | Custom |
|--------------|------|------------|--------|
| Complexity   | 3/10 | 6/10       | 8/10   |
| Modularity   | 9/10 | 7/10       | 5/10   |
`;
      const matrix = useCase.parseComparisonMatrix(table, 'Test Matrix');

      expect(matrix.title).toBe('Test Matrix');
      expect(matrix.headers).toEqual(['Criterion', 'CDK', 'focus-trap', 'Custom']);
      expect(matrix.rows.size).toBe(2);
      expect(matrix.rows.get('Complexity')).toEqual(['3/10', '6/10', '8/10']);
      expect(matrix.rows.get('Modularity')).toEqual(['9/10', '7/10', '5/10']);
      expect(matrix.winner).toBeUndefined();
    });

    it('should handle tables with winner column', () => {
      const table = `
| Criterion    | CDK  | focus-trap | Custom | Winner |
|--------------|------|------------|--------|--------|
| Complexity   | 3/10 | 6/10       | 8/10   | CDK    |
| Modularity   | 9/10 | 7/10       | 5/10   | CDK    |
`;
      const matrix = useCase.parseComparisonMatrix(table, 'Test Matrix');

      expect(matrix.winner).toBeDefined();
      expect(matrix.winner?.get('Complexity')).toBe('CDK');
      expect(matrix.winner?.get('Modularity')).toBe('CDK');
    });

    it('should throw error for malformed tables', () => {
      const table = `
| Single Column |
|---------------|
`;
      expect(() => useCase.parseComparisonMatrix(table, 'Test')).toThrow(
        ADRParseError
      );
    });

    it('should throw error for tables with no data rows', () => {
      const table = `
| Header 1 | Header 2 |
|----------|----------|
`;
      expect(() => useCase.parseComparisonMatrix(table, 'Test')).toThrow(
        ADRParseError
      );
    });
  });

  describe('extractADRMetadata', () => {
    it('should extract all required frontmatter fields', async () => {
      const adrContent = `---
title: Choose Focus Trap Library
date: 2024-01-15
status: Accepted
context: Research Session focus-trap-2024-01-15
---

## Context and Problem Statement
We need a robust focus trap solution.

## Decision Drivers
- Complexity
- Modularity

## Considered Options
1. @angular/cdk/a11y
2. focus-trap

## Decision Outcome
**Chosen option**: @angular/cdk/a11y

### Rationale
It provides the best balance.
`;

      (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
        frontmatter: {
          title: 'Choose Focus Trap Library',
          date: '2024-01-15',
          status: 'Accepted',
          context: 'Research Session focus-trap-2024-01-15',
        },
        content: adrContent.split('---')[2],
      } as ParsedFrontmatter);

      const metadata = await useCase.execute(adrContent);

      expect(metadata.title).toBe('Choose Focus Trap Library');
      expect(metadata.date).toBe('2024-01-15');
      expect(metadata.status).toBe('Accepted');
      expect(metadata.sessionId).toBe('focus-trap-2024-01-15');
      expect(metadata.decisionDrivers).toEqual(['Complexity', 'Modularity']);
      expect(metadata.libraries).toEqual(['@angular/cdk/a11y', 'focus-trap']);
      expect(metadata.chosenOption).toBe('@angular/cdk/a11y');
    });

    it('should throw ADRParseError for missing required fields', async () => {
      const adrContent = `---
title: Test
---
Some content
`;

      (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
        frontmatter: {
          title: 'Test',
        },
        content: 'Some content',
      } as ParsedFrontmatter);

      await expect(useCase.execute(adrContent)).rejects.toThrow(ADRParseError);
    });

    it('should handle optional frontmatter fields', async () => {
      const adrContent = `---
title: Test Decision
date: 2024-01-15
status: Accepted
context: Test Session
deciders: [Alice, Bob]
tags: [test, example]
supersedes: ADR-001
---

## Context and Problem Statement
Test context

## Decision Drivers
- Test driver

## Considered Options
1. Option A

## Decision Outcome
**Chosen option**: Option A

### Rationale
Test rationale
`;

      (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
        frontmatter: {
          title: 'Test Decision',
          date: '2024-01-15',
          status: 'Accepted',
          context: 'Test Session',
          deciders: ['Alice', 'Bob'],
          tags: ['test', 'example'],
          supersedes: 'ADR-001',
        },
        content: adrContent.split('---')[2],
      } as ParsedFrontmatter);

      const metadata = await useCase.execute(adrContent);

      expect(metadata.deciders).toEqual(['Alice', 'Bob']);
      expect(metadata.tags).toEqual(['test', 'example']);
      expect(metadata.supersedes).toBe('ADR-001');
    });

    it('should parse comparison matrices', async () => {
      const content = `## Context and Problem Statement
Test

## Decision Drivers
- Test

## Considered Options
1. Option A
2. Option B

## Complexity Comparison

| Criterion    | Option A | Option B |
|--------------|----------|----------|
| Setup        | Easy     | Hard     |
| Maintenance  | Low      | High     |

## Decision Outcome
**Chosen option**: Option A

### Rationale
Test
`;

      (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
        frontmatter: {
          title: 'Test Decision',
          date: '2024-01-15',
          status: 'Accepted',
          context: 'Test Session',
        },
        content,
      } as ParsedFrontmatter);

      const metadata = await useCase.execute('---\ntitle: Test\n---\n' + content);

      expect(metadata.comparisonMatrices).toBeDefined();
      expect(metadata.comparisonMatrices?.complexity).toBeDefined();
      expect(metadata.comparisonMatrices?.complexity?.rows.size).toBe(2);
    });

    it('should extract research links', async () => {
      const content = `## Context and Problem Statement
See [comparison report](./comparison-report.md) and [final report](./final-report.md).
Also check [prototype 1](./prototypes/demo1) and [prototype 2](./prototypes/demo2).

## Decision Drivers
- Test

## Considered Options
1. Option A

## Decision Outcome
**Chosen option**: Option A

### Rationale
Test
`;

      (mockFrontmatterPort.parseFrontmatter as any).mockReturnValue({
        frontmatter: {
          title: 'Test Decision',
          date: '2024-01-15',
          status: 'Accepted',
          context: 'Test Session',
        },
        content,
      } as ParsedFrontmatter);

      const metadata = await useCase.execute('---\ntitle: Test\n---\n' + content);

      expect(metadata.researchLinks).toBeDefined();
      expect(metadata.researchLinks?.comparisonReport).toBe('./comparison-report.md');
      expect(metadata.researchLinks?.finalReport).toBe('./final-report.md');
      expect(metadata.researchLinks?.prototypes).toHaveLength(2);
    });
  });
});
