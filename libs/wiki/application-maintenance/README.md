# @wiki/application-maintenance

Maintenance and health check use cases for detecting wiki content issues.

## Overview

**Library Name:** `@wiki/application-maintenance`  
**Scope:** `@wiki`  
**Architectural Layer:** Application  
**Tags:** `application`

This library provides use case services for maintaining wiki health by detecting duplicates, contradictions, broken links, orphaned pages, and consolidation opportunities. It generates comprehensive maintenance reports to help keep the wiki content clean, consistent, and well-connected.

## Purpose and Responsibilities

The `@wiki/application-maintenance` library is responsible for:

- **Duplicate Detection**: Identifies pages with similar or duplicate content
- **Contradiction Detection**: Finds potentially contradictory information across pages
- **Broken Link Detection**: Validates all WikiLink references
- **Orphan Detection**: Finds pages with no incoming links
- **Consolidation Suggestions**: Recommends pages that could be merged
- **Health Reporting**: Generates comprehensive maintenance reports
- **Content Quality**: Ensures wiki content remains accurate and well-organized

This library enables proactive maintenance to prevent content drift and maintain knowledge base quality over time.

## Public API

### Use Case Classes

**DetectDuplicatesUseCase**
```typescript
class DetectDuplicatesUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    similarityThreshold?: number
  );
  
  async execute(): Promise<DuplicateEntry[]>;
}
```

**DetectContradictionsUseCase**
```typescript
class DetectContradictionsUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    markdownPort: MarkdownPort,
    frontmatterPort: FrontmatterPort
  );
  
  async execute(): Promise<ContradictionEntry[]>;
}
```

**DetectBrokenLinksUseCase**
```typescript
class DetectBrokenLinksUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort
  );
  
  async execute(): Promise<BrokenLinkEntry[]>;
}
```

**DetectOrphansUseCase**
```typescript
class DetectOrphansUseCase {
  constructor(
    fileSystemPort: FileSystemPort,
    frontmatterPort: FrontmatterPort,
    markdownPort: MarkdownPort
  );
  
  async execute(): Promise<OrphanEntry[]>;
}
```

**GenerateMaintenanceReportUseCase**
```typescript
class GenerateMaintenanceReportUseCase {
  constructor(
    detectDuplicates: DetectDuplicatesUseCase,
    detectContradictions: DetectContradictionsUseCase,
    detectBrokenLinks: DetectBrokenLinksUseCase,
    detectOrphans: DetectOrphansUseCase
  );
  
  async execute(): Promise<MaintenanceReport>;
}
```

### Helper Functions

**validateAllLinks**
```typescript
function validateAllLinks(wikiDir: string): Promise<BrokenLinkEntry[]>;
```

**detectDuplicates**
```typescript
function detectDuplicates(
  wikiDir: string,
  similarityThreshold?: number
): Promise<DuplicateEntry[]>;
```

**detectContradictions**
```typescript
function detectContradictions(wikiDir: string): Promise<ContradictionEntry[]>;
```

**suggestConsolidation**
```typescript
function suggestConsolidation(wikiDir: string): Promise<ConsolidationEntry[]>;
```

**findOrphans**
```typescript
function findOrphans(wikiDir: string): Promise<OrphanEntry[]>;
```

**generateMaintenanceReport**
```typescript
function generateMaintenanceReport(wikiDir: string): Promise<MaintenanceReport>;
```

### Data Types

**DuplicateEntry**
```typescript
interface DuplicateEntry {
  page1: WikiPage;
  page2: WikiPage;
  similarity: number;
  recommendation: string;
}
```

**ContradictionEntry**
```typescript
interface ContradictionEntry {
  page1: WikiPage;
  page2: WikiPage;
  statement1: string;
  statement2: string;
  severity: 'low' | 'medium' | 'high';
}
```

**BrokenLinkEntry**
```typescript
interface BrokenLinkEntry {
  sourcePage: WikiPage;
  targetTitle: string;
  position: number;
  suggestions: string[];
}
```

**OrphanEntry**
```typescript
interface OrphanEntry {
  page: WikiPage;
  reason: string;
  suggestedLinks: string[];
}
```

**ConsolidationEntry**
```typescript
interface ConsolidationEntry {
  pages: WikiPage[];
  reason: string;
  suggestedAction: string;
}
```

## Usage Examples

### Detecting Broken Links

```typescript
import { validateAllLinks } from '@wiki/application-maintenance';

const brokenLinks = await validateAllLinks('wiki');

console.log(`Found ${brokenLinks.length} broken links:`);
for (const broken of brokenLinks) {
  console.log(`  ${broken.sourcePage.frontmatter.title}:`);
  console.log(`    - Broken link to: ${broken.targetTitle}`);
  if (broken.suggestions.length > 0) {
    console.log(`    - Suggestions: ${broken.suggestions.join(', ')}`);
  }
}
```

### Detecting Duplicate Content

```typescript
import { detectDuplicates } from '@wiki/application-maintenance';

const duplicates = await detectDuplicates('wiki', 0.7);

console.log(`Found ${duplicates.length} potential duplicates:`);
for (const dup of duplicates) {
  console.log(`  ${dup.page1.frontmatter.title} <-> ${dup.page2.frontmatter.title}`);
  console.log(`    Similarity: ${(dup.similarity * 100).toFixed(1)}%`);
  console.log(`    Recommendation: ${dup.recommendation}`);
}
```

### Finding Orphaned Pages

```typescript
import { findOrphans } from '@wiki/application-maintenance';

const orphans = await findOrphans('wiki');

console.log(`Found ${orphans.length} orphaned pages:`);
for (const orphan of orphans) {
  console.log(`  ${orphan.page.frontmatter.title}`);
  console.log(`    Reason: ${orphan.reason}`);
  if (orphan.suggestedLinks.length > 0) {
    console.log(`    Could link from: ${orphan.suggestedLinks.join(', ')}`);
  }
}
```

### Detecting Contradictions

```typescript
import { detectContradictions } from '@wiki/application-maintenance';

const contradictions = await detectContradictions('wiki');

console.log(`Found ${contradictions.length} potential contradictions:`);
for (const contradiction of contradictions) {
  console.log(`  ${contradiction.page1.frontmatter.title} vs ${contradiction.page2.frontmatter.title}`);
  console.log(`    Statement 1: ${contradiction.statement1}`);
  console.log(`    Statement 2: ${contradiction.statement2}`);
  console.log(`    Severity: ${contradiction.severity}`);
}
```

### Generating Consolidation Suggestions

```typescript
import { suggestConsolidation } from '@wiki/application-maintenance';

const suggestions = await suggestConsolidation('wiki');

console.log(`Found ${suggestions.length} consolidation opportunities:`);
for (const suggestion of suggestions) {
  const titles = suggestion.pages.map(p => p.frontmatter.title);
  console.log(`  ${titles.join(' + ')}`);
  console.log(`    Reason: ${suggestion.reason}`);
  console.log(`    Action: ${suggestion.suggestedAction}`);
}
```

### Generating Complete Maintenance Report

```typescript
import { generateMaintenanceReport } from '@wiki/application-maintenance';

const report = await generateMaintenanceReport('wiki');

console.log('=== Wiki Maintenance Report ===');
console.log(`Generated: ${report.timestamp.toISOString()}\n`);

console.log(`Health Summary:`);
console.log(`  Overall Score: ${report.summary.healthScore}/100`);
console.log(`  Total Pages: ${report.summary.totalPages}`);
console.log(`  Issues Found: ${report.summary.totalIssues}\n`);

console.log(`Duplicates: ${report.duplicates.length}`);
for (const dup of report.duplicates) {
  console.log(`  - ${dup.page1.frontmatter.title} / ${dup.page2.frontmatter.title}`);
}

console.log(`\nBroken Links: ${report.brokenLinks.length}`);
for (const broken of report.brokenLinks) {
  console.log(`  - ${broken.sourcePage.frontmatter.title} -> ${broken.targetTitle}`);
}

console.log(`\nOrphans: ${report.orphans.length}`);
for (const orphan of report.orphans) {
  console.log(`  - ${orphan.page.frontmatter.title}`);
}

console.log(`\nContradictions: ${report.contradictions.length}`);
for (const contra of report.contradictions) {
  console.log(`  - ${contra.page1.frontmatter.title} vs ${contra.page2.frontmatter.title}`);
}
```

### Using Individual Use Cases

```typescript
import { DetectBrokenLinksUseCase } from '@wiki/application-maintenance';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();
const markdownPort = new MarkdownAdapter();

const detectBrokenLinks = new DetectBrokenLinksUseCase(
  fileSystemPort,
  frontmatterPort,
  markdownPort
);

const brokenLinks = await detectBrokenLinks.execute();

console.log('Broken link analysis complete');
console.log(`Found ${brokenLinks.length} broken links`);
```

### Periodic Maintenance Workflow

```typescript
import { generateMaintenanceReport } from '@wiki/application-maintenance';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { MarkdownAdapter } from '@wiki/infrastructure-markdown';

const fileSystemPort = new FileSystemAdapter();
const markdownPort = new MarkdownAdapter();

const report = await generateMaintenanceReport('wiki');

const reportContent = [
  markdownPort.generateHeading('Wiki Maintenance Report', 1),
  '',
  `Generated: ${report.timestamp.toISOString()}`,
  '',
  markdownPort.generateHeading('Health Summary', 2),
  `- Overall Score: ${report.summary.healthScore}/100`,
  `- Total Pages: ${report.summary.totalPages}`,
  `- Issues: ${report.summary.totalIssues}`,
  '',
  markdownPort.generateHeading('Issues by Category', 2),
  `- Duplicates: ${report.duplicates.length}`,
  `- Broken Links: ${report.brokenLinks.length}`,
  `- Orphans: ${report.orphans.length}`,
  `- Contradictions: ${report.contradictions.length}`,
  ''
].join('\n');

await fileSystemPort.writeWikiFile(
  'maintenance-report.md',
  reportContent
);

console.log('Maintenance report saved to wiki/maintenance-report.md');

if (report.summary.healthScore < 80) {
  console.warn('Wiki health below threshold - action required');
}
```

### Custom Similarity Threshold

```typescript
import { DetectDuplicatesUseCase } from '@wiki/application-maintenance';
import { FileSystemAdapter } from '@wiki/infrastructure-filesystem';
import { FrontmatterAdapter } from '@wiki/infrastructure-frontmatter';

const fileSystemPort = new FileSystemAdapter();
const frontmatterPort = new FrontmatterAdapter();

const strictDetection = new DetectDuplicatesUseCase(
  fileSystemPort,
  frontmatterPort,
  0.9
);

const strictDuplicates = await strictDetection.execute();
console.log(`Strict duplicates (90%+): ${strictDuplicates.length}`);

const looseDetection = new DetectDuplicatesUseCase(
  fileSystemPort,
  frontmatterPort,
  0.5
);

const looseDuplicates = await looseDetection.execute();
console.log(`Potential duplicates (50%+): ${looseDuplicates.length}`);
```

## Dependencies

**External Dependencies:** None

**Internal Dependencies:**
- `@wiki/domain-models` - MaintenanceReport, WikiPage types
- `@wiki/application-ports` - FileSystemPort, MarkdownPort, FrontmatterPort interfaces
- `@wiki/infrastructure-filesystem` - FileSystemAdapter (used by helper functions)
- `@wiki/infrastructure-markdown` - MarkdownAdapter (used by helper functions)
- `@wiki/infrastructure-frontmatter` - FrontmatterAdapter (used by helper functions)

## Related Libraries

This library is used by:
- `@wiki/application-workflow` - Periodic maintenance workflows
- `@wiki/core` - Public API facade for maintenance operations
