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

- [[angular-cdk]] — Headless behavior primitives and utilities for Angular UI components (v21.2.10)
- [[angular-material]] — Angular Material component library

## Concepts

*Concept pages explain ideas, patterns, and principles*

- [[list-key-manager]] — Keyboard navigation across lists (ArrowUp/Down, Home/End, typeahead)
- [[focus-trap]] — Constrains keyboard focus to a DOM region (modals, drawers)
- [[live-announcer]] — Pushes messages to screen readers via ARIA live regions
- [[overlay-positioning]] — Floating panel positioning with fallbacks and scroll strategies
- [[component-portal]] — Dynamic content projection decoupled from render location
- [[virtual-scrolling]] — Renders only visible items for large data sets
- [[selection-model]] — Tracks single/multi-select state with change events
- [[drag-drop]] — Draggable elements with list sorting and transfer
- [[component-harness]] — Environment-agnostic testing abstraction for UI components

## Recent Sources

*Source summaries distill key information from raw documents*

- [[angular-cdk-big-picture-2026-05-12]] — @angular/cdk v21.2.10 Big Picture research

## Navigation

- [Activity Log](activity-log.md) - Chronological record of wiki changes
- [All Entities](entities/) - Browse all entity pages
- [All Concepts](concepts/) - Browse all concept pages
- [All Sources](sources/) - Browse all source summaries
- [Schema Configuration](../WIKI_SCHEMA.md) - Wiki structure and conventions

## Statistics

- **Total Pages**:
- **Last Updated**: 
- **Wiki Health**: 

## Quick Reference

**Search by Tag:**
- `#angular` - Angular-related content
- `#accessibility` - Accessibility topics
- `#aria` - ARIA specifications and patterns

**Common Workflows:**
- Ingestion: `raw/` → wiki pages → index update → activity log → git commit
- Query: search → results → cross-references → context
- Maintenance: validate links → detect duplicates → consolidate → report
