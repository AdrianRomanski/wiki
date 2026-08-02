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
- **Example Files**: `wcag-guide-2024-05-10.md`, `angular-aria-research-2024-05-10.md`

## Specification & Single Source of Truth

> ℹ️ **System Schema Contract**: The authoritative single source of truth (SSOT) for page frontmatter requirements, strict title-based `[[WikiLink]]` conventions, and automated workflows (Ingestion, Query, Maintenance) is documented in [../WIKI_SCHEMA.md](../WIKI_SCHEMA.md).

## Page Types Summary

For complete YAML frontmatter specifications and field contracts, see [../WIKI_SCHEMA.md](../WIKI_SCHEMA.md#page-types).

### Entity Pages (`entities/`)

Describe specific things: libraries, tools, components, APIs, people, or concrete objects.
- **Example Files**: `angular-cdk.md`, `aria-live-region.md`, `screen-reader.md`

### Concept Pages (`concepts/`)

Explain ideas, patterns, principles, or abstract notions.
- **Example Files**: `progressive-enhancement.md`, `keyboard-navigation.md`, `semantic-html.md`

### Source Summaries (`sources/`)

Distill key information from raw source documents.
- **Example Files**: `wcag-guide-2024-05-10.md`, `angular-aria-research-2024-05-10.md`

## Cross-Referencing Rules

### WikiLink Syntax

Use `[[WikiLink]]` syntax to link between wiki pages. **Always use the target page's frontmatter `title` property** (not the filename or slug) to prevent ghost nodes in graph visualizers (see [WIKI_SCHEMA.md](../WIKI_SCHEMA.md#wikilink-syntax)):

```markdown
The [[Angular CDK]] provides primitives for [[Keyboard Navigation]].

See [[Progressive Enhancement]] for design principles.
```

### Linking Guidelines

- Link entity names when mentioned using exact page titles (e.g. `[[Angular CDK]]`)
- Link concept names when explained using exact page titles (e.g. `[[Progressive Enhancement]]`)
- Create bidirectional links (if Page A links to Page B, Page B should reference Page A)
- Only link when it adds value (avoid over-linking)

## Frontmatter & Workflows

All wiki pages require YAML frontmatter. Automated workflows (Ingestion, Query, Maintenance) operate on these fields. Refer to [../WIKI_SCHEMA.md](../WIKI_SCHEMA.md#frontmatter-requirements) for exact field definitions and workflow triggers.

## Navigation

### Index Page (`index.md`)

The index page provides:
- Overview of the wiki
- Lists of all entities, concepts, and recent sources
- Navigation links to major sections
- Statistics (total pages, last updated, health score)

**Always keep the index synchronized with wiki content.**

### Activity Log (`activity-log.md`)

The activity log records chronological wiki page creation, updates, and maintenance events.

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
```

**Commit Format:**
```
[wiki] <action>: <brief description>

<optional detailed description>
```

## Examples

### Entity Page Example

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

- Used by [[Screen Reader]]
- Implemented in [[Angular CDK]] LiveAnnouncer
- Supports [[Progressive Enhancement]]

## Examples

```html
<div aria-live="polite" aria-atomic="true">
  <p>{{ statusMessage }}</p>
</div>
```

## References

- [[WCAG 2.1 Overview]]
```

### Concept Page Example

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

- [[Progressive Enhancement]]
- [[Focus Management]]
- [[ARIA Patterns]]

## Examples

```typescript
@HostListener('keydown', ['$event'])
handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    this.activate();
    event.preventDefault();
  }
}
```

## References

- [[Angular CDK]]
```

## Questions & Reference Links

- See [WIKI_SCHEMA.md](../WIKI_SCHEMA.md) for complete system documentation and schema specification
- See `raw/README.md` for raw source document organization
- See [index.md](index.md) for navigation and overview
