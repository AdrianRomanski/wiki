# Library Research & Comparison Project

## Project Context

This is a research-phase project for exploring, comparing, and prototyping with any library or framework. The goal is to learn through hands-on experimentation, make informed decisions through structured comparison, and document findings before formal spec-driven development.

## Research Methodology

### Core Research Principles

1. **Evidence-Based Research** - Always verify against official docs AND actual source code in node_modules
2. **Prototype First** - Build minimal, focused examples to understand library behavior
3. **Structured Comparison** - Use quantitative metrics (complexity, modularity, bundle size, token usage)
4. **Document Findings** - Capture insights, patterns, and decisions as you learn
5. **Limit Scope** - Compare maximum 3 libraries to avoid analysis paralysis
6. **Session Management** - Use research sessions to track progress and maintain context

### Documentation Sources Priority

When researching any library:

1. **Official Online Docs** - Search for latest API documentation and guides
2. **Source Code** - Check `node_modules/[library]` for actual implementation
3. **Type Definitions** - Review `.d.ts` files for API signatures and available options
4. **Examples in Code** - Look for usage patterns in the installed package
5. **Community Resources** - GitHub issues, Stack Overflow, blog posts

**Why Multiple Sources?** Online docs explain concepts, but node_modules shows the exact version we're using and reveals implementation details not always documented.

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

- `apps/deep-dive-angular-aria` - Main demo application (currently focused on Angular Aria)
- `libs/feat-seat-selection` - Feature library examples
- `.kiro/research/` - Research sessions and ADRs
- `.kiro/skills/` - Research workflow and assistant skills

## Key Research Principles

### Evidence-Based
- Read actual code from node_modules
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

Invoke `#research-buddy` for specialized research assistance:

### Session Management
- `start research: [topic]` - Begin new research session
- `continue research: [session-id]` - Resume paused session
- `pause research` - Save current state
- `finalize research` - Complete and generate ADR

### Analysis
- `compare [lib1] vs [lib2] vs [lib3]` - Multi-library comparison
- `visualize [library]` - Show structure and exports
- `analyze complexity of [library]` - Complexity scoring
- `analyze modularity of [library]` - Modularity assessment
- `estimate token usage for [library]` - AI assistance cost

### Examples & Reports
- `show minimal example of [pattern]` - Generate minimal code
- `pros and cons of [library]` - Structured analysis
- `generate comparison report` - Create comparison matrices
- `generate final report` - Complete research summary
- `generate ADR` - Architecture Decision Record

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
