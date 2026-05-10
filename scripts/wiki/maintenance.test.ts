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
  generateMaintenanceReport,
  validateSessionReferences,
  detectDuplicateLibraryEntities,
  flagSupersededDecisions,
  validateADRCrossReferences
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

  describe('ADR-Specific Maintenance', () => {
    describe('validateSessionReferences', () => {
      it('should validate session references in ADR pages', async () => {
        // Create ADR source page with session reference
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'adr-decision.md'),
          `---
title: Choose Focus Trap Library
type: source
tags: [research, adr, decision]
sessionId: focus-trap-2024-01-15
status: Accepted
created: 2024-01-15
updated: 2024-01-15
---

# Choose Focus Trap Library

Decision content here.
`
        );

        // Create research session directory
        const sessionDir = join(process.cwd(), '.kiro', 'research', 'sessions', 'focus-trap-2024-01-15');
        await mkdir(sessionDir, { recursive: true });
        await writeFile(join(sessionDir, 'decision.adr.md'), 'ADR content');
        await writeFile(join(sessionDir, 'comparison-report.md'), 'Comparison report');
        await writeFile(join(sessionDir, 'final-report.md'), 'Final report');

        const brokenRefs = await validateSessionReferences(TEST_WIKI_DIR);

        expect(brokenRefs.length).toBe(0);

        // Clean up
        await rm(join(process.cwd(), '.kiro'), { recursive: true, force: true });
      });

      it('should flag broken session references', async () => {
        // Create ADR source page with non-existent session
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'adr-decision.md'),
          `---
title: Choose Focus Trap Library
type: source
tags: [research, adr, decision]
sessionId: non-existent-session
status: Accepted
created: 2024-01-15
updated: 2024-01-15
---

# Choose Focus Trap Library

Decision content here.
`
        );

        const brokenRefs = await validateSessionReferences(TEST_WIKI_DIR);

        expect(brokenRefs.length).toBe(1);
        expect(brokenRefs[0].page).toBe('sources/adr-decision.md');
        expect(brokenRefs[0].sessionId).toBe('non-existent-session');
        expect(brokenRefs[0].errors.length).toBeGreaterThan(0);
        expect(brokenRefs[0].suggestedActions.length).toBeGreaterThan(0);
      });

      it('should flag missing research artifacts', async () => {
        // Create ADR source page
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'adr-decision.md'),
          `---
title: Choose Focus Trap Library
type: source
tags: [research, adr, decision]
sessionId: incomplete-session
status: Accepted
created: 2024-01-15
updated: 2024-01-15
---

# Choose Focus Trap Library
`
        );

        // Create session directory but without artifacts
        const sessionDir = join(process.cwd(), '.kiro', 'research', 'sessions', 'incomplete-session');
        await mkdir(sessionDir, { recursive: true });

        const brokenRefs = await validateSessionReferences(TEST_WIKI_DIR);

        expect(brokenRefs.length).toBe(1);
        expect(brokenRefs[0].errors.some(e => e.includes('Comparison report not found'))).toBe(true);
        expect(brokenRefs[0].errors.some(e => e.includes('Final report not found'))).toBe(true);
        expect(brokenRefs[0].errors.some(e => e.includes('ADR not found'))).toBe(true);

        // Clean up
        await rm(join(process.cwd(), '.kiro'), { recursive: true, force: true });
      });

      it('should skip non-ADR pages', async () => {
        // Create regular source page without sessionId
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'regular-source.md'),
          `---
title: Regular Source
type: source
tags: [article]
created: 2024-01-15
updated: 2024-01-15
---

# Regular Source

Regular content.
`
        );

        const brokenRefs = await validateSessionReferences(TEST_WIKI_DIR);

        expect(brokenRefs.length).toBe(0);
      });
    });

    describe('detectDuplicateLibraryEntities', () => {
      it('should detect duplicate library entity pages', async () => {
        // Create two entity pages for the same library
        await writeFile(
          join(TEST_WIKI_DIR, 'entities', 'angular-cdk-a11y.md'),
          `---
title: Angular CDK A11y
type: entity
tags: [research, adr, library]
sources: [sources/adr-1.md]
created: 2024-01-15
updated: 2024-01-15
---

# Angular CDK A11y
`
        );

        await writeFile(
          join(TEST_WIKI_DIR, 'entities', 'angular-cdk-a11y-2.md'),
          `---
title: Angular CDK A11y
type: entity
tags: [research, adr, library]
sources: [sources/adr-2.md]
created: 2024-01-16
updated: 2024-01-16
---

# Angular CDK A11y
`
        );

        const duplicates = await detectDuplicateLibraryEntities(TEST_WIKI_DIR);

        expect(duplicates.length).toBe(1);
        expect(duplicates[0].libraryName).toBe('Angular CDK A11y');
        expect(duplicates[0].entityPages.length).toBe(2);
        expect(duplicates[0].referencedByADRs.length).toBe(2);
        expect(duplicates[0].suggestedAction).toContain('Consolidate');
      });

      it('should not flag single entity pages', async () => {
        // Create single entity page
        await writeFile(
          join(TEST_WIKI_DIR, 'entities', 'focus-trap.md'),
          `---
title: focus-trap
type: entity
tags: [research, adr, library]
sources: [sources/adr-1.md]
created: 2024-01-15
updated: 2024-01-15
---

# focus-trap
`
        );

        const duplicates = await detectDuplicateLibraryEntities(TEST_WIKI_DIR);

        expect(duplicates.length).toBe(0);
      });

      it('should skip non-research entity pages', async () => {
        // Create entity pages without research tags
        await writeFile(
          join(TEST_WIKI_DIR, 'entities', 'concept-1.md'),
          `---
title: Some Concept
type: entity
tags: [concept]
created: 2024-01-15
updated: 2024-01-15
---

# Some Concept
`
        );

        await writeFile(
          join(TEST_WIKI_DIR, 'entities', 'concept-2.md'),
          `---
title: Some Concept
type: entity
tags: [concept]
created: 2024-01-16
updated: 2024-01-16
---

# Some Concept
`
        );

        const duplicates = await detectDuplicateLibraryEntities(TEST_WIKI_DIR);

        expect(duplicates.length).toBe(0);
      });
    });

    describe('flagSupersededDecisions', () => {
      it('should flag superseded ADR decisions', async () => {
        // Create superseded ADR
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'old-decision.md'),
          `---
title: Old Decision
type: source
tags: [research, adr, decision]
sessionId: old-session
status: Superseded
supersededBy: sources/new-decision.md
created: 2024-01-01
updated: 2024-01-15
---

# Old Decision

This decision has been superseded.
`
        );

        const superseded = await flagSupersededDecisions(TEST_WIKI_DIR);

        expect(superseded.length).toBe(1);
        expect(superseded[0].page).toBe('sources/old-decision.md');
        expect(superseded[0].title).toBe('Old Decision');
        expect(superseded[0].status).toBe('Superseded');
        expect(superseded[0].supersededBy).toBe('sources/new-decision.md');
        expect(superseded[0].recommendation).toContain('newer decision');
      });

      it('should handle superseded decisions without supersededBy', async () => {
        // Create superseded ADR without supersededBy field
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'old-decision.md'),
          `---
title: Old Decision
type: source
tags: [research, adr, decision]
sessionId: old-session
status: Superseded
created: 2024-01-01
updated: 2024-01-15
---

# Old Decision
`
        );

        const superseded = await flagSupersededDecisions(TEST_WIKI_DIR);

        expect(superseded.length).toBe(1);
        expect(superseded[0].supersededBy).toBeUndefined();
        expect(superseded[0].recommendation).toContain('archived');
      });

      it('should not flag active decisions', async () => {
        // Create active ADR
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'active-decision.md'),
          `---
title: Active Decision
type: source
tags: [research, adr, decision]
sessionId: active-session
status: Accepted
created: 2024-01-15
updated: 2024-01-15
---

# Active Decision
`
        );

        const superseded = await flagSupersededDecisions(TEST_WIKI_DIR);

        expect(superseded.length).toBe(0);
      });
    });

    describe('validateADRCrossReferences', () => {
      it('should validate cross-references in ADR pages', async () => {
        // Create ADR page with broken links
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'adr-decision.md'),
          `---
title: Choose Focus Trap Library
type: source
tags: [research, adr, decision]
sessionId: focus-trap-2024-01-15
status: Accepted
created: 2024-01-15
updated: 2024-01-15
---

# Choose Focus Trap Library

We compared [[Angular CDK]] and [[NonExistent Library]].
`
        );

        // Create the Angular CDK page
        await writeFile(
          join(TEST_WIKI_DIR, 'entities', 'angular-cdk.md'),
          `---
title: Angular CDK
type: entity
tags: [library]
created: 2024-01-15
updated: 2024-01-15
---

# Angular CDK
`
        );

        const brokenRefs = await validateADRCrossReferences(TEST_WIKI_DIR);

        expect(brokenRefs.length).toBe(1);
        expect(brokenRefs[0].page).toBe('sources/adr-decision.md');
        expect(brokenRefs[0].brokenLinks).toContain('NonExistent Library');
        expect(brokenRefs[0].brokenLinks).not.toContain('Angular CDK');
        expect(brokenRefs[0].suggestedActions.length).toBeGreaterThan(0);
      });

      it('should suggest creating entity pages for library names', async () => {
        // Create ADR page with library reference
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'adr-decision.md'),
          `---
title: Choose Focus Trap Library
type: source
tags: [research, adr, decision]
sessionId: focus-trap-2024-01-15
status: Accepted
created: 2024-01-15
updated: 2024-01-15
---

# Choose Focus Trap Library

We evaluated [[@angular/cdk/a11y]].
`
        );

        const brokenRefs = await validateADRCrossReferences(TEST_WIKI_DIR);

        expect(brokenRefs.length).toBe(1);
        expect(brokenRefs[0].suggestedActions.some(a => 
          a.includes('Create entity page for library')
        )).toBe(true);
      });

      it('should skip non-ADR pages', async () => {
        // Create regular page with broken links
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'regular-source.md'),
          `---
title: Regular Source
type: source
tags: [article]
created: 2024-01-15
updated: 2024-01-15
---

# Regular Source

Links to [[NonExistent]].
`
        );

        const brokenRefs = await validateADRCrossReferences(TEST_WIKI_DIR);

        expect(brokenRefs.length).toBe(0);
      });
    });

    describe('generateMaintenanceReport with ADR findings', () => {
      it('should include ADR-specific findings in report', async () => {
        // Create ADR page with issues
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'adr-decision.md'),
          `---
title: Choose Focus Trap Library
type: source
tags: [research, adr, decision]
sessionId: non-existent-session
status: Superseded
supersededBy: sources/new-decision.md
created: 2024-01-15
updated: 2024-01-15
---

# Choose Focus Trap Library

Links to [[NonExistent]].
`
        );

        // Create duplicate library entities
        await writeFile(
          join(TEST_WIKI_DIR, 'entities', 'lib-1.md'),
          `---
title: Test Library
type: entity
tags: [research, adr]
sources: [sources/adr-1.md]
created: 2024-01-15
updated: 2024-01-15
---

# Test Library
`
        );

        await writeFile(
          join(TEST_WIKI_DIR, 'entities', 'lib-2.md'),
          `---
title: Test Library
type: entity
tags: [research, adr]
sources: [sources/adr-2.md]
created: 2024-01-16
updated: 2024-01-16
---

# Test Library
`
        );

        const report = await generateMaintenanceReport(TEST_WIKI_DIR);

        expect(report.adrFindings).toBeDefined();
        expect(report.adrFindings!.brokenSessionReferences.length).toBeGreaterThan(0);
        expect(report.adrFindings!.duplicateLibraries.length).toBeGreaterThan(0);
        expect(report.adrFindings!.supersededDecisions.length).toBeGreaterThan(0);
        expect(report.adrFindings!.adrCrossReferenceIssues.length).toBeGreaterThan(0);
      });

      it('should adjust health score for ADR issues', async () => {
        // Create healthy wiki first
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

        const healthyReport = await generateMaintenanceReport(TEST_WIKI_DIR);
        const healthyScore = healthyReport.summary.healthScore;

        // Add ADR with broken session reference
        await writeFile(
          join(TEST_WIKI_DIR, 'sources', 'adr-broken.md'),
          `---
title: Broken ADR
type: source
tags: [research, adr]
sessionId: non-existent
status: Accepted
created: 2024-01-15
updated: 2024-01-15
---

# Broken ADR
`
        );

        const unhealthyReport = await generateMaintenanceReport(TEST_WIKI_DIR);
        const unhealthyScore = unhealthyReport.summary.healthScore;

        // Health score should be lower with ADR issues
        expect(unhealthyScore).toBeLessThan(healthyScore);
      });
    });
  });
});
