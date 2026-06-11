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
: 
*Entity pages describe specific things: libraries, tools, components, APIs*

- [[Angular Aria]] — `@angular/aria` is Angular's first-party library for building **fully accessible, headless UI components** that confo...
- [[Architecture]] — Software architecture encompasses the patterns, principles, and approaches for organizing code and systems. Architect...
- [[Domain Driven Design]] — Domain Driven Design (DDD) is an architectural methodology that organizes code around business domains rather than te...
- [[Hexagonal Architecture]] — Hexagonal Architecture (also known as the **Ports and Adapters Pattern**) is an architectural pattern created by Dr. ...
- [[Nx]] — Nx is a build system and monorepo management tool that provides specialized tooling for organizing and maintaining wo...
- [[Nx Enterprise]] — Nx Enterprise is an enterprise support program offered by the Nx team for companies implementing monorepo architectur...

## Concepts

*Concept pages explain ideas, patterns, and principles*

- [[Adapters]] — In Hexagonal Architecture, **adapters** are software components that allow specific technologies to interact with the...
- [[Application Boundary]] — The **Application Boundary** is the clear line separating an application's business logic from the external world. In...
- [[Composition Root]] — The **Composition Root** (also called the **Main Component** by Robert C. Martin in "Clean Architecture") is the star...
- [[Deferred Content Lazy Rendering]] — Deferred Content Lazy Rendering is a pattern used in `@angular/aria` to avoid rendering hidden panel and popup conten...
- [[Dump Projects]] — Dump projects are an anti-pattern where code accumulates in projects with vague names (like `util` or `components`) w...
- [[Headless ARIA Directives]] — Headless ARIA directives are Angular directives that implement **accessibility behavior without providing any visual ...
- [[Hexagonal Architecture]] — Hexagonal Architecture (also known as Ports and Adapters) is an architectural pattern that organizes code around the ...
- [[Module Boundary Rules]] — Module boundary rules define which Project Types can depend on which other types, maintaining separation of concerns ...
- [[Modulith Architecture]] — Modulith architecture is a pattern that sits between monolith and microservices architectures. It maintains a single ...
- [[Ports]] — In Hexagonal Architecture, **ports** are interfaces that define the application boundary. They specify how the applic...
- [[Project Types]] — Project types provide a taxonomy for categorizing code modules in Nx workspaces. By having a limited set of well-defi...
- [[Scope-Type-Identifier Naming]] — Scope-Type-Identifier is a naming convention pattern that combines scope, type, and identifier to create self-documen...
- [[Signal-Native Component Inputs]] — Signal-Native Component Inputs is an architectural pattern where a component or class accepts **all inputs as signals...
- [[Tag-Based Enforcement]] — Tag-based enforcement uses minimal tags (scope and type) on projects to automatically enforce Module Boundary Rules a...
- [[Technology Agnostic Design]] — **Technology Agnostic Design** is the architectural principle of designing software systems so that business logic ha...
- [[Testing in Isolation]] — **Testing in Isolation** is the practice of testing an application's business logic without connecting to real extern...
- [[UI Pattern Behavior Composition]] — UI Pattern Behavior Composition is the internal architecture used by `@angular/aria` to build accessible UI component...
- [[Virtuous Cycle]] — The virtuous cycle (or positive feedback loop) describes how good workspace structure becomes self-reinforcing. When ...
- [[Workspace Structure Goals]] — Workspace structure should be designed to meet organizational goals rather than being figured out ad-hoc. These goals...

## Recent Sources

*Source summaries distill key information from raw documents*

- [[Angular Aria Big Picture Research — 2026-05-30]] — - **Author:** Kiro Research Session (`angular-aria-big-picture`)
- [["The virtuous cycle of workspace structure"]] — - **Author:** Philip Fulcher
- [[Hexagonal Architecture Article — 2018-08-29]] — - **Author**: Juan Manuel Garrido de Paz

## Navigation

- [Activity Log](activity-log.md) - Chronological record of wiki changes
- [All Entities](entities/) - Browse all entity pages
- [All Concepts](concepts/) - Browse all concept pages
- [All Sources](sources/) - Browse all source summaries
- [Schema Configuration](../WIKI_SCHEMA.md) - Wiki structure and conventions

## Statistics

- **Total Pages**: 28 (6 entities, 19 concepts, 3 sources)
- **Last Updated**: 2026-06-10
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
