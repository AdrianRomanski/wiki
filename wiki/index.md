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

- [[Angular Aria]] — `@angular/aria` is Angular's first-party library for building **fully accessible, headless UI components** that confo...

## Concepts

*Concept pages explain ideas, patterns, and principles*

- [[Deferred Content Lazy Rendering]] — Deferred Content Lazy Rendering is a pattern used in `@angular/aria` to avoid rendering hidden panel and popup conten...
- [[Headless ARIA Directives]] — Headless ARIA directives are Angular directives that implement **accessibility behavior without providing any visual ...
- [[Signal-Native Component Inputs]] — Signal-Native Component Inputs is an architectural pattern where a component or class accepts **all inputs as signals...
- [[UI Pattern Behavior Composition]] — UI Pattern Behavior Composition is the internal architecture used by `@angular/aria` to build accessible UI component...

## Recent Sources

*Source summaries distill key information from raw documents*

- [[Angular Aria Big Picture Research — 2026-05-30]] — - **Author:** Kiro Research Session (`angular-aria-big-picture`)

## Navigation

- [Activity Log](activity-log.md) - Chronological record of wiki changes
- [All Entities](entities/) - Browse all entity pages
- [All Concepts](concepts/) - Browse all concept pages
- [All Sources](sources/) - Browse all source summaries
- [Schema Configuration](../WIKI_SCHEMA.md) - Wiki structure and conventions

## Statistics

- **Total Pages**: 6 (1 entity, 4 concepts, 1 source)
- **Last Updated**: 2026-05-30
- **Wiki Health**: ✅

## Quick Reference

**Search by Tag:**
- `#angular` - Angular-related content
- `#accessibility` - Accessibility topics
- `#aria` - ARIA specifications and patterns

**Common Workflows:**
- Ingestion: `raw/` → wiki pages → index update → activity log → git commit
- Query: search → results → cross-references → context
- Maintenance: validate links → detect duplicates → consolidate → report
