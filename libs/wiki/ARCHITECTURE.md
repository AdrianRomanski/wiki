# Wiki System Architecture

## Overview

The Wiki System is organized as a collection of Nx libraries following clean architecture principles. The architecture separates concerns into four distinct layers with strict dependency rules that ensure business logic remains independent of technical implementation details.

This modular structure enables:
- **Maintainability**: Clear separation of concerns makes code easier to understand and modify
- **Testability**: Each layer can be tested independently with appropriate testing strategies
- **Flexibility**: Infrastructure implementations can be swapped without affecting business logic
- **Scalability**: New features can be added by extending existing layers without cascading changes

The system manages AI-generated knowledge base pages with functionality for page generation, cross-referencing, activity logging, maintenance, and querying.

## Hexagonal Architecture View

The Wiki System follows the hexagonal architecture pattern (also known as Ports and Adapters), where the core business logic (Domain Layer) is at the center, surrounded by Application Layer use cases, with Infrastructure adapters on the outside. The Presentation Layer provides a unified API facade.

```
                    ┌─────────────────────────────────────┐
                    │     Presentation Layer (@wiki/core) │
                    │         Public API Facade           │
                    └──────────────┬──────────────────────┘
                                   │
                                   ▼
        ┌──────────────────────────────────────────────────────────┐
        │                  Application Layer                       │
        │  ┌────────────────────────────────────────────────────┐  │
        │  │              Port Interfaces                       │  │
        │  │  FileSystemPort  MarkdownPort  FrontmatterPort     │  │
        │  └────────────────────────────────────────────────────┘  │
        │                                                          │
        │  ┌────────────────────────────────────────────────────┐  │
        │  │            Use Case Services                       │  │
        │  │  Generators  CrossReference  Query  Maintenance    │  │
        │  │  ActivityLog  IndexManager  Workflow  ADR          │  │
        │  └────────────────────────────────────────────────────┘  │
        └───────────────────────┬──────────────────────────────────┘
                                │
                                ▼
                ┌───────────────────────────────────┐
                │        Domain Layer (Core)        │
                │  ┌─────────────────────────────┐  │
                │  │     Domain Entities         │  │
                │  │  WikiPage  RawSource        │  │
                │  │  ActivityLogEntry           │  │
                │  │  MaintenanceReport          │  │
                │  └─────────────────────────────┘  │
                │  ┌─────────────────────────────┐  │
                │  │     Value Objects           │  │
                │  │  WikiPageFrontmatter        │  │
                │  │  Section  ValidationResult  │  │
                │  └─────────────────────────────┘  │
                │  ┌─────────────────────────────┐  │
                │  │   Domain Services           │  │
                │  │  Naming  Validation         │  │
                │  └─────────────────────────────┘  │
                └───────────────────────────────────┘
                                ▲
                                │
        ┌───────────────────────┴──────────────────────────────────┐
        │              Infrastructure Layer (Adapters)             │
        │  ┌────────────────────────────────────────────────────┐  │
        │  │         Adapter Implementations                    │  │
        │  │  FileSystemAdapter → FileSystemPort                │  │
        │  │  MarkdownAdapter → MarkdownPort                    │  │
        │  │  FrontmatterAdapter → FrontmatterPort              │  │
        │  └────────────────────────────────────────────────────┘  │
        │                                                          │
        │  ┌────────────────────────────────────────────────────┐  │
        │  │         External Dependencies                      │  │
        │  │  Node.js fs/promises  gray-matter  glob            │  │
        │  └────────────────────────────────────────────────────┘  │
        └──────────────────────────────────────────────────────────┘
```

**Key Principles:**
- **Dependencies point inward**: Infrastructure and Application depend on Domain, never the reverse
- **Port interfaces insulate the core**: Application Layer defines contracts, Infrastructure implements them
- **Business logic is pure**: Domain Layer has zero external dependencies
- **Adapters are replaceable**: Infrastructure implementations can be swapped without affecting business logic

## Architectural Layers

### Domain Layer

**Purpose**: The Domain Layer contains pure business logic and domain models with no dependencies on external frameworks or infrastructure.

**Responsibilities**:
- Define domain entities representing core business concepts (WikiPage, RawSource, ActivityLogEntry, MaintenanceReport, Section)
- Define value objects for structured data (WikiPageFrontmatter, ValidationResult, CrossReference)
- Implement domain validation rules and business constraints
- Provide domain services for business rule enforcement
- Ensure data integrity through invariants and validation

**Dependency Rules**:
- MUST NOT depend on any other architectural layer
- MUST NOT import from infrastructure or framework-specific packages
- MAY only use TypeScript standard library

**Libraries**:
- **@wiki/domain-models**: Core domain entities and value objects
  - Defines WikiPage, RawSource, ActivityLogEntry, MaintenanceReport, Section
  - Defines WikiPageFrontmatter value object for YAML metadata
  - Zero external dependencies

- **@wiki/domain-naming**: Naming convention validation and generation
  - Validates kebab-case format for entity, concept, and source pages
  - Generates valid filenames following wiki schema conventions
  - Implements ValidationResult value object
  - Defines NamingConventionError domain exception

- **@wiki/domain-validation**: Domain-level validation rules
  - Validates frontmatter completeness and correctness
  - Validates page structure integrity
  - Validates cross-reference targets exist
  - Enforces business constraints

### Application Layer

**Purpose**: The Application Layer orchestrates use cases by coordinating domain operations and infrastructure services through port interfaces.

**Responsibilities**:
- Define use case services that sequence domain operations
- Define port interfaces for infrastructure dependencies
- Implement command handlers that modify state
- Implement query handlers that retrieve data
- Coordinate cross-cutting concerns (logging, validation)
- Transform domain entities to/from external representations

**Dependency Rules**:
- MAY depend on Domain Layer libraries
- MAY depend on port interfaces defined within Application Layer
- MUST NOT depend on Infrastructure Layer implementations
- MUST NOT import concrete infrastructure adapter classes

**Libraries**:
- **@wiki/application-ports**: Port interface definitions
  - Defines FileSystemPort, MarkdownPort, FrontmatterPort
  - Provides contracts for infrastructure implementations
  - Enables dependency inversion and testability

- **@wiki/application-generators**: Page generation use cases
  - GenerateEntityPageUseCase, GenerateConceptPageUseCase, GenerateSourceSummaryUseCase
  - Defines EntityPageOptions, ConceptPageOptions, SourceSummaryOptions
  - Returns GeneratedPage results with content, filename, and frontmatter

- **@wiki/application-cross-reference**: Cross-reference detection and linking
  - DetectCrossReferencesUseCase, InsertCrossReferenceLinksUseCase
  - ValidateWikiLinksUseCase, FindBacklinksUseCase
  - SuggestBidirectionalLinksUseCase
  - Defines CrossReference value object and LinkValidationResult

- **@wiki/application-index-manager**: Index management use cases
  - Manages generation and updates of wiki indexes
  - Coordinates page listing and categorization

- **@wiki/application-activity-log**: Activity logging use cases
  - LogActivityUseCase for recording wiki operations
  - QueryActivityLogUseCase for retrieving activity history
  - Tracks page creation, updates, and ingestion events

- **@wiki/application-query**: Search and query use cases
  - QueryEngine service providing search and retrieval operations
  - SearchUseCase, SearchByTagUseCase
  - FindEntitiesUseCase, FindConceptsUseCase, FindSourcesUseCase
  - FindResearchDecisionsUseCase for ADR-specific search
  - Defines SearchResult, SearchOptions, SourceFilters

- **@wiki/application-maintenance**: Maintenance and health check use cases
  - DetectDuplicatesUseCase, DetectContradictionsUseCase
  - DetectBrokenLinksUseCase, DetectOrphansUseCase
  - GenerateMaintenanceReportUseCase for comprehensive health checks
  - Works with MaintenanceReport domain entity

- **@wiki/application-workflow**: High-level workflow orchestration
  - IngestSourceWorkflow orchestrates raw source ingestion
  - UpdatePageWorkflow orchestrates page updates with validation
  - GenerateIndexWorkflow orchestrates index generation
  - MaintenanceWorkflow orchestrates periodic maintenance tasks
  - Coordinates multiple use cases into complete workflows

- **@wiki/application-adr**: ADR-specific use cases
  - GenerateADRPageUseCase for Architecture Decision Records
  - LinkADRToSessionUseCase, ValidateADRReferencesUseCase
  - ExtractADRMetadataUseCase

### Infrastructure Layer

**Purpose**: The Infrastructure Layer provides concrete implementations of port interfaces defined by the Application Layer.

**Responsibilities**:
- Implement file system operations (read, write, list, validate paths)
- Implement markdown parsing and formatting
- Implement frontmatter processing (parse, generate, validate)
- Handle external dependencies and I/O operations
- Provide adapters for technical concerns

**Dependency Rules**:
- MAY depend on Domain Layer libraries
- MAY depend on Application Layer port interfaces
- MAY import external npm packages for technical capabilities
- MUST implement port interfaces from Application Layer

**Libraries**:
- **@wiki/infrastructure-filesystem**: File system adapter
  - Implements FileSystemPort interface
  - Provides file read/write operations for raw/ and wiki/ directories
  - Validates paths to prevent directory traversal attacks
  - Uses atomic write operations (write to temp, then rename)
  - Supports glob patterns for file listing
  - Defines InvalidPathError and FileOperationError exceptions
  - Dependencies: Node.js fs/promises, glob, path

- **@wiki/infrastructure-markdown**: Markdown parsing and formatting adapter
  - Implements MarkdownPort interface
  - Parses markdown into hierarchical Section structures
  - Extracts WikiLink references using regex patterns
  - Generates markdown with proper formatting
  - Validates markdown syntax for Obsidian compatibility
  - Pure TypeScript implementation with no external dependencies

- **@wiki/infrastructure-frontmatter**: Frontmatter processing adapter
  - Implements FrontmatterPort interface
  - Uses gray-matter for YAML parsing and generation
  - Validates required fields and data types
  - Handles date format conversions
  - Ensures Obsidian compatibility
  - Defines FrontmatterValidationError exception
  - Dependencies: gray-matter

### Presentation Layer

**Purpose**: The Presentation Layer defines public APIs and exports for external consumption.

**Responsibilities**:
- Define public API through index.ts barrel files
- Re-export application services and domain entities
- Provide facade interfaces for common workflows
- Document public API contracts
- Provide factory functions for creating configured service instances

**Dependency Rules**:
- MAY depend on Application Layer services
- MAY depend on Domain Layer entities
- MUST NOT export Infrastructure Layer implementations
- SHOULD provide simple, intuitive public interfaces

**Libraries**:
- **@wiki/core**: Main public API facade
  - Re-exports domain entities from @wiki/domain-models
  - Re-exports use case services from application layer libraries
  - Provides createWikiSystem factory function
  - Defines WikiSystem and WikiSystemConfig interfaces
  - Serves as the single entry point for external consumers

## Dependency Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│                        (@wiki/core)                          │
│  - Public API exports                                        │
│  - Facade interfaces                                         │
│  - Factory functions                                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  @wiki/application-generators                                │
│  @wiki/application-cross-reference                           │
│  @wiki/application-index-manager                             │
│  @wiki/application-activity-log                              │
│  @wiki/application-query                                     │
│  @wiki/application-maintenance                               │
│  @wiki/application-workflow                                  │
│  @wiki/application-adr                                       │
│  @wiki/application-ports (port interfaces)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                       Domain Layer                           │
│  @wiki/domain-models                                         │
│  @wiki/domain-naming                                         │
│  @wiki/domain-validation                                     │
└─────────────────────────────────────────────────────────────┘
                         ▲
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  @wiki/infrastructure-filesystem                             │
│  @wiki/infrastructure-markdown                               │
│  @wiki/infrastructure-frontmatter                            │
│  (implements Application Layer ports)                        │
└─────────────────────────────────────────────────────────────┘
```

## Layer Dependency Rules

The architecture enforces strict dependency rules between layers:

1. **Domain Layer**:
   - ✅ No dependencies on any other layer
   - ✅ Only uses TypeScript standard library
   - ❌ Cannot import from Application, Infrastructure, or Presentation layers
   - ❌ Cannot use external npm packages

2. **Application Layer**:
   - ✅ Depends on Domain Layer entities and value objects
   - ✅ Defines port interfaces for infrastructure needs
   - ❌ Cannot import Infrastructure Layer implementations
   - ❌ Cannot import concrete adapter classes

3. **Infrastructure Layer**:
   - ✅ Depends on Domain Layer entities
   - ✅ Implements Application Layer port interfaces
   - ✅ Can use external npm packages for technical capabilities
   - ❌ Should not be imported directly by other layers (use ports instead)

4. **Presentation Layer**:
   - ✅ Depends on Application Layer services
   - ✅ Depends on Domain Layer entities
   - ❌ Cannot export Infrastructure Layer implementations
   - ❌ Cannot bypass Application Layer to access Domain directly in complex scenarios

These rules are enforced through:
- Nx dependency constraints configured in .eslintrc.json
- Library tags (domain, application, infrastructure, presentation)
- Build-time validation through ESLint
- Code review and architecture governance

## Library Relationships

### Domain Layer Dependencies

```
@wiki/domain-models (no dependencies)
        ▲
        │
        ├─── @wiki/domain-naming
        │
        └─── @wiki/domain-validation
```

### Application Layer Dependencies

```
@wiki/domain-models
        ▲
        │
@wiki/application-ports ─────────┐
        ▲                        │
        │                        │
        ├─── @wiki/application-generators
        ├─── @wiki/application-cross-reference
        ├─── @wiki/application-index-manager
        ├─── @wiki/application-activity-log
        ├─── @wiki/application-query
        ├─── @wiki/application-maintenance
        ├─── @wiki/application-adr
        │                        │
        └─── @wiki/application-workflow ◄─┘
                (orchestrates all use cases)
```

### Infrastructure Layer Dependencies

```
@wiki/application-ports
        ▲
        │
        ├─── @wiki/infrastructure-filesystem
        ├─── @wiki/infrastructure-markdown
        └─── @wiki/infrastructure-frontmatter
```

### Presentation Layer Dependencies

```
@wiki/domain-models
@wiki/application-* (all)
        ▲
        │
@wiki/core (public facade)
```

## Port and Adapter Pattern

The system uses the Port and Adapter pattern to decouple business logic from technical implementation:

### Port Interfaces (Application Layer)

**FileSystemPort**: Abstracts file system operations
- readRawFile, readWikiFile, writeWikiFile
- listRawFiles, listWikiFiles
- rawFileExists, wikiFileExists
- getRawFileStats, getWikiFileStats
- ensureWikiDir, deleteWikiFile

**MarkdownPort**: Abstracts markdown processing
- parseMarkdownSections, extractWikiLinks
- generateWikiLink, generateHeading, generateList
- generateCodeBlock, validateMarkdownSyntax
- sectionsToMarkdown, escapeMarkdown

**FrontmatterPort**: Abstracts YAML frontmatter operations
- parseFrontmatter, generateFrontmatter
- createFrontmatter, updateTimestamp

### Adapter Implementations (Infrastructure Layer)

**FileSystemAdapter**: Implements FileSystemPort using Node.js fs/promises
**MarkdownAdapter**: Implements MarkdownPort using pure TypeScript
**FrontmatterAdapter**: Implements FrontmatterPort using gray-matter

This pattern enables:
- **Testing**: Application layer can be tested with mock port implementations
- **Flexibility**: Infrastructure implementations can be swapped without affecting business logic
- **Dependency Inversion**: High-level modules don't depend on low-level modules

## Migration Mapping

This table maps the original source modules from scripts/wiki (now removed) to the target Nx libraries:

| Source Module | Target Library | Architectural Layer | Description |
|---------------|----------------|---------------------|-------------|
| models.ts | @wiki/domain-models | Domain | Core domain entities and value objects (WikiPage, RawSource, ActivityLogEntry, MaintenanceReport, Section, WikiPageFrontmatter) |
| naming.ts | @wiki/domain-naming | Domain | Naming convention validation and filename generation following wiki schema conventions |
| N/A (new) | @wiki/domain-validation | Domain | Domain-level validation rules for business constraints |
| N/A (new) | @wiki/application-ports | Application | Port interface definitions for infrastructure dependencies (FileSystemPort, MarkdownPort, FrontmatterPort) |
| generators.ts | @wiki/application-generators | Application | Page generation use cases for entity, concept, and source pages |
| cross-reference.ts | @wiki/application-cross-reference | Application | Cross-reference detection, linking, and validation use cases |
| index-manager.ts | @wiki/application-index-manager | Application | Index management and generation use cases |
| activity-log.ts | @wiki/application-activity-log | Application | Activity logging and query use cases for tracking wiki operations |
| query.ts | @wiki/application-query | Application | Search and query use cases with full-text search, tag-based search, and filtering |
| maintenance.ts | @wiki/application-maintenance | Application | Maintenance and health check use cases (duplicates, contradictions, broken links, orphans) |
| workflow.ts | @wiki/application-workflow | Application | High-level workflow orchestration coordinating multiple use cases |
| adr-*.ts | @wiki/application-adr | Application | ADR-specific use cases for Architecture Decision Records |
| filesystem.ts | @wiki/infrastructure-filesystem | Infrastructure | File system adapter implementing FileSystemPort with path validation and atomic writes |
| markdown.ts | @wiki/infrastructure-markdown | Infrastructure | Markdown parsing and formatting adapter implementing MarkdownPort |
| frontmatter.ts | @wiki/infrastructure-frontmatter | Infrastructure | Frontmatter processing adapter implementing FrontmatterPort using gray-matter |
| N/A (new) | @wiki/core | Presentation | Main public API facade re-exporting services and entities with factory functions |

## Migration Completion

**Migration Status**: ✅ **COMPLETED**

The migration from the monolithic `scripts/wiki` directory to the modular Nx library structure was successfully completed. The `scripts/wiki` directory has been removed, and all functionality has been reorganized into properly structured libraries following clean architecture principles.

### Migration Summary

- **Libraries Created**: 18 Nx libraries across 4 architectural layers
- **Source Files Migrated**: All TypeScript modules from scripts/wiki
- **Tests Migrated**: All test files with updated import paths
- **Examples Migrated**: Example files moved to libs/wiki/examples
- **Documentation Updated**: README.md, ARCHITECTURE.md, and guide files updated
- **Import Paths Updated**: All references changed from relative paths to `@wiki/*` aliases
- **Build Verification**: All libraries build successfully with no errors
- **Test Verification**: All tests pass with preserved functionality

### Key Improvements

1. **Architectural Clarity**: Clear separation between Domain, Application, Infrastructure, and Presentation layers
2. **Dependency Management**: Strict dependency rules enforced through Nx constraints
3. **Testability**: Each layer can be tested independently with appropriate strategies
4. **Maintainability**: Modular structure makes code easier to understand and modify
5. **Scalability**: New features can be added without cascading changes
6. **Build Performance**: Incremental builds enabled through buildable library configuration

### Breaking Changes

All import paths have changed from relative paths to library aliases:

```typescript
// Before (scripts/wiki)
import { WikiPage } from './models.js';
import { generateEntityPage } from './generators.js';
import { queryWiki } from './query.js';

// After (Nx libraries)
import { WikiPage } from '@wiki/domain-models';
import { generateEntityPage } from '@wiki/application-generators';
import { queryWiki } from '@wiki/application-query';
```

For a complete usage guide with the new library structure, see the [README.md](../../README.md) and individual library README files.

## Build Configuration

All libraries are configured as buildable Nx libraries with:
- **Build Target**: Uses @nx/angular:ng-packagr-lite executor
- **Build Output**: {workspaceRoot}/dist/{projectRoot}
- **Test Target**: Uses @nx/angular:unit-test with Vitest
- **Lint Target**: Uses @nx/eslint:lint for code quality
- **TypeScript Config**: Separate tsconfig.lib.json and tsconfig.spec.json
- **Path Mappings**: Registered in tsconfig.base.json as @wiki/*

This configuration enables:
- Incremental builds for faster compilation
- Independent testing of each library
- Consistent linting across all libraries
- Type-safe imports using @wiki/* aliases

## Testing Strategy

Each layer uses appropriate testing strategies:

### Domain Layer Testing
- Unit tests for entities, value objects, and validation logic
- Property-based testing for validation rules
- No mocking required (pure functions)

### Application Layer Testing
- Unit tests for use case services
- Mock port interfaces for infrastructure dependencies
- Test business logic without I/O operations

### Infrastructure Layer Testing
- Integration tests for adapters
- Test against real file system, git repository
- Verify port interface contracts are satisfied

### Presentation Layer Testing
- Integration tests for public API
- Verify correct wiring of dependencies
- Test factory functions and facades

## Extension Guidelines

When adding new features:

1. **Identify the appropriate layer** based on the nature of the change:
   - Domain Layer: New business concepts or validation rules
   - Application Layer: New use cases or workflows
   - Infrastructure Layer: New technical integrations
   - Presentation Layer: New public API endpoints

2. **Follow dependency rules** strictly:
   - Domain must remain dependency-free
   - Application depends only on Domain and ports
   - Infrastructure implements ports
   - Presentation exposes Application and Domain

3. **Use port interfaces** for technical dependencies:
   - Define ports in Application Layer
   - Implement adapters in Infrastructure Layer
   - Never import infrastructure directly into Application

4. **Update documentation**:
   - Add library README for new libraries
   - Update ARCHITECTURE.md with new components
   - Document public API changes in @wiki/core

5. **Enforce with Nx constraints**:
   - Add appropriate tags to new libraries
   - Configure depConstraints in .eslintrc.json
   - Verify constraints with nx lint

## Conclusion

This architecture provides a maintainable, testable, and flexible foundation for the Wiki System. The clean separation of concerns enables independent development and testing of each layer while maintaining clear boundaries between business logic and technical implementation.

For questions or clarifications about the architecture, refer to individual library README files or consult the design document in .kiro/specs/wiki-architecture-refactor/design.md.
