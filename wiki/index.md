# Wiki Index

## Overview

Welcome to the LLM Wiki Second Brain - an AI-powered knowledge management system for the Angular Aria research project. This wiki maintains a curated, cross-referenced knowledge base that compounds research findings over time.

**Key Features:**
- 📚 Immutable raw sources in `raw/` directory
- 🤖 AI-generated, structured wiki pages
- 🔗 Cross-referenced knowledge graph using [[WikiLink]] syntax
- 📝 Git-versioned for history and collaboration
- 🔍 Compatible with Obsidian and search tools

## Getting Started

1. **Add Sources**: Place documents in `raw/` subdirectories (articles/, papers/, code-snippets/, notes/, angular-aria/)
2. **Ingest Content**: Run ingestion workflow to generate wiki pages
3. **Query Knowledge**: Search by tags, names, or full-text
4. **Maintain Quality**: Run periodic maintenance to consolidate and validate

## Entities

*Entity pages describe specific things: libraries, tools, components, APIs*

- [[@angular/cdk/a11y]] - Library evaluated in Choose Focus Trap Library for Keyboard Navigation
- [[Angular CDK]] - The Angular Component Dev Kit provides behavior primitives.
- [[Custom solution]] - Library evaluated in Choose Focus Trap Library for Keyboard Navigation
- [[Entity 1]] - First entity
- [[Entity 2]] - Second entity
- [[Entity 3]] - Third entity
- [[focus-trap]] - Library evaluated in Choose Focus Trap Library for Keyboard Navigation
- [[Test Entity]] - An entity for testing

## Concepts

*Concept pages explain ideas, patterns, and principles*

- [[Progressive Enhancement]] - Progressive enhancement provides a baseline experience to all users.
- [[Standalone Components]] - Modern Angular architecture without NgModules.
- [[Test Concept]] - A concept for testing

## Recent Sources

*Source summaries distill key information from raw documents*

- [[seat-selection-component-2026-05-10]] (2026-05-10) - Analysis of Angular standalone component
- [[example-source-2024-05-10]] (2024-05-10) - Example source summary
- [[Angular ARIA Guide]] (2024-05-10) - Use semantic HTML
- [[Angular ARIA Guide]] (2024-05-10) - Use semantic HTML
- [[Angular ARIA Guide]] (2024-05-10) - Use semantic HTML
- [[Angular ARIA Guide]] (2024-05-10) - Use semantic HTML
- [[Angular ARIA Guide]] (2024-05-10) - Use semantic HTML
- [[Angular ARIA Guide]] (2024-05-10) - Use semantic HTML
- [[Choose Focus Trap Library for Keyboard Navigation]] (2024-05-10) - Research decision: @angular/cdk/a11y

## Navigation

- [Activity Log](activity-log.md) - Chronological record of wiki changes
- [All Entities](entities/) - Browse all entity pages
- [All Concepts](concepts/) - Browse all concept pages
- [All Sources](sources/) - Browse all source summaries
- [Schema Configuration](../WIKI_SCHEMA.md) - Wiki structure and conventions

## Statistics

- **Total Pages**: 20 (8 entities, 3 concepts, 9 sources)
- **Last Updated**: 2026-05-10
- **Wiki Health**: 100/100 ✓

## Quick Reference

**Search by Tag:**
- `#angular` - Angular-related content
- `#accessibility` - Accessibility topics
- `#aria` - ARIA specifications and patterns

**Common Workflows:**
- Ingestion: `raw/` → wiki pages → index update → activity log → git commit
- Query: search → results → cross-references → context
- Maintenance: validate links → detect duplicates → consolidate → report
