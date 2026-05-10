# Wiki Schema Configuration

## Overview

This document defines the structure, conventions, and workflows for the LLM Wiki Second Brain knowledge management system. AI agents should read this file before executing any wiki-related workflows to understand the system's organization and rules.

## Directory Structure

```
repository-root/
├── raw/                           # Immutable source documents
│   ├── README.md                  # Source organization guide
│   ├── articles/                  # Web articles, blog posts
│   ├── papers/                    # Research papers, PDFs
│   ├── code-snippets/             # Code examples, gists
│   ├── notes/                     # Personal research notes
│   └── angular-aria/              # Angular Aria specific sources
├── wiki/                          # AI-generated wiki pages
│   ├── README.md                  # Wiki structure and workflow guide
│   ├── index.md                   # Top-level navigation page
│   ├── activity-log.md            # Chronological change log
│   ├── entities/                  # Pages about specific things
│   ├── concepts/                  # Pages about ideas and patterns
│   └── sources/                   # Summaries of raw sources
└── WIKI_SCHEMA.md                 # This file
```

## Page Types

### Entity Pages (wiki/entities/)

Entity pages describe specific things: people, libraries, tools, components, APIs, or concrete objects.

**Structure:**
```markdown
---
title: Entity Name
type: entity
tags: [tag1, tag2, tag3]
sources: [source-ref-1, source-ref-2]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Entity Name

## Definition
[What is this entity? Provide a clear, concise definition]

## Properties
[Key attributes, characteristics, and features]

## Relationships
- Related to [[Other Entity]]
- Used in [[Concept Name]]
- Implements [[Pattern Name]]

## Examples
[Code examples, demonstrations, or usage patterns]

## References
- [[Source Summary 1]]
- [[Source Summary 2]]
```

**Naming Convention:** `kebab-case-noun.md`
- Examples: `angular-cdk.md`, `aria-live-region.md`, `screen-reader.md`

### Concept Pages (wiki/concepts/)

Concept pages explain ideas, patterns, principles, or abstract notions.

**Structure:**
```markdown
---
title: Concept Name
type: concept
tags: [tag1, tag2, tag3]
sources: [source-ref-1]
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Concept Name

## Explanation
[What is this concept? Provide context and background]

## Applications
[Where and how is this concept applied? Real-world use cases]

## Related Concepts
- [[Related Concept 1]]
- [[Related Concept 2]]
- [[Contrasting Concept]]

## Examples
[Demonstrations, code samples, or practical applications]

## References
- [[Source Summary]]
- [[Entity Name]]
```

**Naming Convention:** `kebab-case-concept.md`
- Examples: `progressive-enhancement.md`, `keyboard-navigation.md`, `semantic-html.md`

### Source Summaries (wiki/sources/)

Source summaries distill key information from raw source documents.

**Structure:**
```markdown
---
title: Source Title
type: source
author: Author Name
date: YYYY-MM-DD
url: https://...
tags: [tag1, tag2, tag3]
created: YYYY-MM-DD
---

# Source Title

## Metadata
- **Author**: Author Name
- **Date**: YYYY-MM-DD
- **URL**: [link](https://...)
- **Type**: article | paper | code | note
- **Raw Source**: `raw/category/filename.ext`

## Key Points
- Point 1
- Point 2
- Point 3

## Insights
[Important takeaways, learnings, and implications]

## Relevant Entities
- [[Entity 1]]
- [[Entity 2]]

## Relevant Concepts
- [[Concept 1]]
- [[Concept 2]]

## Quotes
> Notable quote from source

> Another important quote
```

**Naming Convention:** `source-title-yyyy-mm-dd.md`
- Examples: `angular-aria-guide-2024-05-10.md`, `wcag-overview-2024-03-15.md`

## Cross-Referencing Conventions

### WikiLink Syntax

Use `[[WikiLink]]` syntax for all cross-references between wiki pages.

**Basic Link:**
```markdown
[[Page Title]]
```

**Link with Custom Display Text:**
```markdown
[[Page Title|Display Text]]
```

**Link to Specific Section:**
```markdown
[[Page Title#Section Name]]
```

### Linking Guidelines

1. **Link Entity Mentions**: When an entity is mentioned in content, create a link if the entity page exists
2. **Link Concept Explanations**: When explaining a concept, link to related concept pages
3. **Bidirectional Linking**: Prefer bidirectional links - if page A links to page B, page B should reference page A
4. **Context-Aware Linking**: Only link when the reference adds value; avoid over-linking
5. **Validate Links**: All links should point to existing pages; broken links should be flagged during maintenance

## Workflows

### Ingestion Workflow

**Purpose:** Convert raw source documents into structured wiki pages.

**Steps:**
1. **Read Raw Source**: Access the document from `raw/` directory
2. **Analyze Content**: Determine what entities, concepts, or insights are present
3. **Generate Wiki Pages**: Create at least one wiki page (entity, concept, or source summary)
4. **Add Cross-References**: Link to existing related pages
5. **Update Index**: Add new pages to `wiki/index.md`
6. **Record Activity**: Log the ingestion event in `wiki/activity-log.md`
7. **Commit to Git**: Create a meaningful commit message

**AI Instructions:**
- Preserve raw source files without modification
- Generate structured content following page type templates
- Use appropriate naming conventions
- Create bidirectional links where relevant
- Extract key insights and organize them logically

### Query Workflow

**Purpose:** Search and retrieve information from the wiki.

**Search Methods:**
1. **Full-Text Search**: Search across all wiki page content
2. **Tag-Based Search**: Filter by tags in frontmatter
3. **Name-Based Search**: Find entities or concepts by name
4. **Cross-Reference Search**: Find related pages through links

**AI Instructions:**
- Rank results by relevance
- Include cross-reference context in results
- Show backlinks for additional context
- Suggest related pages when appropriate

### Maintenance Workflow

**Purpose:** Review, consolidate, and improve wiki content quality.

**Tasks:**
1. **Link Validation**: Check all `[[WikiLink]]` references point to existing pages
2. **Duplicate Detection**: Identify overlapping or redundant content
3. **Contradiction Detection**: Find conflicting information across pages
4. **Consolidation Suggestions**: Recommend merging related pages
5. **Orphan Detection**: Find pages with no incoming links
6. **Freshness Review**: Identify outdated content that needs updates

**AI Instructions:**
- Generate a maintenance report with findings
- Flag issues by severity (low, medium, high)
- Provide actionable recommendations
- Suggest specific consolidation or update actions
- Calculate a wiki health score (0-100)

## Frontmatter Requirements

All wiki pages MUST include valid YAML frontmatter with these required fields:

**Required for All Pages:**
- `title`: Page title (string)
- `type`: Page type - `entity`, `concept`, or `source` (string)
- `tags`: Array of tags (array of strings)
- `created`: Creation date in YYYY-MM-DD format (string)
- `updated`: Last update date in YYYY-MM-DD format (string)

**Additional for Entity and Concept Pages:**
- `sources`: Array of source references (array of strings, optional)

**Additional for Source Summaries:**
- `author`: Author name (string, optional)
- `date`: Source publication date in YYYY-MM-DD format (string, optional)
- `url`: Source URL (string, optional)

**Example:**
```yaml
---
title: Angular CDK
type: entity
tags: [angular, accessibility, component-library]
sources: [angular-cdk-docs-2024-05-10]
created: 2024-05-10
updated: 2024-05-10
---
```

## Tag Conventions

### Tag Syntax

Tags can be specified in two ways:

1. **Frontmatter Tags** (preferred):
```yaml
---
tags: [angular, accessibility, aria]
---
```

2. **Inline Tags** (Obsidian-compatible):
```markdown
#angular #accessibility #aria
```

### Tag Guidelines

- Use lowercase kebab-case for multi-word tags: `screen-reader`, `keyboard-navigation`
- Be specific but not overly granular
- Reuse existing tags when appropriate
- Common tag categories:
  - Technology: `angular`, `typescript`, `html`, `css`
  - Domain: `accessibility`, `aria`, `wcag`
  - Type: `pattern`, `api`, `component`, `tool`
  - Status: `experimental`, `deprecated`, `stable`

## Naming Conventions Summary

| Page Type | Convention | Example |
|-----------|------------|---------|
| Entity | `kebab-case-noun.md` | `angular-cdk.md` |
| Concept | `kebab-case-concept.md` | `progressive-enhancement.md` |
| Source Summary | `source-title-yyyy-mm-dd.md` | `wcag-guide-2024-05-10.md` |

## External Tool Compatibility

### Obsidian Compatibility

The wiki structure is designed to work seamlessly with Obsidian:

- ✓ Standard markdown syntax
- ✓ `[[WikiLink]]` syntax for cross-references
- ✓ YAML frontmatter for metadata
- ✓ Graph view support through cross-references
- ✓ Tag support (both frontmatter and inline `#tag`)
- ✓ Navigable directory structure

### Search Tool Compatibility (qmd, ripgrep, etc.)

The wiki structure supports external search tools:

- ✓ Flat/shallow directory structure for efficient indexing
- ✓ Consistent markdown structure for reliable parsing
- ✓ Consistent naming conventions
- ✓ Plain text files (no binary formats in wiki/)

## Git Integration

All wiki changes should be tracked in version control:

**Commit Message Format:**
```
[wiki] <action>: <brief description>

<optional detailed description>
```

**Examples:**
- `[wiki] add: entity page for Angular CDK`
- `[wiki] update: keyboard-navigation concept with new examples`
- `[wiki] ingest: WCAG 2.1 overview article`
- `[wiki] maintain: fix broken links in 3 pages`

## Best Practices

1. **Immutability**: Never modify files in `raw/` after ingestion
2. **Atomicity**: Make focused, single-purpose wiki pages
3. **Cross-Reference**: Link liberally to create a knowledge graph
4. **Update Dates**: Always update the `updated` field in frontmatter when modifying pages
5. **Activity Log**: Record all significant wiki operations
6. **Index Maintenance**: Keep `wiki/index.md` synchronized with wiki content
7. **Validation**: Run maintenance workflow periodically to ensure quality
8. **Coexistence**: Never modify Angular project files (`apps/`, `libs/`, `.kiro/`)

## Version

Schema Version: 1.0.0
Last Updated: 2024-05-10
