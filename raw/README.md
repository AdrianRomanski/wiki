# Raw Sources Directory

## Overview

The `raw/` directory stores **immutable source documents** that serve as input for the LLM Wiki Second Brain knowledge management system. Files in this directory are never modified after they are added—they remain as permanent, original references.

## Purpose

- **Preserve Original Content**: Keep source documents in their original form
- **Enable Traceability**: Link wiki pages back to their source materials
- **Support Re-ingestion**: Allow wiki pages to be regenerated from sources if needed
- **Maintain Context**: Preserve full context that may not fit in wiki summaries

## Directory Structure

```
raw/
├── README.md              # This file
├── articles/              # Web articles, blog posts
├── papers/                # Research papers, PDFs
├── code-snippets/         # Code examples, gists
├── notes/                 # Personal research notes
└── angular-aria/          # Angular Aria specific sources
```

## Supported File Formats

- **Markdown** (`.md`) - Articles, notes, documentation
- **PDF** (`.pdf`) - Research papers, technical documents
- **Text** (`.txt`) - Plain text notes, transcripts
- **Code** (`.ts`, `.js`, `.html`, `.css`, etc.) - Code examples and snippets

## Organization Guidelines

### By Category

Place files in the appropriate subdirectory based on content type:

- **articles/** - Web articles, blog posts, tutorials from external sources
- **papers/** - Academic papers, technical whitepapers, formal research
- **code-snippets/** - Standalone code examples, gists, sample implementations
- **notes/** - Personal research notes, meeting notes, brainstorming sessions
- **angular-aria/** - Angular Aria specific research, examples, and findings

### Naming Conventions

Use descriptive, kebab-case filenames that indicate content:

- ✓ `wcag-2.1-overview.pdf`
- ✓ `angular-cdk-accessibility-guide.md`
- ✓ `focus-trap-implementation.ts`
- ✗ `document1.pdf`
- ✗ `notes.txt`

Include dates for time-sensitive content:

- `aria-live-regions-2024-05-10.md`
- `angular-17-release-notes-2024-03-15.md`

## Adding Sources

### Step 1: Place File in Appropriate Directory

```bash
# Example: Adding a web article
cp ~/Downloads/accessibility-guide.md raw/articles/

# Example: Adding a research paper
cp ~/Downloads/wcag-study.pdf raw/papers/

# Example: Adding code snippet
cp ~/Downloads/focus-trap.ts raw/code-snippets/
```

### Step 2: Run Ingestion Workflow

After adding a source, run the ingestion workflow to generate wiki pages:

```bash
# Ingestion will:
# 1. Read the raw source
# 2. Generate wiki pages (entities, concepts, or source summaries)
# 3. Add cross-references to related pages
# 4. Update wiki/index.md
# 5. Record event in wiki/activity-log.md
# 6. Commit changes to git
```

### Step 3: Verify Wiki Pages Created

Check `wiki/` directory for generated pages and verify they appear in `wiki/index.md`.

## Important Rules

### ✓ DO

- Add new source documents to appropriate subdirectories
- Use descriptive filenames
- Include metadata (author, date, URL) in markdown frontmatter when possible
- Organize by category (articles, papers, code-snippets, notes, angular-aria)
- Keep original filenames when they're descriptive

### ✗ DON'T

- Modify files after adding them (immutability principle)
- Delete sources that have been ingested (wiki pages reference them)
- Use deeply nested subdirectories (keep structure flat)
- Store generated or derived content (that belongs in `wiki/`)
- Add binary files other than PDFs (images, videos, etc.)

## Metadata for Markdown Sources

When adding markdown sources, include frontmatter with metadata:

```markdown
---
title: Article Title
author: Author Name
date: 2024-05-10
url: https://example.com/article
source_type: article
tags: [accessibility, angular, aria]
---

# Article Content

...
```

This metadata will be extracted during ingestion and included in the generated wiki pages.

## Integration with Wiki

### Source References

Wiki pages reference raw sources in their frontmatter:

```yaml
---
title: Angular CDK
type: entity
sources: [angular-cdk-docs-2024-05-10]
---
```

### Source Summaries

Each raw source can generate a source summary page in `wiki/sources/` that distills key information:

- Key points and insights
- Relevant entities and concepts
- Notable quotes
- Links to generated entity/concept pages

## Examples

### Adding a Web Article

```bash
# 1. Download article as markdown
curl https://example.com/article > raw/articles/accessibility-patterns-2024-05-10.md

# 2. Run ingestion workflow
# (generates wiki pages)

# 3. Verify in wiki/index.md
```

### Adding Research Notes

```bash
# 1. Create notes file
cat > raw/notes/angular-aria-research-2024-05-10.md << EOF
# Angular Aria Research Session

## Findings
- Focus management is critical for dialogs
- LiveAnnouncer provides screen reader notifications
- CDK a11y module has excellent primitives

## Next Steps
- Test with NVDA and JAWS
- Build example dialog component
- Document keyboard shortcuts
EOF

# 2. Run ingestion workflow
```

### Adding Code Snippet

```bash
# 1. Save code snippet
cat > raw/code-snippets/focus-trap-example.ts << EOF
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

export class DialogComponent {
  private focusTrap: FocusTrap;
  
  constructor(private focusTrapFactory: FocusTrapFactory) {}
  
  ngOnInit() {
    this.focusTrap = this.focusTrapFactory.create(this.elementRef.nativeElement);
  }
}
EOF

# 2. Run ingestion workflow
```

## Questions?

- See `WIKI_SCHEMA.md` for complete system documentation
- See `wiki/README.md` for wiki structure and workflows
- See `wiki/index.md` for navigation and overview
