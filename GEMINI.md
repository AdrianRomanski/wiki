# Gemini Instructions — Wiki Research Workspace

## Project Overview

This is an Angular/NX monorepo used for library research, prototyping, and building a structured knowledge wiki. The primary workflow involves researching libraries and articles, building prototypes in Storybook, and publishing findings to a wiki.

## Project Structure

- `apps/wiki-graph` — Main demo application
- `libs/prototype-playground` — All research prototypes; every prototype gets a Storybook story
- `.kiro/research/sessions/` — Research session artifacts and state
- `wiki/` — Published knowledge base (entities, concepts, sources)
- `scripts/` — Wiki manifest and index generation scripts

## Always-On Rules

### Code Style
- Use **standalone Angular components** exclusively — no NgModules
- TypeScript strict mode; no `any` types
- Kebab-case for all file and folder names
- Follow NX project conventions for imports and project boundaries

### Research Workflows

This workspace has two research workflows, each managed by the `research-buddy` skill:

1. **Library Research** — explore, prototype, and document npm libraries
2. **Article Research** — extract, normalize, and publish knowledge from blog articles

**To activate the research-buddy skill**, tell the agent:
> "Use the research-buddy skill" or invoke any research command listed below.

### Quick Command Reference

| Command | Purpose |
|---|---|
| `research` | Start new research session (interactive questionnaire) |
| `continue research: [session-id]` | Resume paused session |
| `pause research` | Pause current session |
| `finalize research` | Publish to wiki |

### Wiki Publication

After any research session, wiki pages are generated under:
- `wiki/entities/` — library or tool pages
- `wiki/concepts/` — pattern and principle pages
- `wiki/sources/` — citable research session references

Always run both scripts after creating wiki pages:
```bash
node scripts/generate-wiki-manifest.mjs
node scripts/generate-wiki-index.mjs
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
