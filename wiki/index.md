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

- [[@angular/aria]] - Angular's official headless accessibility library (8 patterns, v21+)
- [[Angular Aria Grid Pattern]] - The 2D interactive grid pattern from @angular/aria
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

- [[Headless Accessibility Pattern]] - Behavior + ARIA semantics without styling; you own the CSS
- [[Progressive Enhancement]] - Progressive enhancement provides a baseline experience to all users.
- [[Standalone Components]] - Modern Angular architecture without NgModules.
- [[Test Concept]] - A concept for testing

## Recent Sources

*Source summaries distill key information from raw documents*

- [[Angular Aria Grid Deep Dive]] (2026-05-11) - Deep dive into @angular/aria grid pattern internals
- [[Angular Aria Big Picture]] (2026-05-11) - Overview of @angular/aria library — 8 patterns, architecture, API
- [[Choose Angular Aria Grid for Cinema Seat Selection]] (2026-05-11) - Research decision: @angular/aria/grid for cinema seat selection
- [[seat-selection-component-2026-05-10]] (2026-05-10) - Analysis of Angular standalone component
- [[example-source-2024-05-10]] (2024-05-10) - Example source summary
- [[Angular ARIA Guide]] (2024-05-10) - Use semantic HTML
- [[Choose Focus Trap Library for Keyboard Navigation]] (2024-05-10) - Research decision: @angular/cdk/a11y
- [[Minimal ADR]] (2024-05-10) - Research decision: Option A

## Navigation

- [Activity Log](activity-log.md) - Chronological record of wiki changes
- [All Entities](entities/) - Browse all entity pages
- [All Concepts](concepts/) - Browse all concept pages
- [All Sources](sources/) - Browse all source summaries
- [Schema Configuration](../WIKI_SCHEMA.md) - Wiki structure and conventions

## Statistics

- **Total Pages**: 26 (10 entities, 4 concepts, 12 sources)
- **Last Updated**: 2026-05-11
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
