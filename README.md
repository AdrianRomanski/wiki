# DeepDiveAngularAria

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Table of Contents

- [Run Tasks](#run-tasks)
- [Add New Projects](#add-new-projects)
- [Research-Wiki Integration](#research-wiki-integration)
- [Set Up CI](#set-up-ci)
- [Install Nx Console](#install-nx-console)
- [Useful Links](#useful-links)

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve wiki-graph
```

To create a production bundle:

```sh
npx nx build wiki-graph
```

To see all available targets to run for a project, run:

```sh
npx nx show project wiki-graph
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/angular:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/angular:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Research-Wiki Integration

This workspace includes an integrated research and knowledge management system that automatically captures technical decisions and research findings into a structured wiki.

### Overview

The research-wiki integration automates the flow from library research to documented decisions:

```
Research → Finalize → ADR → Wiki Ingestion → Searchable Knowledge Base
```

When you complete a research session and create an Architecture Decision Record (ADR), the system automatically:

1. Copies the ADR to the wiki ingestion pipeline
2. Generates structured wiki pages with metadata
3. Creates cross-references to related concepts and entities
4. Maintains bidirectional links between research sessions and wiki pages
5. Makes decisions searchable and discoverable

### Architecture

The wiki system is organized as a collection of Nx libraries following clean architecture principles with four distinct layers:

- **Domain Layer** (`@wiki/domain-*`): Core business entities and validation rules with zero external dependencies
- **Application Layer** (`@wiki/application-*`): Use case orchestration services coordinating domain operations through port interfaces
- **Infrastructure Layer** (`@wiki/infrastructure-*`): Technical implementations of file system, markdown, and frontmatter adapters
- **Presentation Layer** (`@wiki/core`): Public API facade providing unified access to all wiki functionality

See [libs/wiki/ARCHITECTURE.md](libs/wiki/ARCHITECTURE.md) for complete architectural documentation.

### Directory Structure

```
.kiro/
├── research/                          # Research sessions
│   └── [session-id]/                  # Individual research session
│       ├── decision.adr.md            # Architecture Decision Record (preserved)
│       ├── comparison-report.md       # Library comparison analysis
│       ├── final-report.md            # Research conclusions
│       └── prototypes/                # Code prototypes for evaluation
│
└── specs/                             # Feature specifications
    └── [feature-name]/
        ├── requirements.md
        ├── design.md
        └── tasks.md

raw/
├── research-decisions/                # ADRs ready for wiki ingestion
│   └── decision.adr.md                # Copied from research sessions
│
├── articles/                          # External articles and papers
├── code-snippets/                     # Code examples
├── notes/                             # General notes
└── papers/                            # Academic papers

wiki/
├── sources/                           # Source_Summary pages (generated from ADRs)
│   └── [decision-name].md             # Structured decision documentation
│
├── entities/                          # Entity_Page entries (libraries, tools)
│   └── [library-name].md              # Library information and relationships
│
├── concepts/                          # Concept_Page entries (patterns, techniques)
│   └── [concept-name].md              # Conceptual knowledge
│
└── guides/                            # How-to guides and workflows
    └── adr-ingestion.md               # ADR ingestion guide

libs/wiki/                             # Wiki system Nx libraries (clean architecture)
├── domain-models/                     # Core domain entities (WikiPage, RawSource, etc.)
├── domain-naming/                     # Naming convention validation and generation
├── domain-validation/                 # Domain-level validation rules
├── application-ports/                 # Port interface definitions
├── application-generators/            # Page generation use cases
├── application-cross-reference/       # Cross-reference detection and linking
├── application-index-manager/         # Index management use cases
├── application-activity-log/          # Activity logging use cases
├── application-query/                 # Search and query use cases
├── application-maintenance/           # Maintenance and health check use cases
├── application-workflow/              # High-level workflow orchestration
├── application-adr/                   # ADR-specific use cases
├── infrastructure-filesystem/         # File system adapter implementation
├── infrastructure-markdown/           # Markdown parsing and formatting adapter
├── infrastructure-frontmatter/        # Frontmatter processing adapter
└── core/                              # Public API facade
```

### Workflow: Research to Wiki

#### Step 1: Create Research Session

Start a new research session to explore library options:

```bash
# Create research session directory
mkdir -p .kiro/research/session-2024-01-15-state-management
cd .kiro/research/session-2024-01-15-state-management

# Create research artifacts
touch comparison-report.md
touch final-report.md
mkdir prototypes
```

#### Step 2: Conduct Research

Document your research findings:

- Compare library features and trade-offs
- Build prototypes to evaluate options
- Analyze performance, complexity, and maintainability
- Document insights in comparison and final reports

#### Step 3: Create Architecture Decision Record

When you've made a decision, create `decision.adr.md`:

```markdown
---
title: "Choose NgRx for State Management"
date: 2024-01-15
status: accepted
context: "Need centralized state management for large Angular application"
deciders: ["team-lead", "senior-dev"]
tags: ["angular", "state-management", "ngrx"]
sessionId: "session-2024-01-15-state-management"
---

# Choose NgRx for State Management

## Context and Problem Statement

We need a robust state management solution for our Angular application with
strong type safety, excellent debugging tools, and good community support.

## Decision Drivers

- Type safety and compile-time checks
- DevTools support for debugging
- Community support and ecosystem
- Learning curve for team
- Performance characteristics

## Considered Options

1. NgRx
2. Akita
3. NGXS

## Comparison Matrix

### Feature Comparison

| Feature | NgRx | Akita | NGXS | Winner |
|---------|------|-------|------|--------|
| Type Safety | Excellent | Good | Good | NgRx |
| DevTools | Excellent | Good | Good | NgRx |
| Learning Curve | Steep | Moderate | Easy | NGXS |
| Community | Large | Medium | Medium | NgRx |
| Performance | Excellent | Excellent | Good | NgRx/Akita |

## Decision Outcome

Chosen option: **NgRx**

### Rationale

NgRx provides the strongest type safety and best DevTools support, which are
critical for our large-scale application. While the learning curve is steeper,
the long-term benefits of type safety and debugging capabilities outweigh the
initial investment.

### Consequences

- Positive: Strong type safety, excellent debugging, large community
- Negative: Steeper learning curve, more boilerplate code
- Neutral: Well-established patterns, extensive documentation

## Research Links

- [Comparison Report](./comparison-report.md)
- [Final Report](./final-report.md)
- [NgRx Prototype](./prototypes/ngrx/)
- [Akita Prototype](./prototypes/akita/)
```

#### Step 4: Run ADR Ingestion Workflow

Ingest the ADR into the wiki system:

```typescript
import { runADRIngestionWorkflow } from '@wiki/application-adr';

// Ingest ADR from research session
const result = await runADRIngestionWorkflow({
  sessionDirectory: '.kiro/research/session-2024-01-15-state-management'
});

console.log('ADR ingestion complete!');
console.log('Generated pages:');
result.generatedPages.forEach(page => {
  console.log(`  - ${page.type}: ${page.path}`);
});
```

The workflow automatically:

1. **Copies ADR**: From `.kiro/research/[session-id]/decision.adr.md` to `raw/research-decisions/`
2. **Parses Metadata**: Extracts frontmatter, decision drivers, comparison matrices, and library names
3. **Generates Wiki Pages**:
   - `wiki/sources/choose-ngrx-for-state-management.md` (Source_Summary)
   - `wiki/entities/ngrx.md` (Entity_Page)
   - `wiki/entities/akita.md` (Entity_Page)
   - `wiki/entities/ngxs.md` (Entity_Page)
4. **Creates Cross-References**: Links to existing Entity and Concept pages
5. **Updates Indexes**: Adds pages to wiki index with tags
6. **Records Activity**: Logs ingestion event and creates git commit

#### Step 5: Query and Discover Decisions

Search for research decisions in the wiki:

```typescript
import { queryWiki } from '@wiki/application-query';

// Find all research decisions
const decisions = await queryWiki({
  tags: ['research', 'adr']
});

// Find decisions about specific library
const ngrxDecisions = await queryWiki({
  entityName: 'NgRx',
  tags: ['adr']
});

// Find recent state management decisions
const stateDecisions = await queryWiki({
  tags: ['state-management', 'adr'],
  sortBy: 'date',
  order: 'desc'
});
```

### Bidirectional Linking

The integration maintains bidirectional links between research sessions and wiki pages:

**From Wiki to Research:**

Each Source_Summary page includes a "Session Reference" section linking back to the original research session:

```markdown
## Session Reference

This decision originated from research session: 
[session-2024-01-15-state-management](../.kiro/research/session-2024-01-15-state-management/)

### Research Artifacts
- [Comparison Report](../.kiro/research/session-2024-01-15-state-management/comparison-report.md)
- [Final Report](../.kiro/research/session-2024-01-15-state-management/final-report.md)
- [Prototype: NgRx](../.kiro/research/session-2024-01-15-state-management/prototypes/ngrx/)
- [Prototype: Akita](../.kiro/research/session-2024-01-15-state-management/prototypes/akita/)
```

**From Research to Wiki:**

ADRs can reference existing wiki pages, and the system automatically detects and links these references during ingestion.

### Example: Complete Workflow

Here's a complete example of the research-to-wiki workflow:

```typescript
import { runADRIngestionWorkflow } from '@wiki/application-adr';
import { queryWiki } from '@wiki/application-query';

// 1. Ingest ADR from completed research session
const ingestionResult = await runADRIngestionWorkflow({
  sessionDirectory: '.kiro/research/session-2024-01-15-state-management'
});

console.log('Generated pages:');
ingestionResult.generatedPages.forEach(page => {
  console.log(`  ${page.type}: ${page.path}`);
});

// 2. Query for the new decision
const newDecision = await queryWiki({
  tags: ['adr'],
  filter: (page) => page.title.includes('NgRx')
});

console.log('\nDecision details:');
console.log(`  Title: ${newDecision[0].title}`);
console.log(`  Date: ${newDecision[0].metadata.date}`);
console.log(`  Status: ${newDecision[0].metadata.status}`);
console.log(`  Session: ${newDecision[0].metadata.sessionId}`);

// 3. Find related decisions
const relatedDecisions = await queryWiki({
  tags: ['state-management', 'adr']
});

console.log(`\nFound ${relatedDecisions.length} related decisions`);
```

### Key Features

- **Automatic ADR Copy**: ADRs are automatically copied from research sessions to wiki ingestion pipeline
- **Metadata Extraction**: Parses frontmatter, decision drivers, comparison matrices, and library names
- **Structured Wiki Pages**: Generates Source_Summary and Entity_Page entries with consistent formatting
- **Cross-Referencing**: Automatically detects and links related entities and concepts
- **Bidirectional Links**: Maintains links from wiki to research sessions and vice versa
- **Searchable**: All decisions are indexed and searchable by tags, libraries, and dates
- **Version Control**: All wiki changes are committed to git with descriptive messages
- **Activity Logging**: Records all ingestion events for audit and tracking

### Documentation

For detailed information about the research-wiki integration:

- **Research Workflow**: See `.kiro/steering/library-research.md` for complete research workflow documentation
- **ADR Ingestion Guide**: See `wiki/guides/adr-ingestion.md` for step-by-step ingestion instructions
- **Architecture Guide**: See `libs/wiki/ARCHITECTURE.md` for architectural documentation and library relationships
- **Wiki Schema**: See `WIKI_SCHEMA.md` for wiki page structure and conventions

### Maintenance

The wiki system includes maintenance tools to keep content up-to-date:

```typescript
import { runMaintenanceWorkflow } from '@wiki/application-maintenance';

// Run maintenance checks
const report = await runMaintenanceWorkflow();

// Check for issues
console.log('Broken session references:', report.brokenSessionReferences);
console.log('Duplicate entities:', report.duplicateEntities);
console.log('Superseded decisions:', report.supersededDecisions);
```

The maintenance workflow validates:

- Session reference links point to existing research sessions
- No duplicate Entity_Page entries for the same library
- Superseded ADRs are properly marked and linked
- Cross-reference links are valid and up-to-date



## Set up CI!

### Step 1

To connect to Nx Cloud, run the following command:

```sh
npx nx connect
```

Connecting to Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Step 2

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
