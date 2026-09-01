# Gemini Instructions — Wiki Research Workspace

## Project Overview

This is an Angular/NX monorepo used for library research, prototyping, and building a structured knowledge wiki. The primary workflow involves researching libraries and articles, building prototypes in Storybook, and publishing findings to a wiki.

## Project Structure

- `apps/wiki-graph` — Main demo application
- `libs/prototype-playground` — All research prototypes; every prototype gets a Storybook story
- `.kiro/research/sessions/` — Research session artifacts and state
- `wiki/` — Published knowledge base (entities, concepts, sources)
- `apps/wiki-cli` — Nx application exposing wiki manifest/index generation, tag validation, and scaffolding as `nx run wiki-cli:*` targets

## Always-On Rules

### Code Style

- Use **standalone Angular components** exclusively — no NgModules
- TypeScript strict mode; no `any` types
- Kebab-case for all file and folder names
- Follow NX project conventions for imports and project boundaries

### Component Architecture

- **UI Components**: Must ONLY have `input()` and `output()`. Never inject data services or manage external state directly.
- **Container Components**: Responsible for wrapping UI components, composing layouts, rendering component structures and lists.
- **Smart Components**: Responsible for knowing where data comes from (injecting state/data services like `GraphStateService`) and binding reactive state to containers and UI components.

### Mandatory Tooling & Integration Workflows

- **Angular Development**: ALWAYS connect to the `angular-cli` MCP server (e.g. `get_best_practices`) before writing or modifying any Angular code.
- **CSS / Styling**: ALWAYS connect to the `css` MCP server (e.g. `get_docs`, `analyze_css`) before writing or modifying SCSS/CSS styles.
- **Documentation & READMEs**: ALWAYS create or update README files / documentation after generating or modifying code to maintain clean, comprehensive repository documentation.

### Research Workflows

This workspace has two research workflows, each managed by the `research-buddy` skill:

1. **Library Research** — explore, prototype, and document npm libraries
2. **Article Research** — extract, normalize, and publish knowledge from blog articles

**To activate the research-buddy skill**, tell the agent:

> "Use the research-buddy skill" or invoke any research command listed below.

### Quick Command Reference

| Command                           | Purpose                                                |
| --------------------------------- | ------------------------------------------------------ |
| `research`                        | Start new research session (interactive questionnaire) |
| `continue research: [session-id]` | Resume paused session                                  |
| `pause research`                  | Pause current session                                  |
| `finalize research`               | Publish to wiki                                        |

### Wiki Publication

After any research session, wiki pages are generated under:

- `wiki/entities/` — library or tool pages
- `wiki/concepts/` — pattern and principle pages
- `wiki/sources/` — citable research session references

Always run both targets after creating wiki pages:

```bash
npx nx run wiki-cli:generate-manifest
npx nx run wiki-cli:generate-index
```

### Prototype Validation

Every prototype component must:

1. Be placed in `libs/prototype-playground/src/lib/[session-id]-[name]/`
2. Have a corresponding `.stories.ts` file
3. Be validated with chrome-devtools-mcp (screenshot + console check + Lighthouse audit)

## Skills

The full research workflow instructions live in:

```
.gemini/skills/research-buddy/skill.md
```

Load this skill whenever the user invokes any research command or asks about the research workflow.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
