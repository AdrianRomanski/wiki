# Article Research Session Workflow

## Project Context

This steering file governs the article research workflow, which extends the research session system to support blog articles as input material. Articles are processed through the same state machine as Big Picture library sessions (EXPLORE → SYNTHESIZE → FINALIZE → FINALIZED), but without a prototype phase.

## Article Research Methodology

### Core Principles

1. **Content Extraction** - Parse articles into structured data (title, author, date, entities, concepts)
2. **Knowledge Normalization** - Transform article content into wiki-compatible format
3. **Cross-Reference Integration** - Link article-sourced knowledge to existing wiki pages
4. **Source Preservation** - Store articles as citable source pages in the wiki
5. **Session Management** - Track progress through pause/resume and state transitions

### Input Sources

When researching an article:

1. **URL Input** - Fetch article content from a web URL (HTTP GET with 30s timeout)
2. **Pasted Text** - Accept article content directly as pasted text

**Validation:** User must provide exactly one input type (URL or pasted text, not both, not neither).

## Article Research Session Workflow

### Session States
- **EXPLORE** - Fetch/accept article, extract content, generate analysis
- **SYNTHESIZE** - Consolidate findings into findings-summary.md
- **FINALIZE** - Await wiki publication decision
- **FINALIZED** - Session complete; wiki pages published or declined

### Research Artifacts
All research is organized in `.kiro/research/sessions/[session-id]/`:
- `session.json` - Session metadata and state (scope: "article")
- `raw-article.md` - Original article content as fetched/pasted
- `article-content.json` - Structured intermediate representation
- `article-analysis.md` - Analysis artifact with entities, concepts, code blocks
- `findings-summary.md` - Consolidated findings ready for wiki publication

## Article Research Steps

### Step 1: EXPLORE — Article Retrieval and Analysis

**Session Initialization:**
1. User invokes `start article research: [topic]`
2. Create session directory at `.kiro/research/sessions/[session-id]/`
3. Write `session.json` with `scope: "article"`, `state: "EXPLORE"`, `createdAt: YYYY-MM-DD`
4. Prompt user for article input (URL or pasted text)

**Input Validation:**
- If user provides both URL and pasted text → reject, re-prompt
- If user provides neither → reject, re-prompt
- If invalid input persists after first re-prompt → remove session directory
- URL must begin with `http://` or `https://`

**Article Fetching (URL input):**
1. Validate URL format before making request
2. HTTP GET with 30s timeout
3. On success: save to `raw-article.md`, record `articleUrl` in `session.json`
4. On failure: report HTTP status/error, offer retry (max 3) or switch to pasted text
5. After max retries: treat URL as permanently unreachable

**Article Acceptance (pasted text input):**
1. Accept pasted content directly
2. Save to `raw-article.md` without network request
3. Omit `articleUrl` field from `session.json`
4. Record `articleInputType: "pasted-text"`

**Content Extraction:**
1. Parse `raw-article.md` into structured representation
2. Extract: title, author (optional), date (optional), body text, code blocks, outbound links
3. If title cannot be determined (no H1, no frontmatter title) → prompt user for title
4. Identify candidate entities (libraries, tools, APIs, components)
5. Identify candidate concepts (patterns, principles, techniques)
6. Save as `article-content.json` with candidates included

**Analysis Generation:**
1. Present extracted metadata (title, author, date) to user for confirmation
2. If user rejects metadata → prompt for corrected values
3. Generate `article-analysis.md` with:
   - Article metadata (title, author, date, source URL)
   - Summary of main argument/topic
   - Identified entities with 1-3 sentence descriptions
   - Identified concepts with 1-3 sentence descriptions
   - All code blocks from article
4. If no entities or concepts found → note explicitly, still proceed
5. Transition to SYNTHESIZE

### Step 2: SYNTHESIZE — Findings Summary

**Findings Consolidation:**
1. Generate `findings-summary.md` by transforming `article-analysis.md`
2. Structure with sections:
   - Document metadata (title, author, date, source URL, scope, research date)
   - Key insights
   - Identified entities
   - Identified concepts
   - Recommended wiki pages (path, type, rationale)
   - Session artifacts (list all files produced)
3. Every recommended wiki page from analysis MUST appear in findings summary
4. Display full contents inline for user review

**Review Loop:**
1. User requests changes → apply changes, display updated document
2. Repeat until user explicitly approves ("looks good", "approved", "proceed", "yes")
3. Do NOT advance to FINALIZE until user approves
4. On approval → transition to FINALIZE

### Step 3: FINALIZE — Wiki Publication

**Publication Decision:**
1. Present full `findings-summary.md` to user
2. Ask whether to publish to wiki

**Accept Path — Create Wiki Pages:**

**Normalized Source Page:**
- Path: `wiki/sources/[article-slug]-article-[YYYY-MM-DD].md`
- Follow `WIKI_SCHEMA.md` source summary template
- YAML frontmatter: `title`, `type: source`, `author` (optional), `date` (optional), `url` (optional), `tags` (≥1), `created`, `updated`
- Body sections: Metadata, Key Points (≥1), Insights (≥1), Relevant Entities (WikiLinks), Relevant Concepts (WikiLinks), Session Artifacts

**Entity Pages:**
- For each entity in findings-summary.md:
  - If `wiki/entities/[entity-slug].md` does NOT exist → create new page
  - If page exists → append new section referencing article title and date
- Use `[[Page Title]]` WikiLink syntax for all cross-references

**Concept Pages:**
- For each concept in findings-summary.md:
  - If `wiki/concepts/[concept-slug].md` does NOT exist → create new page
  - If page exists → append new section referencing article title and date
- Use `[[Page Title]]` WikiLink syntax for all cross-references

**Reciprocal References:**
- Add `[[Source Page Title]]` reference to each entity/concept page linked from source page
- If reciprocal reference fails → preserve source page, report which targets failed

**Manifest and Index Regeneration:**
- Run `node scripts/generate-wiki-manifest.mjs` from workspace root
- Run `node scripts/generate-wiki-index.mjs` from workspace root
- If either script fails → delete all wiki pages created in session, set `wikiPages: []`

**Decline Path — No Wiki Pages:**
- Do NOT create any wiki pages
- Record `wikiPages: []` in `session.json`

**Finalization:**
1. Update `session.json`:
   - `state: "FINALIZED"`
   - `finalizedAt: YYYY-MM-DD`
   - `wikiPages: [array of successfully created paths]` or `[]`
2. Display completion summary with all artifacts created

## session.json Schema (Article Sessions)

```jsonc
{
  // ── Required at creation ──────────────────────────────────────────────────
  "id": "string",                    // kebab-case, max 80 chars
  "topic": "string",                 // human-readable research topic
  "state": "EXPLORE",                // EXPLORE | SYNTHESIZE | FINALIZE | FINALIZED | PAUSED
  "scope": "article",                // always "article" for article sessions
  "createdAt": "YYYY-MM-DD",         // ISO date

  // ── Article-specific fields ───────────────────────────────────────────────
  "articleInputType": "url",          // "url" | "pasted-text"
  "articleUrl": "https://...",        // present only when articleInputType is "url"
  "articleTitle": "string",           // confirmed article title (required before leaving EXPLORE)
  "articleAuthor": "string",          // optional, omitted if not extractable
  "articleDate": "YYYY-MM-DD",        // optional, omitted if not extractable

  // ── Pause fields (present only when PAUSED) ───────────────────────────────
  "pausedAt": "YYYY-MM-DD",
  "resumeFrom": "EXPLORE",           // EXPLORE | SYNTHESIZE | FINALIZE

  // ── Finalization fields (present only when FINALIZED) ─────────────────────
  "finalizedAt": "YYYY-MM-DD",
  "wikiPages": ["wiki/sources/...", "wiki/entities/...", "wiki/concepts/..."]
}
```

**Excluded fields** (library-session only): `libraries`, `version`, `repositoryUrl`, `githubRef`, `sourceStrategy`, `fallbackSources`, `focusArea`, `goal`, `priorSessionId`, `sources`.

## Session Directory Layout

```
.kiro/research/sessions/[session-id]/
├── session.json
├── raw-article.md
├── article-content.json
├── article-analysis.md
└── findings-summary.md
```

## Pause and Resume

### Pausing a Session

The `pause research` command can be issued at any active step (EXPLORE, SYNTHESIZE, FINALIZE):

1. Confirm all artifacts are saved to disk
2. Update `session.json`:
   - Set `state: "PAUSED"`
   - Add `pausedAt: YYYY-MM-DD`
   - Add `resumeFrom: [current step]`

### Resuming a Session

When user issues `continue research: [session-id]`:

1. Read `session.json` from `.kiro/research/sessions/[session-id]/session.json`
2. Confirm `state` is `"PAUSED"`
3. Restore session context by loading all artifacts
4. Display resume summary:
   - Session id, article title, scope
   - Paused at date
   - Resuming from step
   - Completed steps with artifact paths
5. Update `session.json`:
   - Remove `pausedAt` and `resumeFrom`
   - Set `state` to value from `resumeFrom`
6. Continue from restored step

## Commands

All commands for article research are issued to `#research-buddy`:

| Command | Step | Effect |
|---|---|---|
| `start article research: [topic]` | EXPLORE | Begins EXPLORE step; prompts for URL or pasted text |
| `pause research` | Any | Pauses session at current step |
| `continue research: [session-id]` | PAUSED | Resumes paused session |
| `finalize research` | SYNTHESIZE → FINALIZE | Triggers wiki publication decision |

## Error Handling

### Article_Fetcher Errors

| Error Condition | Behavior |
|----------------|----------|
| URL doesn't start with http(s):// | Reject immediately, prompt for valid URL |
| HTTP timeout (>30s) | Report timeout, offer retry (max 3) or switch to pasted text |
| Non-200 HTTP status | Report status code and reason, offer retry (max 3) or switch to pasted text |
| Max retries exceeded | Treat URL as permanently unreachable, require switch to pasted text |

### Content_Extractor Errors

| Error Condition | Behavior |
|----------------|----------|
| Empty raw-article.md | Report failure, halt without writing article-content.json |
| Unparseable content | Report failure reason, halt without writing article-content.json |
| No title found (no H1, no frontmatter title) | Prompt user to provide title before proceeding |
| No entities or concepts found | Note in article-analysis.md, allow session to proceed |

### Wiki_Publisher Errors

| Error Condition | Behavior |
|----------------|----------|
| Wiki page write failure | Report per-page status, record only successful pages, offer retry |
| Reciprocal reference failure | Preserve source page, report which targets failed |
| generate-wiki-manifest.mjs failure | Delete all wiki pages created in session, set wikiPages to [] |
| generate-wiki-index.mjs failure | Delete all wiki pages created in session, set wikiPages to [] |

### Session_Manager Errors

| Error Condition | Behavior |
|----------------|----------|
| Invalid state transition | Reject transition, inform user of current state |
| Resume non-paused session | Inform user session is not paused, show current state |
| Invalid input (both URL and text, or neither) | Reject, re-prompt once; on second failure, remove session directory |
| articleTitle not confirmed | Block transition from EXPLORE |

## Key Principles

- **Article sessions have no prototype phase** - Articles are consumed content, not APIs to experiment with
- **Reuse existing wiki infrastructure** - Use same manifest/index scripts as library research
- **Preserve source attribution** - Every article becomes a citable source page
- **Idempotent updates** - Appending to existing pages prevents data loss
- **Rollback on failure** - Script failures trigger deletion of created pages for consistency
- **Manual inclusion** - This steering file loads only when explicitly invoked via `#research-buddy`

---

**This steering file is automatically loaded when you invoke `#research-buddy` for article research workflows.**
