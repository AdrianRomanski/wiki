/**
 * Unit tests for maintenance workflow.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import {
  extractAllWikiLinks,
  loadPageTitles,
  validateAllLinks,
  detectDuplicates,
  detectContradictions,
  suggestConsolidation,
  findOrphans,
  generateMaintenanceReport
} from './maintenance.js';

const TEST_WIKI_DIR = join(process.cwd(), 'test-wiki-maintenance');

describe('Maintenance Workflow', () => {
  beforeEach(async () => {
    // Create test wiki directory structure
    await mkdir(join(TEST_WIKI_DIR, 'entities'), { recursive: true });
    await mkdir(join(TEST_WIKI_DIR, 'concepts'), { recursive: true });
    await mkdir(join(TEST_WIKI_DIR, 'sources'), { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(TEST_WIKI_DIR, { recursive: true, force: true });
  });

  describe('extractAllWikiLinks', () => {
    it('should extract wiki links from all pages', async () => {
      // Create test pages with links
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'angular-cdk.md'),
        `---
title: Angular CDK
type: entity
tags: [angular, cdk]
created: 2024-01-01
updated: 2024-01-01
---

# Angular CDK

The [[Angular Material]] library uses the CDK.
See also [[Accessibility]] patterns.
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'concepts', 'accessibility.md'),
        `---
title: Accessibility
type: concept
tags: [a11y]
created: 2024-01-01
updated: 2024-01-01
---

# Accessibility

Related to [[Angular CDK]].
`
      );

      const linkMap = await extractAllWikiLinks(TEST_WIKI_DIR);

      expect(linkMap.size).toBe(2);
      expect(linkMap.get('entities/angular-cdk.md')).toEqual([
        'Angular Material',
        'Accessibility'
      ]);
      expect(linkMap.get('concepts/accessibility.md')).toEqual(['Angular CDK']);
    });

    it('should handle pages with no links', async () => {
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'standalone.md'),
        `---
title: Standalone
type: entity
tags: [test]
created: 2024-01-01
updated: 2024-01-01
---

# Standalone

No links here.
`
      );

      const linkMap = await extractAllWikiLinks(TEST_WIKI_DIR);

      expect(linkMap.size).toBe(1);
      expect(linkMap.get('entities/standalone.md')).toEqual([]);
    });
  });

  describe('loadPageTitles', () => {
    it('should load all page titles', async () => {
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'angular-cdk.md'),
        `---
title: Angular CDK
type: entity
tags: [angular]
created: 2024-01-01
updated: 2024-01-01
---

# Angular CDK
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'concepts', 'accessibility.md'),
        `---
title: Accessibility
type: concept
tags: [a11y]
created: 2024-01-01
updated: 2024-01-01
---

# Accessibility
`
      );

      const titleMap = await loadPageTitles(TEST_WIKI_DIR);

      expect(titleMap.size).toBe(2);
      expect(titleMap.get('angular cdk')).toBe('entities/angular-cdk.md');
      expect(titleMap.get('accessibility')).toBe('concepts/accessibility.md');
    });

    it('should use lowercase for case-insensitive matching', async () => {
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'test.md'),
        `---
title: Test Page
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Test Page
`
      );

      const titleMap = await loadPageTitles(TEST_WIKI_DIR);

      expect(titleMap.has('test page')).toBe(true);
      expect(titleMap.has('Test Page')).toBe(false);
    });
  });

  describe('validateAllLinks', () => {
    it('should identify valid and broken links', async () => {
      // Create pages
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page1.md'),
        `---
title: Page One
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page One

Links to [[Page Two]] and [[NonExistent]].
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page2.md'),
        `---
title: Page Two
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page Two
`
      );

      const results = await validateAllLinks(TEST_WIKI_DIR);

      const page1Result = results.find(r => r.page === 'entities/page1.md');
      expect(page1Result).toBeDefined();
      expect(page1Result!.validLinks).toEqual(['Page Two']);
      expect(page1Result!.brokenLinks).toEqual(['NonExistent']);
      expect(page1Result!.totalLinks).toBe(2);
    });

    it('should handle pages with all valid links', async () => {
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page1.md'),
        `---
title: Page One
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page One

Links to [[Page Two]].
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page2.md'),
        `---
title: Page Two
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page Two
`
      );

      const results = await validateAllLinks(TEST_WIKI_DIR);

      const page1Result = results.find(r => r.page === 'entities/page1.md');
      expect(page1Result!.brokenLinks).toEqual([]);
      expect(page1Result!.validLinks).toEqual(['Page Two']);
    });
  });

  describe('detectDuplicates', () => {
    it('should detect pages with high similarity', async () => {
      const sharedContent = `
This is a long piece of content about Angular CDK.
It provides accessibility utilities and components.
The CDK is used by Angular Material.
It includes features like overlay, portal, and a11y.
`;

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page1.md'),
        `---
title: Page One
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page One

${sharedContent}
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page2.md'),
        `---
title: Page Two
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page Two

${sharedContent}
Some additional unique content here.
`
      );

      const duplicates = await detectDuplicates(TEST_WIKI_DIR, 0.6);

      expect(duplicates.length).toBeGreaterThan(0);
      const dup = duplicates[0];
      expect(dup.similarity).toBeGreaterThan(0.6);
      expect([dup.page1, dup.page2]).toContain('entities/page1.md');
      expect([dup.page1, dup.page2]).toContain('entities/page2.md');
    });

    it('should not flag pages with low similarity', async () => {
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page1.md'),
        `---
title: Page One
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page One

Content about Angular CDK and accessibility.
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page2.md'),
        `---
title: Page Two
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page Two

Completely different content about React hooks.
`
      );

      const duplicates = await detectDuplicates(TEST_WIKI_DIR, 0.7);

      expect(duplicates.length).toBe(0);
    });
  });

  describe('detectContradictions', () => {
    it('should detect pages with contradiction markers', async () => {
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page1.md'),
        `---
title: Page One
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page One

The CDK provides accessibility features. However, [[Page Two]] suggests otherwise.
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page2.md'),
        `---
title: Page Two
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page Two

Some content.
`
      );

      const contradictions = await detectContradictions(TEST_WIKI_DIR);

      expect(contradictions.length).toBeGreaterThan(0);
      const contradiction = contradictions[0];
      expect(contradiction.pages).toContain('entities/page1.md');
    });

    it('should not flag pages without contradiction markers', async () => {
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page1.md'),
        `---
title: Page One
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page One

The CDK provides accessibility features. See [[Page Two]] for more.
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page2.md'),
        `---
title: Page Two
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page Two

More information.
`
      );

      const contradictions = await detectContradictions(TEST_WIKI_DIR);

      expect(contradictions.length).toBe(0);
    });
  });

  describe('suggestConsolidation', () => {
    it('should suggest consolidation for similar pages', async () => {
      const sharedContent = `
This is content about Angular CDK.
It provides accessibility utilities.
The CDK is used by Angular Material.
`;

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page1.md'),
        `---
title: Page One
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page One

${sharedContent}
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page2.md'),
        `---
title: Page Two
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page Two

${sharedContent}
`
      );

      const opportunities = await suggestConsolidation(TEST_WIKI_DIR);

      expect(opportunities.length).toBeGreaterThan(0);
      const opp = opportunities[0];
      expect(opp.pages).toHaveLength(2);
      expect(opp.reason).toContain('similarity');
    });
  });

  describe('findOrphans', () => {
    it('should find pages with no incoming links', async () => {
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'orphan.md'),
        `---
title: Orphan Page
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Orphan Page

No one links to me.
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'popular.md'),
        `---
title: Popular Page
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Popular Page
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'linker.md'),
        `---
title: Linker Page
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Linker Page

I link to [[Popular Page]].
`
      );

      const orphans = await findOrphans(TEST_WIKI_DIR);

      const orphanPaths = orphans.map(o => o.page);
      expect(orphanPaths).toContain('entities/orphan.md');
      expect(orphanPaths).toContain('entities/linker.md'); // Also an orphan
      expect(orphanPaths).not.toContain('entities/popular.md');
    });

    it('should return empty array when all pages are linked', async () => {
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page1.md'),
        `---
title: Page One
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page One

Links to [[Page Two]].
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page2.md'),
        `---
title: Page Two
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page Two

Links to [[Page One]].
`
      );

      const orphans = await findOrphans(TEST_WIKI_DIR);

      expect(orphans.length).toBe(0);
    });
  });

  describe('generateMaintenanceReport', () => {
    it('should generate comprehensive maintenance report', async () => {
      // Create test pages with various issues
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page1.md'),
        `---
title: Page One
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page One

Links to [[Page Two]] and [[NonExistent]].
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page2.md'),
        `---
title: Page Two
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page Two

No links.
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'orphan.md'),
        `---
title: Orphan
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Orphan

Orphaned page.
`
      );

      const report = await generateMaintenanceReport(TEST_WIKI_DIR);

      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.summary.totalPages).toBe(3);
      expect(report.brokenLinks.length).toBeGreaterThan(0);
      expect(report.orphans.length).toBeGreaterThan(0);
      expect(report.summary.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.healthScore).toBeLessThanOrEqual(100);
    });

    it('should calculate health score correctly', async () => {
      // Create a healthy wiki
      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page1.md'),
        `---
title: Page One
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page One

Links to [[Page Two]].
`
      );

      await writeFile(
        join(TEST_WIKI_DIR, 'entities', 'page2.md'),
        `---
title: Page Two
type: entity
tags: []
created: 2024-01-01
updated: 2024-01-01
---

# Page Two

Links to [[Page One]].
`
      );

      const report = await generateMaintenanceReport(TEST_WIKI_DIR);

      // Healthy wiki should have high health score
      expect(report.summary.healthScore).toBeGreaterThan(80);
      expect(report.brokenLinks.length).toBe(0);
      expect(report.orphans.length).toBe(0);
    });
  });
});
