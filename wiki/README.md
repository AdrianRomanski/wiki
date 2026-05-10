# Wiki Directory

## Overview

The `wiki/` directory contains **AI-generated, structured wiki pages** that form the knowledge base of the LLM Wiki Second Brain system. These pages are created from raw sources through the ingestion workflow and are cross-referenced to create a navigable knowledge graph.

## Purpose

- **Structured Knowledge**: Organize information into entities, concepts, and source summaries
- **Cross-Referenced**: Link related pages to create a knowledge graph
- **Searchable**: Enable efficient querying by tags, names, and full-text
- **Maintainable**: Support periodic review, consolidation, and quality improvements
- **Git-Versioned**: Track all changes for history and collaboration

## Directory Structure

```
wiki/
├── README.md              # This file
├── index.md               # Top-level navigation and overview
├── activity-log.md        # Chronological record of wiki changes
├── entities/              # Pages about specific things
│   └── angular-cdk.md
├── concepts/              # Pages about ideas and patterns
│   └── progressive-enhancement.md
└── sources/               # Summaries of raw source documents
    └── example-source-2024-05-10.md
```

## Page Types

### Entity Pages (`entities/`)

Describe specific things: libraries, tools, components, APIs, people, or concrete objects.

**Structure:**
- Definition
- Properties and characteristics
- Relationships to other entities
- Code examples
- References to sources

**Example:** `angular-cdk.md`, `aria-live-region.md`, `screen-reader.md`

### Concept Pages (`concepts/`)

Explain ideas, patterns, principles, or abstract notions.

**Structure:**
- Explanation and context
- Applications and use cases
- Related concepts
- Examples and demonstrations
- References to sources

**Example:** `progressive-enhancement.md`, `keyboard-navigation.md`, `semantic-html.md`

### Source Summaries (`sources/`)

Distill key information from raw source documents.

**Structure:**
- Source metadata (author, date, URL)
- Key points and insights
- Relevant entities and concepts
- Notable quotes
- Link to raw source file

**Example:** `wcag-guide-2024-05-10.md`, `angular-aria-research-2024-05-10.md`

## Workflows

### Ingestion Workflow

**Purpose:** Convert raw sources into structured wiki pages.

**Process:**
1. Read raw source from `raw/` directory
2. Analyze content to identify entities, concepts, and insights
3. Generate appropriate wiki pages with structured content
4. Add cross-references to related existing pages
5. Update `index.md` with new pages
6. Record event in `activity-log.md`
7. Commit changes to git

**Trigger:** When new files are added to `raw/` directory

### Query Workflow

**Purpose:** Search and retrieve information from the wiki.

**Methods:**
- **Full-Text Search**: Search across all wiki content
- **Tag-Based Search**: Filter by tags in frontmatter
- **Name-Based Search**: Find entities or concepts by name
- **Cross-Reference Navigation**: Follow `[[WikiLink]]` connections

**Output:** Ranked results with cross-reference context

### Maintenance Workflow

**Purpose:** Review and improve wiki quality.

**Tasks:**
- Validate all `[[WikiLink]]` references
- Detect duplicate or overlapping content
- Identify contradictions across pages
- Suggest consolidation opportunities
- Find orphaned pages (no incoming links)
- Generate maintenance report with recommendations

**Trigger:** Periodic (weekly/monthly) or on-demand

## Cross-Referencing

### WikiLink Syntax

Use `[[WikiLink]]` syntax to link between wiki pages:

```markdown
The [[angular-cdk]] provides primitives for [[keyboard-navigation]].

See [[progressive-enhancement]] for design principles.
```

### Linking Guidelines

- Link entity names when mentioned
- Link concept names when explained
- Create bidirectional links (if A links to B, B should reference A)
- Only link when it adds value (avoid over-linking)
- Validate links during maintenance workflow

## Frontmatter

All wiki pages include YAML frontmatter with metadata:

```yaml
---
title: Page Title
type: entity | concept | source
tags: [tag1, tag2, tag3]
sources: [source-ref-1, source-ref-2]  # Optional
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

## Navigation

### Index Page (`index.md`)

The index page provides:
- Overview of the wiki
- Lists of all entities, concepts, and recent sources
- Navigation links to major sections
- Statistics (total pages, last updated, health score)
- Quick reference for common workflows

**Always keep the index synchronized with wiki content.**

### Activity Log (`activity-log.md`)

The activity log records:
- Wiki page creation events
- Wiki page update events
- Raw source ingestion events
- Maintenance workflow runs

**Entries are in reverse chronological order (newest first).**

## External Tool Compatibility

### Obsidian

The wiki is fully compatible with Obsidian:

- ✓ Open `wiki/` directory in Obsidian
- ✓ Use graph view to visualize cross-references
- ✓ Navigate with `[[WikiLink]]` syntax
- ✓ Search by tags (frontmatter or inline `#tag`)
- ✓ View and edit markdown files

### Search Tools (qmd, ripgrep, etc.)

The wiki structure supports external search tools:

```bash
# Search with qmd
qmd "accessibility" wiki/

# Search with ripgrep
rg "keyboard navigation" wiki/

# Find by tag
rg "tags:.*accessibility" wiki/
```

## Git Integration

All wiki changes are tracked in version control:

**View History:**
```bash
# See all wiki changes
git log -- wiki/

# See changes to specific page
git log -- wiki/entities/angular-cdk.md

# View diff
git diff HEAD~1 wiki/entities/angular-cdk.md
```

**Commit Format:**
```
[wiki] <action>: <brief description>

<optional detailed description>
```

## Best Practices

### ✓ DO

- Generate structured content following page type templates
- Add cross-references to related pages
- Update `index.md` when creating new pages
- Record events in `activity-log.md`
- Use descriptive, kebab-case filenames
- Include all required frontmatter fields
- Update the `updated` field when modifying pages
- Run maintenance workflow periodically
- Commit changes with meaningful messages

### ✗ DON'T

- Modify raw source files (they're immutable)
- Create pages without proper frontmatter
- Use broken `[[WikiLink]]` references
- Nest subdirectories deeply (keep structure flat)
- Duplicate content across multiple pages
- Leave orphaned pages (no incoming links)
- Modify Angular project files (`apps/`, `libs/`, `.kiro/`)

## Examples

### Creating an Entity Page

```markdown
---
title: ARIA Live Region
type: entity
tags: [aria, accessibility, screen-reader]
sources: [wcag-guide-2024-05-10]
created: 2024-05-10
updated: 2024-05-10
---

# ARIA Live Region

## Definition

An ARIA live region is a section of a web page that announces dynamic content changes to screen readers without requiring user focus.

## Properties

- **aria-live**: Politeness level (off, polite, assertive)
- **aria-atomic**: Announce entire region or just changes
- **aria-relevant**: What changes to announce (additions, removals, text, all)

## Relationships

- Used by [[screen-reader]]
- Implemented in [[angular-cdk]] LiveAnnouncer
- Supports [[progressive-enhancement]]

## Examples

\`\`\`html
<div aria-live="polite" aria-atomic="true">
  <p>{{ statusMessage }}</p>
</div>
\`\`\`

## References

- [[wcag-guide-2024-05-10]]
```

### Creating a Concept Page

```markdown
---
title: Keyboard Navigation
type: concept
tags: [accessibility, keyboard, interaction]
sources: [accessibility-patterns-2024-05-10]
created: 2024-05-10
updated: 2024-05-10
---

# Keyboard Navigation

## Explanation

Keyboard navigation is the ability to interact with a web application using only keyboard input, without requiring a mouse or touch input.

## Applications

- Essential for users with motor disabilities
- Required for screen reader users
- Improves efficiency for power users
- Necessary for WCAG compliance

## Related Concepts

- [[progressive-enhancement]]
- [[focus-management]]
- [[aria-patterns]]

## Examples

\`\`\`typescript
@HostListener('keydown', ['$event'])
handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    this.activate();
    event.preventDefault();
  }
}
\`\`\`

## References

- [[angular-cdk]]
```

## Questions?

- See `WIKI_SCHEMA.md` for complete system documentation
- See `raw/README.md` for source organization
- See `index.md` for navigation and overview
