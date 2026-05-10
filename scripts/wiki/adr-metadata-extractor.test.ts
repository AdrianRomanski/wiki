/**
 * Unit tests for ADR Metadata Extractor
 */

import { describe, it, expect } from 'vitest';
import {
  detectLibraries,
  parseComparisonMatrix,
  extractADRMetadata,
  ADRParseError,
} from './adr-metadata-extractor';

describe('detectLibraries', () => {
  it('should detect library names from numbered list', () => {
    const content = `
## Considered Options
1. @angular/cdk/a11y
2. focus-trap
3. Custom solution
`;
    const libraries = detectLibraries(content);
    expect(libraries).toEqual(['@angular/cdk/a11y', 'focus-trap', 'Custom solution']);
  });

  it('should handle various list formats', () => {
    const content = `
## Considered Options
1) Library One
2) Library Two
3) Library Three
`;
    const libraries = detectLibraries(content);
    expect(libraries).toEqual(['Library One', 'Library Two', 'Library Three']);
  });

  it('should handle bulleted lists', () => {
    const content = `
## Considered Options
- Library A
- Library B
- Library C
`;
    const libraries = detectLibraries(content);
    expect(libraries).toEqual(['Library A', 'Library B', 'Library C']);
  });

  it('should return empty array if no libraries found', () => {
    const content = `
## Some Other Section
No libraries here
`;
    const libraries = detectLibraries(content);
    expect(libraries).toEqual([]);
  });

  it('should handle missing Considered Options section', () => {
    const content = `
## Context
Some context here
`;
    const libraries = detectLibraries(content);
    expect(libraries).toEqual([]);
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
    const matrix = parseComparisonMatrix(table, 'Test Matrix');
    
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
    const matrix = parseComparisonMatrix(table, 'Test Matrix');
    
    expect(matrix.winner).toBeDefined();
    expect(matrix.winner?.get('Complexity')).toBe('CDK');
    expect(matrix.winner?.get('Modularity')).toBe('CDK');
  });

  it('should throw error for malformed tables', () => {
    const table = `
| Single Column |
|---------------|
`;
    expect(() => parseComparisonMatrix(table, 'Test')).toThrow(ADRParseError);
  });

  it('should throw error for tables with no data rows', () => {
    const table = `
| Header 1 | Header 2 |
|----------|----------|
`;
    expect(() => parseComparisonMatrix(table, 'Test')).toThrow(ADRParseError);
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

    const metadata = await extractADRMetadata(adrContent);
    
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

    await expect(extractADRMetadata(adrContent)).rejects.toThrow(ADRParseError);
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

    const metadata = await extractADRMetadata(adrContent);
    
    expect(metadata.deciders).toEqual(['Alice', 'Bob']);
    expect(metadata.tags).toEqual(['test', 'example']);
    expect(metadata.supersedes).toBe('ADR-001');
  });

  it('should parse comparison matrices', async () => {
    const adrContent = `---
title: Test Decision
date: 2024-01-15
status: Accepted
context: Test Session
---

## Context and Problem Statement
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

    const metadata = await extractADRMetadata(adrContent);
    
    expect(metadata.comparisonMatrices).toBeDefined();
    expect(metadata.comparisonMatrices?.complexity).toBeDefined();
    expect(metadata.comparisonMatrices?.complexity?.rows.size).toBe(2);
  });

  it('should extract research links', async () => {
    const adrContent = `---
title: Test Decision
date: 2024-01-15
status: Accepted
context: Test Session
---

## Context and Problem Statement
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

    const metadata = await extractADRMetadata(adrContent);
    
    expect(metadata.researchLinks).toBeDefined();
    expect(metadata.researchLinks?.comparisonReport).toBe('./comparison-report.md');
    expect(metadata.researchLinks?.finalReport).toBe('./final-report.md');
    expect(metadata.researchLinks?.prototypes).toHaveLength(2);
  });
});
