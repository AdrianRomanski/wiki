# Wiki Examples Initialization Scripts

## Purpose

This library provides a set of initialization scripts that populate a demo wiki graph with sample entities, concepts, and source pages. These scripts generate realistic, interconnected wiki content for demonstration purposes, showcasing the full capabilities of the wiki system including entity relationships, concept connections, and cross-domain knowledge organization. The generated content includes frontend/backend/testing libraries, blog and documentation articles, and concepts with varying relationship strengths.

## Available Scripts

### Library Entity Scripts

#### `npm run init:frontend-libs`
Generates 3 frontend library entity pages (React, Vue, Svelte) with component-based architecture properties, UI framework characteristics, and relationships to web development concepts.

#### `npm run init:backend-libs`
Generates 3 backend library entity pages (NestJS, Express, Fastify) with server framework properties, runtime environment specifications, and relationships to backend architecture concepts.

#### `npm run init:testing-libs`
Generates 3 testing library entity pages (Vitest, Jest, Playwright) with test runner capabilities, assertion styles, and relationships to testing methodology concepts.

### Article Source Scripts

#### `npm run init:articles-blog`
Generates 3 blog article source pages with author attribution and publication dates, demonstrating how to document and cite external blog content in the wiki.

#### `npm run init:articles-docs`
Generates 3 documentation article source pages with URLs and metadata, showing how to reference official documentation and technical guides.

### Concept Relationship Scripts

#### `npm run init:close-concepts`
Generates 4 concept pages within the same domain (Web Accessibility) with strong interconnections, demonstrating how closely related concepts reference each other through WikiLinks.

#### `npm run init:far-concepts`
Generates 4 concept pages from different domains with cross-domain connections, showcasing unexpected relationships between concepts from separate knowledge areas.

### Cross-Domain Script

#### `npm run init:cross-domain`
Generates entities and concepts spanning 3 distinct domains (web development, data science, infrastructure), demonstrating how the wiki graph handles heterogeneous knowledge with cross-domain references.

### Utility Scripts

#### `npm run init:all`
Runs all 8 initialization scripts sequentially, populating the complete demo wiki graph. Stops execution if any individual script fails.

#### `npm run init:clean`
Removes all generated markdown files from `wiki/entities/`, `wiki/concepts/`, and `wiki/sources/` directories, providing a clean slate for regeneration.

## Quick Start

Follow these steps to populate your demo wiki graph:

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build Required Libraries**
   ```bash
   npx nx build core
   ```

3. **Create Wiki Directory Structure**
   ```bash
   mkdir -p wiki/entities wiki/concepts wiki/sources
   ```

4. **Run Generation Scripts**
   ```bash
   # Generate all content at once
   npm run init:all
   
   # Or run individual scripts
   npm run init:frontend-libs
   npm run init:backend-libs
   # ... etc
   ```

5. **Verify Generated Content**
   ```bash
   ls wiki/entities/
   ls wiki/concepts/
   ls wiki/sources/
   ```

## Generated Content Overview

### Library Entity Scripts

**`init:frontend-libs`**
- **Type**: Entity pages
- **Examples**: `react.md`, `vue.md`, `svelte.md`

**`init:backend-libs`**
- **Type**: Entity pages
- **Examples**: `nestjs.md`, `express.md`, `fastify.md`

**`init:testing-libs`**
- **Type**: Entity pages
- **Examples**: `vitest.md`, `jest.md`, `playwright.md`

### Article Source Scripts

**`init:articles-blog`**
- **Type**: Source pages
- **Examples**: `building-accessible-components-2024-03-15.md`, `state-management-patterns-2024-05-20.md`

**`init:articles-docs`**
- **Type**: Source pages
- **Examples**: `angular-material-grid-list-guide-2024-01-10.md`, `nestjs-microservices-documentation-2024-02-15.md`

### Concept Relationship Scripts

**`init:close-concepts`**
- **Type**: Concept pages (same domain)
- **Examples**: `focus-management.md`, `keyboard-navigation.md`, `aria-attributes.md`, `screen-reader-support.md`

**`init:far-concepts`**
- **Type**: Concept pages (cross-domain)
- **Examples**: `dependency-injection.md`, `test-driven-development.md`, `reactive-programming.md`, `component-architecture.md`

### Cross-Domain Script

**`init:cross-domain`**
- **Type**: Mixed entities and concepts across 3 domains
- **Examples**: 2 entities + 2 concepts per domain for web development, data science, and infrastructure
