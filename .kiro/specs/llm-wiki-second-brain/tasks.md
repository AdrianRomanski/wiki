# Implementation Plan: LLM Wiki Second Brain

## Overview

This implementation plan transforms the Angular Aria research repository into an LLM-powered second brain knowledge management system. The system maintains a git-versioned, AI-curated knowledge base with immutable raw sources in `raw/` and AI-generated wiki pages in `wiki/`. Implementation follows a phased approach starting with bootstrap and directory structure, then building core utilities, wiki generation, search, maintenance, and git integration. All code will be written in TypeScript with Node.js for file system operations.

## Tasks

- [x] 1. Bootstrap directory structure and schema configuration
  - [x] 1.1 Create directory structure and initialization script
    - Create `raw/` directory with subdirectories (articles/, papers/, code-snippets/, notes/, angular-aria/)
    - Create `wiki/` directory with subdirectories (entities/, concepts/, sources/)
    - Create initialization script that checks for existing Angular project and preserves it
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 1.2 Create schema configuration file (WIKI_SCHEMA.md)
    - Define wiki directory structure and page types
    - Specify ingestion, query, and maintenance workflow instructions
    - Define cross-referencing conventions using [[WikiLink]] syntax
    - Define naming conventions for entity, concept, and source summary files
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.3 Create initial wiki pages (index, activity log, examples)
    - Create `wiki/index.md` with navigation structure
    - Create `wiki/activity-log.md` with initialization entry
    - Create example entity page in `wiki/entities/`
    - Create example concept page in `wiki/concepts/`
    - Create example source summary in `wiki/sources/`
    - _Requirements: 5.1, 7.1, 15.1, 15.2, 15.3_

  - [x] 1.4 Create README files for raw/ and wiki/ directories
    - Create `raw/README.md` explaining source organization
    - Create `wiki/README.md` explaining wiki structure and workflows
    - _Requirements: 15.4, 15.5_

  - [ ]* 1.5 Write smoke tests for initialization
    - Test directory structure creation
    - Test schema config file creation
    - Test example pages creation
    - Test Angular project preservation
    - _Requirements: 1.4, 15.1, 15.2, 15.3_

- [ ] 2. Implement core data models and utilities
  - [x] 2.1 Create TypeScript data models
    - Implement `WikiPage` interface with frontmatter, content, and cross-references
    - Implement `RawSource` interface with path, format, and metadata
    - Implement `ActivityLogEntry` interface with timestamp and operation details
    - Implement `MaintenanceReport` interface with findings and recommendations
    - _Requirements: 4.2, 3.1, 7.2_

  - [x] 2.2 Implement frontmatter parser and generator
    - Parse YAML frontmatter from markdown files using gray-matter
    - Generate valid YAML frontmatter for wiki pages
    - Validate required frontmatter fields (title, type, tags, created, updated)
    - Support Obsidian-compatible YAML format
    - _Requirements: 4.2, 13.3_

  - [ ]* 2.3 Write property test for frontmatter validity
    - **Property 17: YAML Frontmatter Validity**
    - **Validates: Requirements 13.3**

  - [x] 2.4 Implement markdown utilities
    - Parse markdown content into sections
    - Extract [[WikiLink]] references from content
    - Generate markdown with proper formatting
    - Support standard markdown syntax compatible with Obsidian
    - _Requirements: 6.1, 13.1_

  - [ ]* 2.5 Write property test for markdown compatibility
    - **Property 16: Markdown Compatibility**
    - **Validates: Requirements 13.1**

  - [x] 2.6 Implement file system utilities
    - Read files from raw/ and wiki/ directories
    - Write files to wiki/ directory with atomic operations
    - List files matching patterns using glob
    - Validate file paths to prevent directory traversal
    - _Requirements: 1.1, 1.2, 3.5_

  - [ ]* 2.7 Write property test for raw source immutability
    - **Property 1: Raw Source Immutability**
    - **Validates: Requirements 3.5**

  - [x] 2.8 Implement naming convention validators
    - Validate entity page names (kebab-case-noun.md)
    - Validate concept page names (kebab-case-concept.md)
    - Validate source summary names (source-title-yyyy-mm-dd.md)
    - _Requirements: 2.6, 14.3_

  - [ ]* 2.9 Write property test for naming convention consistency
    - **Property 19: Naming Convention Consistency**
    - **Validates: Requirements 14.3**

- [x] 3. Checkpoint - Verify core utilities
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement wiki page generation
  - [x] 4.1 Create wiki page generator for entity pages
    - Generate entity page with definition, properties, relationships, examples sections
    - Generate valid frontmatter with type='entity'
    - Apply entity naming convention
    - _Requirements: 4.5_

  - [x] 4.2 Create wiki page generator for concept pages
    - Generate concept page with explanation, applications, related concepts, examples sections
    - Generate valid frontmatter with type='concept'
    - Apply concept naming convention
    - _Requirements: 4.6_

  - [x] 4.3 Create wiki page generator for source summaries
    - Generate source summary with key points, insights, source metadata sections
    - Generate valid frontmatter with type='source' and source metadata
    - Apply source summary naming convention
    - _Requirements: 4.7_

  - [ ]* 4.4 Write property test for wiki page structure completeness
    - **Property 3: Wiki Page Structure Completeness**
    - **Validates: Requirements 4.2, 4.5, 4.6, 4.7**

  - [x] 4.4 Implement cross-reference detection and linking
    - Parse content to identify entity and concept mentions
    - Generate [[WikiLink]] syntax for cross-references
    - Validate that link targets exist
    - Support bidirectional linking
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 4.5 Write property test for WikiLink syntax consistency
    - **Property 6: WikiLink Syntax Consistency**
    - **Validates: Requirements 6.1, 13.2**

  - [ ]* 4.6 Write property test for bidirectional linking
    - **Property 7: Bidirectional Linking**
    - **Validates: Requirements 6.4**

- [x] 5. Implement index and activity log management
  - [x] 5.1 Create index page manager
    - Add entity entries to index with descriptions
    - Add concept entries to index with descriptions
    - Add recent source summaries to index
    - Maintain navigation links to major sections
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.2 Write property test for index completeness
    - **Property 4: Index Completeness**
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [x] 5.3 Implement automatic index updates
    - Update index when new wiki page is created
    - Update index when wiki page is deleted
    - Regenerate index on demand
    - _Requirements: 5.6_

  - [ ]* 5.4 Write property test for index synchronization
    - **Property 5: Index Synchronization**
    - **Validates: Requirements 5.6**

  - [x] 5.5 Create activity log manager
    - Record ingestion events with timestamp and source name
    - Record wiki page creation with timestamp and page name
    - Record wiki page updates with timestamp and change summary
    - Maintain reverse chronological order (newest first)
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [ ]* 5.6 Write property test for activity log completeness
    - **Property 8: Activity Log Completeness**
    - **Validates: Requirements 7.2, 7.3, 7.4**

  - [ ]* 5.7 Write property test for activity log ordering
    - **Property 9: Activity Log Ordering**
    - **Validates: Requirements 7.5**

- [x] 6. Checkpoint - Verify wiki generation and logging
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement ingestion workflow
  - [x] 7.1 Create raw source ingestion handler
    - Support markdown, PDF, text, and code file formats
    - Preserve original files without modification
    - Extract metadata from raw sources
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 7.2 Implement wiki page generation from raw sources
    - Analyze raw source content to determine page type(s)
    - Generate at least one wiki page per raw source
    - Add cross-references to related existing pages
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ]* 7.3 Write property test for ingestion produces wiki pages
    - **Property 2: Ingestion Produces Wiki Pages**
    - **Validates: Requirements 4.1**

  - [x] 7.4 Wire ingestion workflow components together
    - Connect raw source handler to wiki page generator
    - Update index page after wiki page creation
    - Record activity log entry after ingestion
    - _Requirements: 4.1, 5.6, 7.2_

- [x] 8. Implement query and search functionality
  - [x] 8.1 Create full-text search engine
    - Index all wiki page content
    - Support search queries across content
    - Rank results by relevance
    - _Requirements: 8.1, 8.4_

  - [x] 8.2 Implement tag-based and name-based search
    - Search by tags from frontmatter
    - Search by entity or concept name
    - Support #tag syntax in addition to frontmatter tags
    - _Requirements: 8.2, 8.3, 13.5_

  - [ ]* 8.3 Write property test for search result accuracy
    - **Property 10: Search Result Accuracy**
    - **Validates: Requirements 8.2, 8.3**

  - [ ]* 8.4 Write property test for tag syntax support
    - **Property 18: Tag Syntax Support**
    - **Validates: Requirements 13.5**

  - [x] 8.5 Add cross-reference context to search results
    - Include related pages in search results
    - Show backlinks for context
    - _Requirements: 8.5_

  - [ ]* 8.6 Write property test for search result context
    - **Property 11: Search Result Context**
    - **Validates: Requirements 8.5**

- [x] 9. Implement maintenance workflow
  - [x] 9.1 Create link validation engine
    - Extract all [[WikiLink]] references from wiki pages
    - Validate that link targets exist
    - Flag broken links in maintenance report
    - _Requirements: 9.6_

  - [ ]* 9.2 Write property test for link validation completeness
    - **Property 13: Link Validation Completeness**
    - **Validates: Requirements 9.6**

  - [x] 9.3 Implement duplicate and contradiction detection
    - Detect overlapping content across pages
    - Identify contradictory information
    - Flag contradictions in maintenance report
    - _Requirements: 9.2, 9.3, 9.4_

  - [ ]* 9.4 Write property test for maintenance report completeness
    - **Property 12: Maintenance Report Completeness**
    - **Validates: Requirements 9.4**

  - [x] 9.5 Implement consolidation suggestions
    - Identify related pages that could be merged
    - Detect orphaned pages with no incoming links
    - Generate consolidation recommendations
    - _Requirements: 9.5_

  - [x] 9.6 Create maintenance report generator
    - Compile all maintenance findings
    - Generate structured report with recommendations
    - Include health score and summary statistics
    - _Requirements: 9.1, 9.4_

- [x] 10. Checkpoint - Verify search and maintenance
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Implement git integration
  - [x] 11.1 Create git commit automation
    - Generate meaningful commit messages for wiki changes
    - Create commits when wiki pages are created or updated
    - Batch related changes into single commits
    - _Requirements: 10.3, 10.4_

  - [ ]* 11.2 Write property test for git commit synchronization
    - **Property 15: Git Commit Synchronization**
    - **Validates: Requirements 10.4**

  - [x] 11.3 Implement git storage verification
    - Verify wiki pages stored as plain markdown files
    - Verify raw sources stored in original format
    - Support git history viewing (log, diff)
    - _Requirements: 10.1, 10.2, 10.5_

  - [ ]* 11.4 Write property test for git storage consistency
    - **Property 14: Git Storage Consistency**
    - **Validates: Requirements 10.1, 10.2**

- [x] 12. Verify external tool compatibility
  - [x] 12.1 Test Obsidian compatibility
    - Verify [[WikiLink]] syntax works in Obsidian
    - Verify YAML frontmatter is recognized
    - Verify directory structure is navigable
    - Test graph view with cross-references
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 12.2 Test qmd search tool compatibility
    - Verify wiki/ directory structure supports indexing
    - Test search performance with qmd
    - Verify consistent markdown structure
    - Document any compatibility issues
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [x] 12.3 Verify Angular project coexistence
    - Confirm no modifications to apps/ or libs/ directories
    - Confirm no modifications to existing .kiro/ files
    - Test ingesting Angular code as raw sources
    - Create wiki pages about Angular Aria patterns
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 13. Integration testing and end-to-end workflows
  - [ ]* 13.1 Write integration tests for complete ingestion workflow
    - Test: add raw source → generate wiki page → update index → record log → commit to git
    - Verify all components work together
    - _Requirements: 3.1, 4.1, 5.6, 7.2, 10.4_

  - [ ]* 13.2 Write integration tests for query workflow
    - Test: search by tag → retrieve results → include cross-references
    - Test: search by name → rank results → return context
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 13.3 Write integration tests for maintenance workflow
    - Test: validate links → detect duplicates → detect contradictions → generate report
    - Verify maintenance report includes all findings
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ]* 13.4 Write integration tests for Angular Aria research integration
    - Test: ingest Angular code snippet → generate entity page → cross-reference with concepts
    - Test: create concept page about accessibility pattern → link to Angular components
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 14. Final checkpoint and documentation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties with 100+ iterations each
- Unit tests validate specific examples and edge cases
- Integration tests validate complete workflows end-to-end
- All code will be written in TypeScript with Node.js for file system operations
- The system coexists with the existing Angular project without modifications
