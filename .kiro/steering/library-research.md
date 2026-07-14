# Library Research & Comparison Project

## Project Context

This is a research-phase project for exploring, comparing, and prototyping with any library or framework. The goal is to learn through hands-on experimentation, make informed decisions through structured comparison, and document findings before formal spec-driven development.

## Research Methodology

### Core Research Principles

1. **Evidence-Based Research** - Always verify against official docs AND actual source code in the GitHub repository at the resolved ref
2. **Prototype First** - Build minimal, focused examples to understand library behavior
3. **Structured Comparison** - Use quantitative metrics (complexity, modularity, bundle size, token usage)
4. **Document Findings** - Capture insights, patterns, and decisions as you learn
5. **Limit Scope** - Compare maximum 3 libraries to avoid analysis paralysis
6. **Session Management** - Use research sessions to track progress and maintain context

### Documentation Sources Priority

When researching any library:

1. **GitHub Repository Source Files** - Read source code directly from the GitHub repository at the resolved ref
2. **Official Online Docs** - Search for latest API documentation and guides
3. **node_modules** - Optional fallback when GitHub sources are unavailable
4. **Community Resources** - GitHub issues, Stack Overflow, blog posts

**Why Multiple Sources?** GitHub repository source files are preferred because: (1) the repository is the canonical source of truth, (2) it may include unreleased changes not present in the published npm artifact, and (3) it requires no local installation.

## Research Session Workflow

### Session States
- **START** - Initialize new research session with topic and libraries
- **RESEARCH** - Analyze structure, complexity, modularity, and token usage
- **PROTOTYPE** - Build minimal working examples
- **COMPARE** - Generate comparison reports with matrices
- **PAUSE** - Save state for later continuation
- **CONTINUE** - Resume paused session
- **FINALIZE** - Complete research and generate ADR

### Research Artifacts
All research is organized in `.kiro/research/sessions/[session-id]/`:
- `session.json` - Session metadata and state
- `libraries/[lib]/` - Per-library analysis, examples, metrics
- `comparison-report.md` - Initial comparison matrices
- `prototypes/` - Working demo implementations
- `final-report.md` - Complete research summary
- `decision.adr.md` - Architecture Decision Record

## Comparison Dimensions

When comparing libraries (max 3), evaluate:

### 1. Complexity (Lower is Better)
- Implementation difficulty
- Cognitive load
- Boilerplate requirements
- Learning curve
- Edge cases to handle

### 2. Modularity (Higher is Better)
- Code organization
- Separation of concerns
- Reusability
- Extensibility

### 3. Bundle Impact
- Minified size
- Gzipped size
- Tree-shakeability

### 4. Token Usage (AI Assistance Cost)
- Setup tokens
- Implementation tokens
- Debugging tokens
- Total estimated tokens
- Model used for estimate

### 5. Developer Experience
- Documentation quality
- Community support
- Maintenance activity
- Setup time
- Implementation time

## Development Approach

### Minimal Examples
- Absolute minimum code to demonstrate patterns
- No extra features or abstractions
- Inline styles/templates when possible
- Clear comments explaining each part
- Runnable as-is

### Prototype Validation
- Build working demos for each library
- Test with real-world scenarios
- Validate accessibility (keyboard, screen reader)
- Measure actual implementation time
- Document challenges encountered

### Modern Angular Patterns
- Use standalone components
- Follow Angular best practices
- Leverage TypeScript features
- Prioritize accessibility
- Keep code minimal and focused

## Project Structure

- `apps/wiki-graph` - Main demo application (currently focused on Angular Aria)
- `libs/prototype-playground` - All research prototypes live here; every prototype gets a Storybook Story and is validated with chrome-devtools-mcp
- `.kiro/research/` - Research sessions and ADRs
- `.kiro/skills/` - Research workflow and assistant skills

## Key Research Principles

### Evidence-Based
- Read actual code from the GitHub repository at the resolved ref
- Check real documentation online
- Verify claims with code examples
- Cite sources
- Estimate token usage based on actual complexity

### Context-Aware
- Consider project goals and constraints
- Align with priorities (complexity, modularity, bundle size)
- Factor in presentation/demo needs
- Respect prototype-first approach

### Practical Focus
- Prioritize actionable insights
- Provide runnable examples
- Highlight real-world implications
- Consider specific use cases
- Include token efficiency for AI-assisted development

### Honest Assessment
- Point out limitations
- Acknowledge trade-offs
- Suggest alternatives
- Admit unknowns
- Provide realistic estimates

## Research Commands

Invoke `#research-buddy` to start. The assistant will ask you what you want to research and guide you through the rest interactively.

| Command | Effect |
|---|---|
| `research` | Start a new session — triggers interactive questionnaire |
| `continue research: [session-id]` | Resume a paused session |
| `pause research` | Pause the current session |
| `finalize research` | Trigger wiki publication decision |

## Integration with Spec Workflow

When research is complete:
1. Review ADR for decision context
2. Review final report for implementation plan
3. Create spec using research artifacts as input
4. Reference research session in spec
5. Convert prototypes to production code

## Key Principles

- **Research before building** - Understand options before committing
- **Compare objectively** - Use quantitative metrics, not just opinions
- **Prototype to validate** - Code reveals truth better than docs
- **Document decisions** - ADRs capture rationale for future reference
- **Limit comparisons** - Max 3 libraries keeps research focused
- **Track token costs** - AI assistance has real costs
- **Test accessibility** - Non-negotiable for all implementations
- **Consider maintenance** - Community and updates matter long-term
- **Manual inclusion** - This steering file loads only when explicitly invoked via `#research-buddy`

---

**Note:** For article research workflows, see the separate `article-research.md` steering file.

---

## Single Library Workflow

Use this workflow when you want to deeply understand one library without comparing it to alternatives. It is separate from the Comparison Workflow above and follows a different state machine.

### State Machine

**Big Picture sessions** (no prototype phase):
```
EXPLORE → SYNTHESIZE → FINALIZE → FINALIZED
```

**Deep Dive sessions** (prototype phase optional):
```
EXPLORE → PROTOTYPE → SYNTHESIZE → FINALIZE → FINALIZED
       ↘ SYNTHESIZE ↗
```

**PAUSE** and **CONTINUE** are cross-cutting states — they can be applied at any step without advancing the workflow. Pausing saves all current artifacts and records which step to resume from.

### State Transition Table

| From State | To State   | Trigger / Condition                                                    |
|------------|------------|------------------------------------------------------------------------|
| *(start)*  | EXPLORE    | User invokes `start research`, `explore [library]`, or `deep dive [library] into [area]` |
| EXPLORE    | SYNTHESIZE | **Big Picture:** scope selected, library installed, analysis artifact saved |
| EXPLORE    | PROTOTYPE  | **Deep Dive:** user chooses to prototype after EXPLORE                 |
| EXPLORE    | SYNTHESIZE | **Deep Dive:** user skips prototyping and proceeds directly to SYNTHESIZE |
| PROTOTYPE  | SYNTHESIZE | User indicates prototyping is complete *(Deep Dive only)*              |
| SYNTHESIZE | FINALIZE   | User approves the findings summary                                     |
| FINALIZE   | FINALIZED  | User makes wiki publication decision (accept or decline)               |
| EXPLORE    | PAUSED     | User issues `pause research`                                           |
| PROTOTYPE  | PAUSED     | User issues `pause research` *(Deep Dive only)*                        |
| SYNTHESIZE | PAUSED     | User issues `pause research`                                           |
| FINALIZE   | PAUSED     | User issues `pause research`                                           |
| PAUSED     | EXPLORE    | User issues `continue research: [session-id]` and `resumeFrom = EXPLORE`    |
| PAUSED     | PROTOTYPE  | User issues `continue research: [session-id]` and `resumeFrom = PROTOTYPE` *(Deep Dive only)* |
| PAUSED     | SYNTHESIZE | User issues `continue research: [session-id]` and `resumeFrom = SYNTHESIZE` |
| PAUSED     | FINALIZE   | User issues `continue research: [session-id]` and `resumeFrom = FINALIZE`   |

### Step 1: EXPLORE

The EXPLORE step is the entry point for every single library research session. It collects the library to research, installs it, determines the scope of analysis, and generates the primary analysis artifact.

#### 1.1 Prompting for Library and Scope

When the EXPLORE step begins, prompt the user for:

1. **Library name** — the npm package name (e.g., `rxjs`, `@angular/cdk`)
2. **Optional version or documentation URL** — if the user wants a specific version or has a docs URL to reference
3. **Session scope** — ask the user to choose one of:
   - **Big Picture** — full library overview: entry points, exported symbols, public API surface, peer dependencies
   - **Deep Dive** — focused analysis of a specific area within the library

If the user selects **Deep Dive**, also prompt for:

4. **Focus area** — the specific part of the library to investigate (e.g., `"grid pattern"`, `"form validation directives"`, `"operators"`). Store this in `session.json` as `focusArea`.
5. **Goal** — what the user wants to achieve or learn from this deep dive (e.g., `"understand how to implement keyboard navigation"`, `"decide if this is suitable for our use case"`). Store this in `session.json` as `goal`. This drives the analysis and determines whether prototyping is needed.

Record the chosen scope in `session.json` as `scope`: either `"big-picture"` or `"deep-dive"`.

#### 1.1.1 Version and Branch Targeting

After collecting the library name and scope, prompt the user to optionally specify a GitHub ref to target:

6. **GitHub ref (optional)** — ask the user to specify exactly one of:
   - A **version tag** (e.g., `21.2.10`, `v7.8.1`)
   - A **branch name** (e.g., `main`, `v2-lts`)
   - A **commit SHA** (40 hex characters)

   If the user provides more than one specification type simultaneously (e.g., both a version tag and a commit SHA), reject the request and re-prompt for exactly one type before proceeding.

**Default ref resolution (when user provides nothing):**

1. Fetch the repository's releases list from GitHub
2. Filter out any release tags whose name contains `alpha`, `beta`, or `rc` (case-insensitive)
3. Sort the remaining releases by `published_at` descending
4. Use the latest stable release tag as the ref
5. If no releases exist, fall back to the repository's default branch

**After resolution:**

- Display the resolved ref to the user before analysis begins
- If the user requests a change, re-enter the ref resolution process from step 6 above
- Record the resolved ref in `session.json` under `githubRef` as a plain string (full 40-character SHA, tag name, or branch name)

#### 1.2 Library Installation

`npm install` is **optional**. GitHub is the primary source for all analysis; `node_modules` is available as an optional supplementary or fallback source.

**node_modules check:** Check whether the library is already present in `node_modules`. If it is, report the installed version and the path to the package directory to the user as informational context. Do **not** block analysis on the presence or absence of a local installation.

**npm install is not required:** Do not prompt the user to install the library as a prerequisite for analysis when GitHub sources are available (i.e., the GitHub_Resolver has resolved a repository URL and the GitHub_Fetcher can reach the repository at the resolved ref).

#### 1.2.1 GitHub_Resolver

The GitHub_Resolver maps the npm package name to a canonical GitHub repository URL before any analysis begins. Run this algorithm immediately after the node_modules check in step 1.2.

**Resolution algorithm (in order):**

1. **Explicit URL provided:** If the user provided an explicit GitHub URL at session start, use it directly — skip steps 2–4.
2. **npm registry lookup:** Fetch `https://registry.npmjs.org/{package-name}` and extract `.repository.url`.
3. **GitHub URL found:** If `.repository.url` contains `"github.com"`, normalise it to `https://github.com/{owner}/{repo}` and record it — done.
4. **Registry unreachable or no GitHub URL:** If the registry is unreachable or `.repository.url` does not reference GitHub, notify the user and search GitHub using the package name as the query (`GET https://api.github.com/search/repositories?q={package-name}`). Present up to 3 candidates (name, description, stars, URL) to the user for selection.
   - If the user selects a candidate, use that URL.
   - If the user rejects all candidates, prompt for manual URL input.
5. **Record:** Store the resolved URL in `session.json` under `repositoryUrl` before the EXPLORE step generates any analysis artifact.

**URL normalisation rules:**
- Scheme: always `https://`
- Strip `.git` suffix
- Strip trailing slash
- Strip `git+` prefix if present
- Result form: `https://github.com/{owner}/{repo}`

**Examples:**

| Raw value | Normalised |
|---|---|
| `git+https://github.com/ReactiveX/rxjs.git` | `https://github.com/ReactiveX/rxjs` |
| `git://github.com/angular/angular.git` | `https://github.com/angular/angular` |
| `https://github.com/angular/angular-cdk/` | `https://github.com/angular/angular-cdk` |

#### 1.3 Big Picture Analysis

When the scope is **Big Picture**:

1. **Fetch `package.json`** — use GitHub_Fetcher to fetch `package.json` from the repository root at the resolved ref (`GET https://api.github.com/repos/{owner}/{repo}/contents/package.json?ref={ref}`). Identify entry points from the `main`, `module`, and `exports` fields. If the fetch fails, halt analysis, report the HTTP status or error reason to the user, and offer the option to retry or abort the session.
2. **Enumerate export paths** — if `package.json` contains an `exports` field, enumerate all named export paths. For each path, strip the file extension and attempt to fetch the `.ts` source file at the same relative path within the repository. Prefer `.ts` over `.d.ts`. If no `.ts` file resolves for a path, note the unresolvable path in the analysis artifact and continue. Only fall back to `.d.ts` files when no `.ts` files exist anywhere in the repository.
3. Categorize exported symbols into logical groups (e.g., components, directives, services, utilities, types)
4. Identify the main entry points and public API surface
5. Identify any peer dependencies listed in `package.json`
6. **Fetch `README.md`** — fetch the repository's `README.md` from the root at the resolved ref and include its content as a documentation source.
7. **Fetch changelog** — fetch `CHANGELOG.md` or `CHANGELOG` from the repository root. Extract the entry for the targeted version. If the targeted version entry is absent, note this in the artifact and include the most recent changelog entry instead.
8. **Record sources** — for each file fetched, record its GitHub permalink URL in `session.json` under `sources` in the form `https://github.com/{owner}/{repo}/blob/{commit-sha}/{path}`.
9. Save the result as **`big-picture.md`** in the session directory

`big-picture.md` must include:
- Library name and version
- GitHub repository URL and resolved ref
- A note that the analysis was sourced from GitHub rather than node_modules
- Entry points and their purposes
- Exported symbols organized by category
- Public API surface summary
- Peer dependencies (if any)

#### 1.4 Deep Dive Analysis

When the scope is **Deep Dive**:

**Prior session lookup:** Search `.kiro/research/sessions/` for any session whose `session.json` has:
- `libraries` containing the same library name
- `state` equal to `"FINALIZED"`

If a prior FINALIZED session is found:
- Load its `session.json`, `big-picture.md` (if present), and `findings-summary.md` (if present) as context for the current analysis
- Record the prior session's `id` in the new session's `session.json` under `priorSessionId`

If no prior FINALIZED session exists for the library, proceed without prior context and note this in the session. This is not an error.

**File identification via GitHub_Fetcher:**

1. **Fetch directory tree** — fetch the repository directory tree at the resolved ref (`GET https://api.github.com/repos/{owner}/{repo}/git/trees/{ref}?recursive=1`).
2. **Match files** — identify relevant files using the following signals in priority order (a file is included if it satisfies at least one signal):
   - (1) Directory name matches the focus area in kebab-case
   - (2) File name matches the focus area in kebab-case
   - (3) Export symbol names within the file match the focus area
3. **Sub-package entry points** — if the focus area corresponds to a named sub-package entry point (e.g., `@angular/cdk/a11y`), fetch all source files under the corresponding directory.
4. **No files found** — if no files are identified after applying all signals, notify the user, display the directory tree fetched, and prompt the user to refine the focus area or provide explicit file paths before proceeding.
5. **Fetch file contents** — fetch the full content of each identified file. If GitHub_Fetcher fails to fetch an identified file, note the failure and the affected file path in the analysis artifact and continue with the remaining files.

**Analysis generation:** Generate a Deep Dive analysis focused exclusively on the named focus area using the fetched source files. The analysis must cover:
- Internal mechanics of the focus area (how it works under the hood)
- Relevant exported symbols scoped to the focus area
- Edge cases and known gotchas
- Integration patterns and recommended usage
- Undocumented behaviors found by reading the fetched GitHub source files

Save the result as **`deep-dive-[focus-area].md`** in the session directory, where `[focus-area]` is the focus area name converted to kebab-case (e.g., focus area `"grid pattern"` → `deep-dive-grid-pattern.md`).

`deep-dive-[focus-area].md` must include:
- GitHub repository URL and resolved ref
- A note that the analysis was sourced from GitHub rather than node_modules
- Inline code references citing GitHub permalink URLs (in the form `https://github.com/{owner}/{repo}/blob/{commit-sha}/{path}`) for each referenced code block

#### 1.4.1 Fallback Strategy

Apply this decision tree whenever a GitHub fetch fails or returns insufficient data:

**Partial failure (one or more files not fetched):**
- Note the missing file path and the failure reason in the analysis artifact
- Continue analysis with the files that were successfully fetched

**Total failure (no files fetched at all):**
- Offer the user a node_modules fallback:
  > GitHub sources are unavailable. Would you like to fall back to reading from `node_modules`?
- If the user accepts: read the required files from `node_modules`, note in the artifact that node_modules was used as a fallback source for those files
- If the user declines: note in the artifact that the step is incomplete due to GitHub source failure and continue to the next step

**Rate limit handling:**
- After each GitHub API request, check the `X-RateLimit-Remaining` response header
- When `X-RateLimit-Remaining` reaches 0, display the reset time from `X-RateLimit-Reset` to the user and block all further GitHub fetch operations until either the rate limit resets or the user provides a `GITHUB_TOKEN`

**GITHUB_TOKEN support:**
- If a `GITHUB_TOKEN` environment variable is set, include it as `Authorization: Bearer {token}` on every GitHub API request
- This raises the rate limit from 60 to 5,000 requests/hour

**sourceStrategy field:**
At the end of the EXPLORE step, write the `sourceStrategy` field to `session.json` based on which sources were actually used:

| Condition | `sourceStrategy` value |
|---|---|
| All files fetched from GitHub | `"github"` |
| Mix of GitHub + node_modules | `"github-with-fallback"` |
| All files from node_modules | `"node_modules"` |

When `sourceStrategy` is `"github-with-fallback"`, also write the node_modules file paths to `session.json` under `fallbackSources`.

#### 1.5 Completing the EXPLORE Step

When the analysis artifact has been saved:

1. **Big Picture sessions:** Update `session.json` `state` to `"SYNTHESIZE"`. Inform the user that the session is moving directly to the SYNTHESIZE step (no prototype phase for Big Picture).
2. **Deep Dive sessions:** Present a summary of what was found, then ask the user whether they want to build prototypes or proceed directly to SYNTHESIZE:
   > The analysis is complete. Would you like to build prototypes to validate your findings, or proceed directly to synthesizing the results?
   - If the user wants to prototype: update `session.json` `state` to `"PROTOTYPE"` and continue to Step 2.
   - If the user wants to skip prototyping: update `session.json` `state` to `"SYNTHESIZE"` and continue to Step 3. This is appropriate when the goal has already been answered by the analysis alone.

### Step 2: PROTOTYPE *(Deep Dive sessions only, optional)*

The PROTOTYPE step turns analysis into working code. **This step only applies to Deep Dive sessions and is optional** — if the session goal was answered by the analysis alone, the user can skip directly to SYNTHESIZE. When prototyping is chosen, the user builds one or more minimal, runnable examples scoped to the session's focus. Multiple prototypes can be created before advancing to SYNTHESIZE.

#### 2.1 Suggesting Prototype Ideas (Deep Dive sessions only)

When the session scope is **Deep Dive**, do not immediately ask the user what to prototype. First, derive 3–5 prototype ideas from the Deep Dive analysis and present them as suggestions. Base the suggestions on:

- Patterns and integration scenarios identified in the analysis
- Edge cases or gotchas documented in the Deep Dive artifact
- Exported symbols that are central to the focus area
- Any undocumented behaviors worth validating with code

Present the suggestions as a numbered list, for example:

> Here are some prototype ideas based on the Deep Dive analysis of [focus area]:
>
> 1. **Basic usage** — minimal example showing the core API in action
> 2. **Edge case: [specific gotcha]** — demonstrates the behavior described in the analysis
> 3. **Integration pattern: [pattern name]** — shows how to combine [symbol A] with [symbol B]
> 4. **[Another pattern]** — validates the recommended usage approach
> 5. **[Advanced scenario]** — explores a less-documented behavior found in source code
>
> Which would you like to prototype first, or describe your own use case?

For **Big Picture** sessions, skip the suggestions and go directly to prompting the user (section 2.2).

#### 2.2 Prompting for a Pattern or Use Case

After presenting suggestions (Deep Dive) or directly (Big Picture), ask the user:

> What pattern or use case would you like to prototype?

Accept any description the user provides — a feature name, a scenario, a specific API call, or a reference to one of the suggested ideas. Use this description to determine what the prototype should demonstrate.

#### 2.3 Generating the Prototype

When the user provides a use case, generate a minimal, runnable code example demonstrating that pattern. Follow these example generation rules:

- **Absolute minimum code** — include only what is needed to demonstrate the pattern; no scaffolding, no boilerplate beyond what the library requires
- **No extra features** — do not add error handling, logging, or abstractions that are not part of the pattern being demonstrated
- **Inline templates where applicable** — for component-based libraries, keep templates inline rather than in separate files
- **Clear comments** — add a short comment on each non-obvious line explaining what it does and why
- **Runnable as-is** — the example must work without modification; include any necessary imports and any minimal setup the library requires

#### 2.4 Saving the Prototype

Every prototype is placed in **`libs/prototype-playground/src/lib/`** as a standalone Angular component, not just a loose file in the session directory. Follow this structure:

```
libs/prototype-playground/src/lib/[session-id]-[descriptive-kebab-case-name]/
├── [name].component.ts       ← standalone Angular component
└── [name].component.stories.ts  ← Storybook Story
```

**Filename rules:**
- Prefix the folder with the session id to avoid collisions (e.g., `rxjs-operators-deep-dive-switchmap-cancellation/`)
- Use kebab-case throughout
- The component must be standalone and self-contained

**Storybook Story requirements:**
- Every prototype component MUST have a corresponding `.stories.ts` file
- Export at least one `Default` story that renders the component with no required inputs
- Add a `title` following the pattern `Research/[SessionId]/[PatternName]`
- Example:

```ts
import type { Meta, StoryObj } from '@storybook/angular';
import { SwitchmapCancellationComponent } from './switchmap-cancellation.component';

const meta: Meta<SwitchmapCancellationComponent> = {
  title: 'Research/rxjs-operators-deep-dive/SwitchmapCancellation',
  component: SwitchmapCancellationComponent,
};
export default meta;
type Story = StoryObj<SwitchmapCancellationComponent>;

export const Default: Story = {};
```

**Also** save a reference file in the session directory pointing to the playground location:

```
.kiro/research/sessions/[session-id]/prototypes/[descriptive-kebab-case-name].ref.md
```

The `.ref.md` file must contain the path to the component in `libs/prototype-playground` so the session artifacts remain traceable.

After saving, confirm the component and story paths to the user.

#### 2.4.1 Chrome DevTools Validation

After creating each prototype component and its story, validate it using `chrome-devtools-mcp`:

1. Start the Storybook dev server if not already running: `nx storybook prototype-playground`
2. Use `mcp_chrome_devtools_navigate_page` to open the story URL (e.g., `http://localhost:4400/?path=/story/research-[session-id]-[pattern-name]--default`)
3. Use `mcp_chrome_devtools_take_screenshot` to capture the rendered output — save the screenshot to `.kiro/research/sessions/[session-id]/devtools-reports/[prototype-name]-screenshot.png`
4. Use `mcp_chrome_devtools_list_console_messages` to collect all console output (errors, warnings, logs)
5. Use `mcp_chrome_devtools_list_network_requests` to check for failed network requests
6. Determine the overall result: **PASS** (component renders, no console errors, no failed requests) or **FAIL** (with specific details)

#### 2.4.2 Saving the DevTools Report

After validation, save a report to the session directory:

```
.kiro/research/sessions/[session-id]/devtools-reports/[prototype-name]-report.md
```

The report must follow this structure:

```markdown
# DevTools Report — [Prototype Name]

**Session:** [session-id]
**Story:** Research/[session-id]/[PatternName]
**Story URL:** http://localhost:4400/?path=/story/...
**Validated:** [YYYY-MM-DD]
**Result:** PASS | FAIL

## Screenshot

![Rendered output](./[prototype-name]-screenshot.png)

## Console Messages

| Level | Message |
|-------|---------|
| [error/warn/log] | [message text] |

*(or "No console messages" if empty)*

## Network Requests

| Status | URL |
|--------|-----|
| [status code] | [url] |

*(or "No network requests" if none)*

## Issues Found

*(List any errors, warnings, or unexpected behaviors. Omit section if result is PASS with no issues.)*

- [issue description]

## Notes

*(Optional: observations about rendering, layout, or behavior worth capturing.)*
```

After saving the report, tell the user the result and the report path.

If validation **fails**, fix the component before moving on to the next prototype. Re-run validation after the fix and append a "Fix Attempt" section to the existing report rather than creating a new file:

```markdown
## Fix Attempt [N] — [YYYY-MM-DD]

**Change made:** [brief description of the fix]
**Result:** PASS | FAIL

[Updated console messages / screenshot reference if re-captured]
```

#### 2.4.3 Lighthouse Audit

After the DevTools validation passes, run a Lighthouse audit on the story using `mcp_chrome_devtools_lighthouse_audit`:

1. Ensure the story is still open in the browser (navigate again if needed)
2. Call `mcp_chrome_devtools_lighthouse_audit` with `mode: "navigation"` and `device: "desktop"`, setting `outputDirPath` to `.kiro/research/sessions/[session-id]/devtools-reports/`
3. Append a `## Lighthouse` section to the existing `[prototype-name]-report.md`:

```markdown
## Lighthouse

**Device:** desktop
**Mode:** navigation

| Category | Score |
|----------|-------|
| Accessibility | [0–100] |
| Best Practices | [0–100] |
| SEO | [0–100] |

### Accessibility Failures

*(List any failing accessibility audits with their descriptions. Omit if no failures.)*

- **[audit-id]** — [description]

### Notable Warnings

*(List any non-failing audits worth attention. Omit if none.)*

- **[audit-id]** — [description]
```

Accessibility score below 90 is a **red flag** — note it prominently in the report and in the findings summary. Performance is excluded (Storybook dev server skews results).

#### 2.5 Multiple Prototypes

The user can create as many prototypes as needed before advancing. Each prototype follows the same generate-and-save flow (sections 2.2–2.4). There is no limit on the number of prototypes per session.

Continue prompting for additional prototypes until the user indicates they are done.

#### 2.6 Completing the PROTOTYPE Step

When the user indicates that prototyping is complete (e.g., "done", "move on", "synthesize", or issues the `synthesize` command):

1. Update `session.json` `state` to `"SYNTHESIZE"`
2. Present a numbered list of all prototype components created during this session:

   > Prototyping complete. Here are the prototypes created:
   >
   > 1. `libs/prototype-playground/src/lib/[session-id]-basic-observable/` (story: `Research/[session-id]/BasicObservable`)
   > 2. `libs/prototype-playground/src/lib/[session-id]-switchmap-cancellation/` (story: `Research/[session-id]/SwitchmapCancellation`)
   >
   > Moving to the SYNTHESIZE step.

3. Inform the user that the session is now in the SYNTHESIZE step

### Step 3: SYNTHESIZE

The SYNTHESIZE step consolidates everything learned during EXPLORE and PROTOTYPE into a single, reusable findings document. The output is `findings-summary.md` — a structured summary of the library's strengths, limitations, recommended patterns, and gotchas, with links to every artifact produced during the session.

#### 3.1 Generating the Findings Summary

When the SYNTHESIZE step begins, generate `findings-summary.md` by combining:

- The EXPLORE analysis artifact (`big-picture.md` for Big Picture sessions, `deep-dive-[focus-area].md` for Deep Dive sessions)
- All prototype files saved under `prototypes/` during the PROTOTYPE step *(Deep Dive sessions only — Big Picture sessions have no prototypes)*

The findings summary must include the following sections, in this order:

1. **Document metadata** — library name, installed version, session scope (`Big Picture` or `Deep Dive: [focus area]`), and research date (ISO format: `YYYY-MM-DD`)
2. **Key strengths** — what the library does well; capabilities that stood out during analysis and prototyping
3. **Known limitations** — constraints, rough edges, or missing features discovered during the session
4. **Recommended patterns** — the approaches and APIs that worked well and should be used in production code
5. **Gotchas to avoid** — specific behaviors, edge cases, or anti-patterns that caused confusion or produced unexpected results
6. **Session artifacts** — links to every artifact produced during the session:
   - The analysis file (`big-picture.md` or `deep-dive-[focus-area].md`)
   - Each prototype component under `libs/prototype-playground/src/lib/` *(Deep Dive sessions only)*
   - Each DevTools report under `devtools-reports/` *(Deep Dive sessions only)*

#### 3.2 Deep Dive Scoping

When the session scope is **Deep Dive**, apply the following additional rules:

**Header:** The document title must clearly state both the library name and the focus area. Use the format:

```
# [library-name] — [Focus Area] Deep Dive
```

For example: `# rxjs — Operators Deep Dive` or `# @angular/cdk — Grid Pattern Deep Dive`.

**Scope all content to the focus area:** Every section (strengths, limitations, patterns, gotchas) must be scoped to the focus area investigated. Do not include general library observations that fall outside the focus area.

#### 3.3 Prior Context Section (Deep Dive with Prior Session)

When the session scope is **Deep Dive** AND a `priorSessionId` is recorded in `session.json`, include a **"Prior Context"** section immediately after the document metadata and before the Key Strengths section. This section must contain:

- A brief summary of what was already known from the prior session (drawn from the prior session's `findings-summary.md`)
- A clear statement of what new insights this Deep Dive session added that were not present in the prior session

Format the section as:

```markdown
## Prior Context

**From prior session ([prior-session-id]):**
[Summary of what was already known — key findings, patterns, or limitations documented in the prior session's findings-summary.md]

**New insights from this session:**
[What this Deep Dive added — new patterns discovered, limitations uncovered, or prior findings refined]
```

If no `priorSessionId` is present in `session.json`, omit this section entirely.

#### 3.4 Saving the Findings Summary

Save the generated document as `findings-summary.md` in the session directory:

```
.kiro/research/sessions/[session-id]/findings-summary.md
```

#### 3.5 Review Loop

After saving, present the full contents of `findings-summary.md` to the user for review.

If the user requests changes:
1. Apply the requested changes to `findings-summary.md`
2. Present the updated document to the user
3. Repeat until the user approves

Do not advance to the FINALIZE step until the user explicitly approves the findings summary.

#### 3.6 Completing the SYNTHESIZE Step

When the user approves the findings summary:

1. Update `session.json` `state` to `"FINALIZE"`
2. Inform the user that the findings summary has been approved and the session is now in the FINALIZE step

### Step 4: FINALIZE

The FINALIZE step is the final step of the single library research workflow. It presents the completed findings to the user and asks whether to publish them to the wiki. The session is marked `"FINALIZED"` regardless of the user's publication decision.

#### 4.1 Presenting the Findings Summary

When the FINALIZE step begins, present the full contents of `findings-summary.md` to the user as a recap of what was learned during the session.

After presenting the summary, explain what will happen if the user chooses to publish to the wiki. Specifically, tell the user which pages will be created:

- **Entity page** — `wiki/entities/[library-name].md` (Big Picture) or `wiki/entities/[library]-[focus-area].md` (Deep Dive, unless a library entity page already exists) — documents the library or the scoped area as a reusable knowledge base entry
- **Concept pages** — `wiki/concepts/[pattern-name].md` — one page per significant pattern identified in `findings-summary.md`
- **Source page** — `wiki/sources/[library]-[scope]-[date].md` — documents this research session as a citable reference

Then ask the user:

> Would you like to publish these findings to the wiki?

#### 4.2 Decline Path — No Wiki Publication

If the user declines wiki publication:

1. Do **not** create any wiki pages
2. Update `session.json`:
   - Set `state` to `"FINALIZED"`
   - Add `finalizedAt` with the current date in ISO format (`YYYY-MM-DD`)
   - Add `wikiPages` as an empty array: `[]`
3. Proceed to the completion summary (section 4.6)

#### 4.3 Accept Path — Wiki Page Generation

If the user accepts wiki publication, generate the following wiki pages from the findings summary and prototype artifacts:

**Entity page**

Create one entity page following the `WIKI_SCHEMA.md` entity page template:

- **Big Picture sessions:** `wiki/entities/[library-name].md`
- **Deep Dive sessions:** `wiki/entities/[library]-[focus-area].md`, where `[focus-area]` is the kebab-cased focus area (e.g., `wiki/entities/rxjs-operators.md`)
  - **Exception:** If a library entity page (`wiki/entities/[library-name].md`) already exists, use that path instead of creating a scoped entity page. Update the existing page rather than creating a duplicate.

The entity page must include: library name, definition, key properties/capabilities, relationships to concepts, usage examples drawn from prototypes, and references to the source page.

**Concept pages**

For each significant pattern identified in `findings-summary.md` (under "Recommended patterns" and "Key strengths"), create one concept page:

- Path: `wiki/concepts/[pattern-name].md`, where `[pattern-name]` is the pattern name in kebab-case
- Follow the `WIKI_SCHEMA.md` concept page template
- Each concept page must include: explanation of the pattern, applications and use cases, related concepts, code examples drawn from the relevant prototype(s), and a reference back to the entity page and source page

Create one concept page per significant pattern. Do not create concept pages for minor observations or gotchas — only for patterns substantial enough to be reused independently.

**Source page**

Create one source page documenting this research session as a reference:

- Path: `wiki/sources/[library]-[scope]-[date].md`, where:
  - `[library]` is the library name in kebab-case
  - `[scope]` is either `big-picture` or the kebab-cased focus area (for Deep Dive)
  - `[date]` is the `finalizedAt` date in `YYYY-MM-DD` format
- Follow the `WIKI_SCHEMA.md` source summary template
- The source page must include: session metadata (library, version, scope, research date), key points from the findings summary, links to all session artifacts (analysis file, prototypes, findings-summary.md), and references to the entity and concept pages created

#### 4.4 Deep Dive Entity Page Scoping

When the session scope is **Deep Dive**, apply this rule when determining the entity page path:

1. Check whether `wiki/entities/[library-name].md` already exists
2. If it **does not exist**, create `wiki/entities/[library]-[focus-area].md` (scoped to the focus area)
3. If it **already exists**, use `wiki/entities/[library-name].md` as the entity page path — update the existing page with new information from this Deep Dive rather than creating a separate scoped page

This prevents fragmentation of library knowledge across multiple entity pages when a Big Picture session has already established the library entity.

#### 4.5 Wiki Page Creation Failure Handling

If any wiki page fails to write (e.g., path conflict, permission error, or any other I/O failure):

1. **Report per-page status** — tell the user which pages were created successfully and which failed, with the reason for each failure
2. **Record only successful paths** — add only the paths of successfully created pages to `wikiPages` in `session.json`
3. **Offer retry** — ask the user whether they want to retry the failed pages
   - If the user retries and a page succeeds, add its path to `wikiPages`
   - If the user declines retry or the retry fails again, leave the failed page out of `wikiPages`
4. **Still finalize** — regardless of whether all pages were created successfully, mark the session `"FINALIZED"` and proceed to the completion summary

Do not block finalization on wiki page failures. A partial wiki publication is a valid outcome.

#### 4.6 Finalizing the Session

After the wiki publication decision has been resolved (either declined or all accepted pages attempted):

1. Update `session.json` with the following fields:
   - `state`: `"FINALIZED"`
   - `finalizedAt`: current date in ISO format (`YYYY-MM-DD`)
   - `wikiPages`: array of paths of all successfully created wiki pages, or `[]` if none were created

2. **If any wiki pages were created**, regenerate the manifest and index by running both `wiki-cli` targets from the workspace root:
   ```bash
   npx nx run wiki-cli:generate-manifest
   npx nx run wiki-cli:generate-index
   ```
   These targets scan `wiki/entities/`, `wiki/concepts/`, and `wiki/sources/` and rewrite `wiki/manifest.json` and `wiki/index.md` from the actual files on disk. Always run them after wiki publication — the manually maintained index and manifest will otherwise be stale.

Example `session.json` finalization fields:

```jsonc
{
  "state": "FINALIZED",
  "finalizedAt": "2024-05-15",
  "wikiPages": [
    "wiki/entities/rxjs-operators.md",
    "wiki/concepts/switchmap-cancellation.md",
    "wiki/concepts/retry-with-backoff.md",
    "wiki/sources/rxjs-operators-2024-05-15.md"
  ]
}
```

If the user declined wiki publication:

```jsonc
{
  "state": "FINALIZED",
  "finalizedAt": "2024-05-15",
  "wikiPages": []
}
```

#### 4.7 Completion Summary

After updating `session.json`, display a completion summary listing every artifact generated during the entire session. Present the summary in this format:

> **Research session complete.**
>
> **Session:** `[session-id]`
> **Library:** `[library-name]` v`[version]`
> **Scope:** `[Big Picture | Deep Dive: focus-area]`
> **Finalized:** `[YYYY-MM-DD]`
>
> **Artifacts created:**
>
> Analysis:
> - `.kiro/research/sessions/[session-id]/[big-picture.md | deep-dive-[focus-area].md]`
>
> Prototypes: *(Deep Dive sessions only — omit this section for Big Picture)*
> - `libs/prototype-playground/src/lib/[session-id]-[prototype-1]/[prototype-1].component.ts`
> - `libs/prototype-playground/src/lib/[session-id]-[prototype-1]/[prototype-1].component.stories.ts`
> - *(list all prototypes)*
>
> DevTools reports: *(omit if no prototypes were validated)*
> - `.kiro/research/sessions/[session-id]/devtools-reports/[prototype-1]-report.md`
> - `.kiro/research/sessions/[session-id]/devtools-reports/[prototype-1]-screenshot.png`
> - *(list all reports)*
>
> Findings summary:
> - `.kiro/research/sessions/[session-id]/findings-summary.md`
>
> Wiki pages: *(omit this section if wikiPages is empty)*
> - `wiki/entities/[entity-page].md`
> - `wiki/concepts/[concept-page].md`
> - *(list all created wiki pages)*
> - `wiki/sources/[source-page].md`

If no wiki pages were created, omit the "Wiki pages" section from the summary entirely.

### session.json Schema

The `session.json` file is the single source of truth for session state. Every single library research session has exactly one `session.json` file, located at `.kiro/research/sessions/[session-id]/session.json`.

```jsonc
{
  // ── Required at creation (written at the start of the EXPLORE step) ──────────

  "id": "string",           // kebab-case session identifier, e.g. "rxjs-big-picture"
  "topic": "string",        // human-readable description of the research goal
  "state": "EXPLORE",       // current workflow state — see allowed values below
  "scope": "big-picture",   // research mode — see allowed values below
  "createdAt": "YYYY-MM-DD", // ISO date the session was created
  "libraries": ["string"],  // MUST contain exactly one entry for single library sessions
  "version": "string",      // installed library version, e.g. "7.8.1"
  "sources": ["string"],    // GitHub permalink URLs for every file fetched during the session
                            // Form: https://github.com/{owner}/{repo}/blob/{commit-sha}/{path}
                            // Documentation URLs (official docs, changelogs) are also included

  // ── New GitHub fields (added by this feature) ─────────────────────────────────

  "repositoryUrl": "string",
  // The canonical GitHub repository URL.
  // Form: https://github.com/{owner}/{repo}
  // HTTPS scheme, no trailing slash, no .git suffix.
  // Written by GitHub_Resolver before the EXPLORE step generates any artifact.
  // Example: "https://github.com/ReactiveX/rxjs"

  "githubRef": "string",
  // The resolved Git ref used for all file fetches in this session.
  // One of: full 40-character commit SHA, tag name, or branch name.
  // Written by Version/Branch Targeting before the EXPLORE step generates any artifact.
  // Examples: "7.8.1", "main", "a3f9c2d1b8e4f7a0c6d2e5b9f1a4c7d0e3b6f9a2"

  "sourceStrategy": "github",
  // Describes which sources were used for file fetches in this session.
  // Allowed values: "github" | "github-with-fallback" | "node_modules"
  // Written at the end of the EXPLORE step once all fetches are complete.

  "fallbackSources": ["string"],
  // Present only when sourceStrategy is "github-with-fallback".
  // Lists the node_modules file paths that were used as fallback sources.
  // Absent when sourceStrategy is "github" or "node_modules".

  // ── Conditional: Deep Dive sessions only ─────────────────────────────────────
  // Present when scope is "deep-dive". MUST NOT be present for "big-picture" sessions.

  "focusArea": "string",    // the specific area being investigated, e.g. "grid pattern"
  "goal": "string",         // what the user wants to achieve or learn, e.g. "decide if suitable for our use case"

  // ── Conditional: prior session found (Deep Dive only) ────────────────────────
  // Present when a prior FINALIZED session exists for the same library.
  // Absent when no prior FINALIZED session was found.

  "priorSessionId": "string", // id of the prior FINALIZED session used as context

  // ── Pause fields (added when session is paused) ───────────────────────────────
  // Both fields are added together when the user issues `pause research`.
  // Both fields are removed when the session is resumed.

  "pausedAt": "YYYY-MM-DD",  // ISO date the session was paused
  "resumeFrom": "EXPLORE",   // the step to return to on resume — same allowed values as state
                              // (excluding "PAUSED" and "FINALIZED")

  // ── Finalization fields (added when session reaches FINALIZED) ────────────────
  // Both fields are added together when the wiki publication decision is resolved.

  "finalizedAt": "YYYY-MM-DD", // ISO date the session was finalized
  "wikiPages": ["string"]      // paths of all created wiki pages; [] if user declined publication
}
```

**`sources` field change:** Previously contained `node_modules` paths and documentation URLs. After this feature, it contains GitHub permalink URLs for every file fetched during the session, in the form:
```
https://github.com/{owner}/{repo}/blob/{commit-sha}/{path}
```
Documentation URLs (official docs, changelogs) continue to be included alongside file permalinks.

**`fallbackSources` field:** Only present when `sourceStrategy` is `"github-with-fallback"`. Lists the local paths of files read from `node_modules` during the session. Example:
```jsonc
"fallbackSources": [
  "node_modules/@angular/cdk/esm2022/a11y/a11y.mjs"
]
```

### Full session.json Example (Big Picture, GitHub sources)

```jsonc
{
  "id": "angular-cdk-big-picture",
  "topic": "Full API surface of @angular/cdk",
  "state": "SYNTHESIZE",
  "scope": "big-picture",
  "createdAt": "2025-01-15",
  "libraries": ["@angular/cdk"],
  "version": "19.2.0",
  "repositoryUrl": "https://github.com/angular/components",
  "githubRef": "19.2.0",
  "sourceStrategy": "github",
  "sources": [
    "https://github.com/angular/components/blob/a3f9c2d1b8e4f7a0c6d2e5b9f1a4c7d0e3b6f9a2/src/cdk/package.json",
    "https://github.com/angular/components/blob/a3f9c2d1b8e4f7a0c6d2e5b9f1a4c7d0e3b6f9a2/src/cdk/README.md",
    "https://angular.dev/cdk"
  ]
}
```

### Full session.json Example (Deep Dive, partial fallback)

```jsonc
{
  "id": "angular-cdk-a11y-deep-dive",
  "topic": "Accessibility utilities in @angular/cdk/a11y",
  "state": "EXPLORE",
  "scope": "deep-dive",
  "focusArea": "a11y",
  "goal": "Understand FocusTrap and LiveAnnouncer APIs",
  "createdAt": "2025-01-16",
  "libraries": ["@angular/cdk"],
  "version": "19.2.0",
  "repositoryUrl": "https://github.com/angular/components",
  "githubRef": "a3f9c2d1b8e4f7a0c6d2e5b9f1a4c7d0e3b6f9a2",
  "sourceStrategy": "github-with-fallback",
  "sources": [
    "https://github.com/angular/components/blob/a3f9c2d1b8e4f7a0c6d2e5b9f1a4c7d0e3b6f9a2/src/cdk/a11y/focus-trap/focus-trap.ts",
    "https://github.com/angular/components/blob/a3f9c2d1b8e4f7a0c6d2e5b9f1a4c7d0e3b6f9a2/src/cdk/a11y/live-announcer/live-announcer.ts"
  ],
  "fallbackSources": [
    "node_modules/@angular/cdk/a11y/index.d.ts"
  ]
}
```

**`state` allowed values** — no other values are valid:

| Value | Meaning |
|---|---|
| `"EXPLORE"` | Library installation and analysis in progress |
| `"PROTOTYPE"` | Building minimal working examples |
| `"SYNTHESIZE"` | Consolidating findings into `findings-summary.md` |
| `"FINALIZE"` | Awaiting wiki publication decision |
| `"PAUSED"` | Session paused; `resumeFrom` records which step to return to |
| `"FINALIZED"` | Session complete; `finalizedAt` and `wikiPages` are present |

**`scope` allowed values** — no other values are valid:

| Value | Meaning |
|---|---|
| `"big-picture"` | Full library overview: entry points, exported symbols, public API surface, peer dependencies |
| `"deep-dive"` | Focused analysis of a specific library area named in `focusArea` |

**`libraries` constraint:** The array MUST contain exactly one entry for single library research sessions. Multi-library comparison sessions use a different workflow and are not governed by this schema.

**`resumeFrom` allowed values:** Same as `state`, excluding `"PAUSED"` and `"FINALIZED"` — i.e., one of `"EXPLORE"`, `"PROTOTYPE"`, `"SYNTHESIZE"`, or `"FINALIZE"`.

### Session Directory Structure

Every single library research session lives under `.kiro/research/sessions/[session-id]/`. The files present depend on the session scope chosen at the EXPLORE step.

#### Big Picture Layout

```
.kiro/research/sessions/[session-id]/
├── session.json
├── big-picture.md
└── findings-summary.md
```

#### Deep Dive Layout

```
.kiro/research/sessions/[session-id]/
├── session.json
├── deep-dive-[focus-area].md
├── findings-summary.md
├── prototypes/           ← optional; only present if user chose to prototype
│   ├── [descriptive-name].ref.md
│   └── ...
└── devtools-reports/     ← one report + screenshot per prototype validated
    ├── [prototype-name]-report.md
    ├── [prototype-name]-screenshot.png
    └── ...
```

#### Naming Rules

| Element | Rule | Examples |
|---|---|---|
| `[session-id]` | kebab-case | `rxjs-big-picture`, `rxjs-operators-deep-dive` |
| `deep-dive-[focus-area].md` | focus area converted to kebab-case | `deep-dive-grid-pattern.md`, `deep-dive-form-validation.md` |
| Prototype filenames | descriptive, kebab-case | `basic-observable.ts`, `switchmap-cancellation.ts` |

### Commands

All commands for the single library workflow are issued to `#research-buddy`. The primary entry point is `research` — the assistant will ask the right questions to determine library, scope, focus area, and goal.

| Command | Effect |
|---|---|
| `research` | Start a new session — triggers interactive questionnaire |
| `synthesize` | Signals prototyping is complete, triggers SYNTHESIZE step |
| `finalize research` | Triggers the wiki publication decision in the FINALIZE step |
| `pause research` | Pauses the session; saves all artifacts and records `resumeFrom` in `session.json` |
| `continue research: [session-id]` | Resumes a paused session, returning to the step recorded in `resumeFrom` |

### Pause and Resume

#### Pausing a Session

The `pause research` command can be issued at any active step. For **Big Picture** sessions the valid steps are EXPLORE, SYNTHESIZE, and FINALIZE. For **Deep Dive** sessions the valid steps are EXPLORE, PROTOTYPE, SYNTHESIZE, and FINALIZE. When the user issues this command:

1. **Confirm artifacts are saved** — all current artifacts must be persisted to the session directory on disk. Nothing should exist only in memory. This includes:
   - The analysis artifact (`big-picture.md` or `deep-dive-[focus-area].md`) if the EXPLORE step has produced one
   - Any prototype files under `prototypes/` created so far
   - `findings-summary.md` if the SYNTHESIZE step has produced one
2. **Update `session.json`** with the following changes:
   - Set `state` to `"PAUSED"`
   - Add `pausedAt` with the current date in ISO format (`YYYY-MM-DD`)
   - Add `resumeFrom` with the name of the step that was active at the time of pause — one of `"EXPLORE"`, `"PROTOTYPE"`, `"SYNTHESIZE"`, or `"FINALIZE"`

Example `session.json` after pausing during the PROTOTYPE step:

```jsonc
{
  "id": "rxjs-operators-deep-dive",
  "state": "PAUSED",
  "pausedAt": "2024-05-10",
  "resumeFrom": "PROTOTYPE"
  // ... other fields unchanged
}
```

#### Resuming a Session

When the user issues `continue research: [session-id]`:

1. **Read `session.json`** from `.kiro/research/sessions/[session-id]/session.json`. Confirm the session exists and that `state` is `"PAUSED"`.

2. **Restore session context** by loading all artifacts present in the session directory:
   - `session.json` — session metadata, scope, library, focus area (if Deep Dive)
   - The analysis artifact — `big-picture.md` (Big Picture) or `deep-dive-[focus-area].md` (Deep Dive), if present
   - All prototype files under `prototypes/`, if any exist
   - `findings-summary.md`, if present

3. **Verify the library is still installed** — check that the library named in `session.json` (`libraries[0]`) exists in `node_modules`.

   - **If the library is present:** proceed to the resume summary (step 4).
   - **If the library is missing:** offer to reinstall it before continuing:
     > The library `[library]` is no longer present in `node_modules`. Would you like to reinstall it (`npm install [library]`) before continuing, or proceed without it?
     
     Do **not** change `session.json` state until the user confirms. If the user confirms reinstall, run `npm install [library]` and then proceed. If the user chooses to continue without reinstalling, proceed with a note that the library is unavailable.

4. **Display a resume summary** showing the current state of the session:

   > **Resuming session `[session-id]`**
   >
   > **Library:** `[library-name]` v`[version]`
   > **Scope:** `[Big Picture | Deep Dive: focus-area]`
   > **Paused at:** `[pausedAt date]`
   > **Resuming from:** `[resumeFrom step]`
   >
   > **Completed steps:**
   > - EXPLORE ✓ *(if analysis artifact exists)*
   > - PROTOTYPE ✓ *(if any prototypes exist and state was past PROTOTYPE)*
   > - SYNTHESIZE ✓ *(if findings-summary.md exists and state was past SYNTHESIZE)*
   >
   > **Artifacts created so far:**
   > - `[analysis artifact path]` *(if present)*
   > - `prototypes/[name].[ext]` *(one line per prototype, if any)*
   > - `findings-summary.md` *(if present)*

5. **Update `session.json`** to restore the active state:
   - Remove `pausedAt`
   - Remove `resumeFrom`
   - Set `state` to the value that was stored in `resumeFrom` (e.g., if `resumeFrom` was `"PROTOTYPE"`, set `state` to `"PROTOTYPE"`)

6. **Continue from the restored step** — pick up exactly where the session left off. For example, if `resumeFrom` was `"PROTOTYPE"`, resume the PROTOTYPE step by prompting the user for the next prototype (or suggesting ideas if the session scope is Deep Dive and no prototypes exist yet).
