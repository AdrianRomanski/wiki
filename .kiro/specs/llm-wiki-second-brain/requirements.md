# Requirements Document

## Introduction

This document specifies requirements for transforming the Angular Aria research repository into an LLM-powered second brain knowledge management system based on Andrej Karpathy's LLM Wiki pattern. The system will maintain a git-versioned, AI-curated knowledge base that compounds research findings over time, enabling efficient knowledge retrieval and cross-referencing while preserving the existing Angular research project structure.

## Glossary

- **Second_Brain**: A knowledge management system that captures, organizes, and surfaces accumulated learning
- **LLM_Wiki**: An AI-maintained knowledge base following Karpathy's pattern where AI compiles raw sources into structured, cross-referenced wiki pages
- **Raw_Source**: Immutable input documents (PDFs, articles, code snippets, research notes) stored in raw/ directory
- **Wiki_Page**: AI-generated markdown document in wiki/ directory with structured content and cross-references
- **Schema_Config**: Configuration file (CLAUDE.md or similar) defining wiki structure, workflows, and AI instructions
- **Entity_Page**: Wiki page describing a specific thing (person, library, tool, component)
- **Concept_Page**: Wiki page explaining an idea, pattern, or principle
- **Source_Summary**: Wiki page summarizing a raw source document
- **Index_Page**: Top-level wiki page (index.md) providing navigation and overview
- **Activity_Log**: Chronological record of wiki updates and ingestion events
- **Cross_Reference**: Link between related wiki pages using [[WikiLink]] syntax
- **Contradiction_Detection**: Process of identifying conflicting information across wiki pages
- **Wiki_Maintenance**: Periodic AI-driven review to update, consolidate, and lint wiki content
- **Ingestion_Workflow**: Process of converting raw sources into wiki pages
- **Query_Workflow**: Process of searching and retrieving information from the wiki
- **Angular_Project**: The existing Angular Aria research monorepo structure

## Requirements

### Requirement 1: Directory Structure

**User Story:** As a developer, I want a clear separation between raw sources and AI-generated wiki content, so that I can distinguish immutable inputs from curated knowledge.

#### Acceptance Criteria

1. THE System SHALL create a raw/ directory at repository root for storing immutable source documents
2. THE System SHALL create a wiki/ directory at repository root for storing AI-generated markdown pages
3. THE System SHALL create a Schema_Config file defining wiki structure and AI workflows
4. THE System SHALL preserve the existing Angular_Project structure (apps/, libs/, .kiro/)
5. THE System SHALL support subdirectories within raw/ for organizing sources by category

### Requirement 2: Schema Configuration

**User Story:** As a knowledge curator, I want a schema configuration that defines wiki structure and workflows, so that AI agents understand how to maintain the knowledge base.

#### Acceptance Criteria

1. THE Schema_Config SHALL define the wiki directory structure and page types
2. THE Schema_Config SHALL specify ingestion workflow instructions for AI agents
3. THE Schema_Config SHALL specify query workflow instructions for AI agents
4. THE Schema_Config SHALL specify maintenance workflow instructions for AI agents
5. THE Schema_Config SHALL define cross-referencing conventions using [[WikiLink]] syntax
6. THE Schema_Config SHALL define naming conventions for Entity_Page, Concept_Page, and Source_Summary files

### Requirement 3: Raw Source Ingestion

**User Story:** As a researcher, I want to ingest various document types into the raw/ directory, so that AI can process them into structured wiki pages.

#### Acceptance Criteria

1. WHEN a document is added to raw/, THE System SHALL support markdown files
2. WHEN a document is added to raw/, THE System SHALL support PDF files
3. WHEN a document is added to raw/, THE System SHALL support plain text files
4. WHEN a document is added to raw/, THE System SHALL support code snippets with language annotations
5. WHEN a document is added to raw/, THE System SHALL preserve the original file without modification

### Requirement 4: Wiki Page Generation

**User Story:** As a knowledge curator, I want AI to generate structured wiki pages from raw sources, so that information is organized and cross-referenced.

#### Acceptance Criteria

1. WHEN ingesting a Raw_Source, THE System SHALL generate at least one Wiki_Page in wiki/ directory
2. THE Wiki_Page SHALL include a frontmatter section with metadata (title, tags, source references, date)
3. THE Wiki_Page SHALL include structured content sections appropriate to page type
4. THE Wiki_Page SHALL include Cross_Reference links to related wiki pages using [[WikiLink]] syntax
5. WHEN generating an Entity_Page, THE System SHALL include sections for definition, properties, relationships, and examples
6. WHEN generating a Concept_Page, THE System SHALL include sections for explanation, applications, related concepts, and examples
7. WHEN generating a Source_Summary, THE System SHALL include sections for key points, insights, and source metadata

### Requirement 5: Index and Navigation

**User Story:** As a user, I want a top-level index page, so that I can navigate the wiki and understand its structure.

#### Acceptance Criteria

1. THE System SHALL maintain an Index_Page at wiki/index.md
2. THE Index_Page SHALL list all Entity_Page entries with brief descriptions
3. THE Index_Page SHALL list all Concept_Page entries with brief descriptions
4. THE Index_Page SHALL list recent Source_Summary entries
5. THE Index_Page SHALL include navigation links to major wiki sections
6. WHEN a new Wiki_Page is created, THE System SHALL update the Index_Page

### Requirement 6: Cross-Referencing

**User Story:** As a knowledge worker, I want automatic cross-referencing between related wiki pages, so that I can discover connections and navigate related content.

#### Acceptance Criteria

1. THE System SHALL use [[WikiLink]] syntax for Cross_Reference links
2. WHEN creating a Wiki_Page, THE System SHALL identify related existing pages
3. WHEN creating a Wiki_Page, THE System SHALL add Cross_Reference links to related pages
4. THE System SHALL support bidirectional linking between wiki pages
5. WHEN a Wiki_Page references an entity or concept, THE System SHALL create a Cross_Reference if the target page exists

### Requirement 7: Activity Log

**User Story:** As a knowledge curator, I want a chronological activity log, so that I can track wiki evolution and recent changes.

#### Acceptance Criteria

1. THE System SHALL maintain an Activity_Log at wiki/activity-log.md
2. WHEN a Raw_Source is ingested, THE Activity_Log SHALL record the event with timestamp and source name
3. WHEN a Wiki_Page is created, THE Activity_Log SHALL record the event with timestamp and page name
4. WHEN a Wiki_Page is updated, THE Activity_Log SHALL record the event with timestamp and change summary
5. THE Activity_Log SHALL display entries in reverse chronological order (newest first)

### Requirement 8: Query Workflow

**User Story:** As a researcher, I want to query the wiki for specific information, so that I can retrieve accumulated knowledge efficiently.

#### Acceptance Criteria

1. THE System SHALL support full-text search across all Wiki_Page content
2. THE System SHALL support searching by tags defined in Wiki_Page frontmatter
3. THE System SHALL support searching by entity or concept name
4. WHEN a query matches multiple pages, THE System SHALL rank results by relevance
5. THE System SHALL return Cross_Reference links in query results for context

### Requirement 9: Wiki Maintenance and Linting

**User Story:** As a knowledge curator, I want periodic AI-driven maintenance, so that the wiki remains accurate, consolidated, and free of contradictions.

#### Acceptance Criteria

1. THE System SHALL support a maintenance workflow that reviews all Wiki_Page content
2. WHEN running maintenance, THE System SHALL detect duplicate or overlapping content
3. WHEN running maintenance, THE System SHALL perform Contradiction_Detection across pages
4. WHEN contradictions are detected, THE System SHALL flag them in a maintenance report
5. WHEN running maintenance, THE System SHALL suggest consolidation opportunities for related pages
6. WHEN running maintenance, THE System SHALL validate that all Cross_Reference links point to existing pages

### Requirement 10: Git Version Control Integration

**User Story:** As a developer, I want all wiki changes tracked in git, so that I can review history, revert changes, and collaborate with others.

#### Acceptance Criteria

1. THE System SHALL store all Wiki_Page files as plain markdown in the git repository
2. THE System SHALL store all Raw_Source files in the git repository
3. THE System SHALL generate meaningful commit messages when wiki content changes
4. WHEN a Wiki_Page is created or updated, THE System SHALL create a git commit
5. THE System SHALL support viewing wiki history through git log and diff commands

### Requirement 11: Angular Project Coexistence

**User Story:** As a developer, I want the LLM wiki to coexist with the Angular research project, so that I can maintain both codebases without conflicts.

#### Acceptance Criteria

1. THE System SHALL NOT modify existing Angular_Project files in apps/ or libs/
2. THE System SHALL NOT modify existing .kiro/ configuration files
3. THE System SHALL allow ingesting Angular code learnings as Raw_Source documents
4. THE System SHALL support Wiki_Page entries about Angular Aria patterns discovered during research
5. THE System SHALL maintain separate documentation for wiki usage vs Angular project usage

### Requirement 12: Research Findings Integration

**User Story:** As a researcher, I want to capture Angular Aria research findings in the wiki, so that accumulated knowledge is preserved and searchable.

#### Acceptance Criteria

1. WHEN discovering an Angular Aria pattern, THE System SHALL support creating a Concept_Page
2. WHEN learning about an Angular Aria API, THE System SHALL support creating an Entity_Page
3. WHEN completing a research session, THE System SHALL support creating a Source_Summary
4. THE System SHALL support ingesting code examples from the Angular_Project as Raw_Source
5. THE System SHALL Cross_Reference wiki pages about accessibility patterns with related Angular components

### Requirement 13: Obsidian Compatibility

**User Story:** As a knowledge worker, I want to view the wiki in Obsidian, so that I can leverage its graph view and linking features.

#### Acceptance Criteria

1. THE Wiki_Page files SHALL use standard markdown syntax compatible with Obsidian
2. THE Cross_Reference links SHALL use [[WikiLink]] syntax supported by Obsidian
3. THE Wiki_Page frontmatter SHALL use YAML format compatible with Obsidian
4. THE System SHALL organize wiki/ directory structure for optimal Obsidian navigation
5. THE System SHALL support Obsidian tags using #tag syntax in addition to frontmatter tags

### Requirement 14: Search at Scale Support

**User Story:** As a power user, I want the wiki structure to support search tools like qmd, so that I can perform fast searches as the knowledge base grows.

#### Acceptance Criteria

1. THE Wiki_Page files SHALL use consistent markdown structure for reliable parsing
2. THE System SHALL maintain a flat or shallow wiki/ directory structure for efficient indexing
3. THE System SHALL use consistent naming conventions for Wiki_Page files
4. THE System SHALL avoid deeply nested subdirectories that complicate search indexing
5. THE System SHALL support external search tools accessing wiki/ directory directly

### Requirement 15: Initial Wiki Bootstrap

**User Story:** As a new user, I want an initial wiki structure with example pages, so that I understand the system and can start adding content immediately.

#### Acceptance Criteria

1. WHEN initializing the Second_Brain, THE System SHALL create the Index_Page with usage instructions
2. WHEN initializing the Second_Brain, THE System SHALL create an Activity_Log with the initialization event
3. WHEN initializing the Second_Brain, THE System SHALL create example Entity_Page, Concept_Page, and Source_Summary
4. WHEN initializing the Second_Brain, THE System SHALL create a README in raw/ explaining source organization
5. WHEN initializing the Second_Brain, THE System SHALL create a README in wiki/ explaining wiki structure and workflows
