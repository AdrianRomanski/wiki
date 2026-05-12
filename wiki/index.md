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

- [[Angular Material]] — Angular Material is the official Material Design component library for Angular. It provides 35 UI component modules —...

## Concepts

*Concept pages explain ideas, patterns, and principles*

- [[Custom Form Field Control]] — `MatFormFieldControl<T>` is an abstract class from `@angular/material/form-field` that lets you integrate any custom ...
- [[Injection Token Configuration]] — Angular Material exposes an `InjectionToken` for every configurable default across its components. Rather than subcla...
- [[Mat Table DataSource]] — `MatTable` is a layout primitive — it renders rows and columns but has no built-in sorting, pagination, or filtering....
- [[Material Testing Harnesses]] — Every Angular Material component ships a `/testing` entry point that exports a `ComponentHarness` subclass. Harnesses...
- [[Per-Module Imports]] — Angular Material ships a root barrel entry (`@angular/material`) that re-exports every component module. Importing fr...

## Recent Sources

*Source summaries distill key information from raw documents*

- [[Angular Material Big Picture Research — 2026-05-11]] — - **Library**: `@angular/material`

## Navigation

- [Activity Log](activity-log.md) - Chronological record of wiki changes
- [All Entities](entities/) - Browse all entity pages
- [All Concepts](concepts/) - Browse all concept pages
- [All Sources](sources/) - Browse all source summaries
- [Schema Configuration](../WIKI_SCHEMA.md) - Wiki structure and conventions

## Statistics

- **Total Pages**: 7 (1 entity, 5 concepts, 1 source)
- **Last Updated**: 2026-05-12
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
