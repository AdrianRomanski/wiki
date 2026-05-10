---
name: Research Prototype Workflow
description: Workflow for rapid prototyping, library comparison, and research session management
tags: [research, prototype, learning, workflow, comparison, session-management]
---

# Research Prototype Workflow

## Research Session Lifecycle

### Session States
1. **START** - Initialize new research session
2. **RESEARCH** - Explore and analyze libraries
3. **PROTOTYPE** - Build minimal examples
4. **COMPARE** - Generate comparison reports
5. **PAUSE** - Save state for later
6. **CONTINUE** - Resume paused session
7. **FINALIZE** - Complete research and generate ADR

### Session Directory Structure
```
.kiro/research/
  ├── sessions/
  │   └── [session-id]-[YYYY-MM-DD]/
  │       ├── session.json              # Session metadata
  │       ├── libraries/                 # Per-library analysis
  │       │   ├── [library-1]/
  │       │   │   ├── analysis.md       # Complexity & modularity analysis
  │       │   │   ├── examples/         # Minimal code examples
  │       │   │   │   ├── basic.ts
  │       │   │   │   └── advanced.ts
  │       │   │   ├── metrics.json      # Quantitative metrics
  │       │   │   └── findings.md       # Research notes
  │       │   ├── [library-2]/
  │       │   └── [library-3]/          # Max 3 libraries
  │       ├── comparison-report.md      # Initial comparison (after Phase 2)
  │       ├── prototypes/               # Working prototypes
  │       │   ├── [library-1]-demo/
  │       │   ├── [library-2]-demo/
  │       │   └── [library-3]-demo/
  │       ├── final-report.md           # Final report (on finalize)
  │       └── decision.adr.md           # ADR (on finalize)
  └── adrs/
      └── [YYYY-MM-DD]-[decision-title].md  # Archived ADRs
```

## Phase 1: Start Research Session

### Initialize Session
```bash
# User command: "Start research: [topic]"
# Example: "Start research: comparing focus trap libraries"
```

**Actions:**
1. Create session directory with unique ID and timestamp
2. Create session.json with metadata:
```json
{
  "sessionId": "focus-trap-comparison-2024-01-15",
  "topic": "Comparing focus trap libraries",
  "startDate": "2024-01-15T10:30:00Z",
  "status": "active",
  "libraries": [],
  "currentPhase": "research",
  "model": "Claude Sonnet 4.5",
  "tokenBudget": 50000,
  "tokensUsed": 0
}
```
3. Ask user which libraries to compare (max 3)
4. Create library subdirectories

### Library Selection
**Prompt user:**
```
Which libraries would you like to compare? (Maximum 3)
1. [Library name]
2. [Library name]
3. [Library name]

Or provide your own list.
```

## Phase 2: Research & Analyze

### For Each Library (Max 3)

#### Step 1: Structure Analysis
- Map directory structure from node_modules
- Identify entry points and exports
- Document public API surface
- Create `libraries/[lib]/analysis.md`

#### Step 2: Complexity Analysis
Evaluate and score (1-10):
- Implementation complexity
- Cognitive load
- Boilerplate requirements
- Learning curve
- Edge cases

Document in `libraries/[lib]/metrics.json`:
```json
{
  "library": "@angular/cdk/a11y",
  "version": "17.0.0",
  "complexity": {
    "implementation": 5,
    "cognitiveLoad": 6,
    "boilerplate": 4,
    "learningCurve": 6,
    "edgeCases": 7,
    "overall": 5.6
  },
  "modularity": {
    "codeOrganization": 8,
    "separationOfConcerns": 9,
    "reusability": 8,
    "extensibility": 8,
    "overall": 8.25
  },
  "bundle": {
    "minSize": "45KB",
    "gzipped": "12KB",
    "treeshakeable": true
  },
  "tokenEstimate": {
    "setup": 2000,
    "implementation": 5000,
    "debugging": 3000,
    "total": 10000,
    "model": "GPT-4",
    "date": "2024-01-15"
  }
}
```

#### Step 3: Modularity Analysis
Evaluate and score (1-10):
- Code organization
- Separation of concerns
- Reusability
- Extensibility

Add to `metrics.json` (see above)

#### Step 4: Token Usage Estimation
Estimate AI assistance costs:
- Initial setup tokens
- Feature implementation tokens
- Debugging/troubleshooting tokens
- Total estimated tokens
- Model used for estimate
- Date of estimate (world changes quickly!)

#### Step 5: Documentation
Create `libraries/[lib]/findings.md`:
```markdown
# [Library Name] Research Findings

## Overview
[Brief description]

## Key Features
- Feature 1
- Feature 2

## Strengths
- Strength 1
- Strength 2

## Weaknesses
- Weakness 1
- Weakness 2

## Use Cases
- Use case 1
- Use case 2

## Gotchas
- Gotcha 1
- Gotcha 2

## Documentation Quality
[Assessment of docs]

## Community & Maintenance
- Last updated: [date]
- GitHub stars: [count]
- Open issues: [count]
- Active maintainers: [yes/no]
```

### Generate Initial Comparison Report

After analyzing all libraries, create `comparison-report.md`:

```markdown
# Library Comparison Report: [Topic]

**Date**: [YYYY-MM-DD]
**Session ID**: [session-id]
**Libraries**: [Lib A, Lib B, Lib C]
**Status**: Initial Research Complete

## Executive Summary
[2-3 sentences summarizing key findings]

## Comparison Matrices

### Complexity Comparison
| Dimension              | Lib A    | Lib B    | Lib C    | Winner |
|------------------------|----------|----------|----------|--------|
| Implementation         | 3/10     | 6/10     | 8/10     | Lib A  |
| Cognitive Load         | 4/10     | 5/10     | 7/10     | Lib A  |
| Boilerplate Required   | 3/10     | 5/10     | 6/10     | Lib A  |
| Learning Curve         | 4/10     | 6/10     | 8/10     | Lib A  |
| Edge Cases             | 5/10     | 7/10     | 8/10     | Lib A  |
| **Overall Complexity** | **3.8/10** | **5.8/10** | **7.4/10** | **Lib A** |

### Modularity Comparison
| Dimension              | Lib A    | Lib B    | Lib C    | Winner |
|------------------------|----------|----------|----------|--------|
| Code Organization      | 7/10     | 9/10     | 6/10     | Lib B  |
| Separation of Concerns | 7/10     | 9/10     | 6/10     | Lib B  |
| Reusability            | 8/10     | 9/10     | 7/10     | Lib B  |
| Extensibility          | 7/10     | 8/10     | 6/10     | Lib B  |
| **Overall Modularity** | **7.25/10** | **8.75/10** | **6.25/10** | **Lib B** |

### Bundle Impact
| Library | Min Size | Gzipped | Tree-shakeable | Winner |
|---------|----------|---------|----------------|--------|
| Lib A   | 45 KB    | 12 KB   | Yes            | ✓      |
| Lib B   | 120 KB   | 35 KB   | Partial        | -      |
| Lib C   | 80 KB    | 22 KB   | Yes            | -      |

### Token Usage Estimation
| Library | Setup  | Implementation | Debugging | Total  | Model  | Date       |
|---------|--------|----------------|-----------|--------|--------|------------|
| Lib A   | 2K     | 5K             | 3K        | 10K    | GPT-4  | 2024-01-15 |
| Lib B   | 4K     | 8K             | 5K        | 17K    | GPT-4  | 2024-01-15 |
| Lib C   | 3K     | 6K             | 4K        | 13K    | GPT-4  | 2024-01-15 |

*Note: Estimates may vary based on implementation complexity and model updates*

### Visual Comparison
```
Complexity (Lower is Better)
Lib A: ████░░░░░░ 3.8/10
Lib B: ██████░░░░ 5.8/10
Lib C: ███████░░░ 7.4/10

Modularity (Higher is Better)
Lib A: ███████░░░ 7.25/10
Lib B: █████████░ 8.75/10
Lib C: ██████░░░░ 6.25/10

Token Efficiency (Lower is Better)
Lib A: ██████░░░░ 10K tokens
Lib B: █████████░ 17K tokens
Lib C: ████████░░ 13K tokens
```

## Winner by Category
- **Simplest to Implement**: Lib A
- **Most Modular**: Lib B
- **Smallest Bundle**: Lib A
- **Most Token Efficient**: Lib A

## Key Findings
1. [Finding 1]
2. [Finding 2]
3. [Finding 3]

## Preliminary Recommendations
[Based on analysis so far]

## Next Steps
- [ ] Build prototypes with each library
- [ ] Test real-world scenarios
- [ ] Performance benchmarking
- [ ] Accessibility validation
```

## Phase 3: Prototype & Validate

### For Each Library

#### Step 1: Create Minimal Example
Create `libraries/[lib]/examples/basic.ts`:
```typescript
// MINIMAL EXAMPLE: [Library] - Basic Usage
// Purpose: Demonstrate core functionality with minimal code

import { Component } from '@angular/core';
// ... minimal imports

@Component({
  selector: 'app-basic-example',
  standalone: true,
  template: `
    <!-- Minimal template -->
  `
})
export class BasicExampleComponent {
  // Minimal implementation
}
```

#### Step 2: Create Working Prototype
Create `prototypes/[lib]-demo/` with runnable demo:
- Component files
- Minimal styling
- README with setup instructions
- Test with keyboard navigation
- Validate accessibility

#### Step 3: Document Prototype Findings
Update `libraries/[lib]/findings.md`:
```markdown
## Prototype Results

### What Worked Well
- [Success 1]
- [Success 2]

### Challenges Encountered
- [Challenge 1]
- [Challenge 2]

### Performance Observations
- [Observation 1]
- [Observation 2]

### Accessibility Testing
- Keyboard navigation: [Pass/Fail]
- Screen reader: [Pass/Fail]
- ARIA compliance: [Pass/Fail]

### Developer Experience
- Setup time: [X minutes]
- Implementation time: [X minutes]
- Debugging time: [X minutes]
- Overall DX: [Good/Fair/Poor]
```

## Phase 4: Pause (Optional)

### Save Session State
Update `session.json`:
```json
{
  "status": "paused",
  "pausedDate": "2024-01-15T15:30:00Z",
  "currentPhase": "prototype",
  "completedLibraries": ["lib-a", "lib-b"],
  "remainingLibraries": ["lib-c"],
  "tokensUsed": 15000
}
```

### Resume Command
```bash
# User: "Continue research: [session-id]"
# Example: "Continue research: focus-trap-comparison-2024-01-15"
```

**Actions:**
1. Read session.json
2. Load current state
3. Resume from last phase
4. Continue where left off

## Phase 5: Finalize Research

### Generate Final Report

Create `final-report.md`:
```markdown
# Final Research Report: [Topic]

**Date**: [YYYY-MM-DD]
**Session ID**: [session-id]
**Duration**: [X days]
**Decision**: [Chosen Library]

## Research Journey

### Timeline
- **Day 1**: Initial research and analysis
- **Day 2**: Prototyping and testing
- **Day 3**: Comparison and decision

### Libraries Evaluated
1. [Library A] - [Brief summary]
2. [Library B] - [Brief summary]
3. [Library C] - [Brief summary]

## Final Comparison

[Include all comparison matrices from initial report]

## Prototype Results

### [Library A]
- **Setup Time**: X minutes
- **Implementation Time**: X minutes
- **Key Strengths**: [List]
- **Key Weaknesses**: [List]

[Repeat for B and C]

## Decision Rationale

### Why [Chosen Library]?
[Detailed explanation of decision]

### Trade-offs Accepted
- [Trade-off 1]
- [Trade-off 2]

### Alternatives Considered
- **[Library B]**: Rejected because [reason]
- **[Library C]**: Rejected because [reason]

## Implementation Plan

### Phase 1: Setup
- [ ] Install dependencies
- [ ] Configure build
- [ ] Setup testing

### Phase 2: Core Implementation
- [ ] Implement feature X
- [ ] Implement feature Y

### Phase 3: Polish
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Documentation

## Lessons Learned

### Technical Insights
1. [Insight 1]
2. [Insight 2]

### Process Insights
1. [Insight 1]
2. [Insight 2]

## Token Usage Summary
- **Total Tokens Used**: [X]
- **Model**: [Model name]
- **Estimated Implementation Tokens**: [Y]
- **Total Project Token Budget**: [X + Y]

## References
- [Library A Documentation](url)
- [Library B Documentation](url)
- [Library C Documentation](url)
- [Research Session](path/to/session)
- [Prototypes](path/to/prototypes)

## Metadata
- **Research Duration**: [X days]
- **Libraries Evaluated**: 3
- **Prototypes Created**: 3
- **Model Used**: [Model name]
- **Total Tokens**: [X]
- **Decision Confidence**: [High/Medium/Low]
```

### Generate ADR

Create `decision.adr.md` and copy to `.kiro/research/adrs/`:

```markdown
# ADR-[NUMBER]: [Decision Title]

**Date**: [YYYY-MM-DD]
**Status**: Accepted
**Context**: Research Session [session-id]
**Deciders**: [Names/Roles]

## Context and Problem Statement

[What problem are we solving?]
[Why did we need to research this?]
[What constraints do we have?]

## Decision Drivers

- **Complexity**: Prefer simpler implementation
- **Modularity**: Need good code organization
- **Bundle Size**: Minimize application size
- **Token Efficiency**: Optimize AI assistance costs
- **Accessibility**: Must meet WCAG standards
- **Maintainability**: Active community support
- [Additional drivers specific to your context]

## Considered Options

### Option 1: [Library A]
**Pros**:
- [Pro 1]
- [Pro 2]

**Cons**:
- [Con 1]
- [Con 2]

### Option 2: [Library B]
[Same structure]

### Option 3: [Library C]
[Same structure]

## Decision Outcome

**Chosen option**: [Library X]

### Rationale
[Detailed explanation of why this library was chosen]

Key factors:
1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

### Consequences

**Positive**:
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

**Negative**:
- [Trade-off 1]
- [Trade-off 2]

**Neutral**:
- [Consideration 1]
- [Consideration 2]

## Comparison Summary

### Quantitative Comparison
| Criterion         | Lib A  | Lib B  | Lib C  | Winner |
|-------------------|--------|--------|--------|--------|
| Complexity        | 3.8/10 | 5.8/10 | 7.4/10 | Lib A  |
| Modularity        | 7.3/10 | 8.8/10 | 6.3/10 | Lib B  |
| Bundle (gzipped)  | 12KB   | 35KB   | 22KB   | Lib A  |
| Token Estimate    | 10K    | 17K    | 13K    | Lib A  |
| Setup Time        | 15min  | 30min  | 20min  | Lib A  |
| Learning Curve    | 4/10   | 6/10   | 8/10   | Lib A  |

### Qualitative Assessment
- **Developer Experience**: [Assessment]
- **Documentation Quality**: [Assessment]
- **Community Support**: [Assessment]
- **Future Viability**: [Assessment]

## Implementation Notes

### Getting Started
```bash
# Installation
npm install [chosen-library]

# Basic setup
[Setup commands]
```

### Key Patterns
```typescript
// Pattern 1: [Description]
[Code example]

// Pattern 2: [Description]
[Code example]
```

### Gotchas to Avoid
1. [Gotcha 1]
2. [Gotcha 2]

### Testing Strategy
- Unit tests: [Approach]
- Integration tests: [Approach]
- Accessibility tests: [Approach]

## Validation

### Success Criteria
- [ ] Meets accessibility requirements
- [ ] Stays within bundle budget
- [ ] Passes performance benchmarks
- [ ] Team can implement within token budget

### Review Schedule
- **3 months**: Check if decision still valid
- **6 months**: Evaluate alternatives if issues arise

## References

### Research Artifacts
- [Research Session](path/to/session)
- [Comparison Report](path/to/comparison-report.md)
- [Final Report](path/to/final-report.md)
- [Prototypes](path/to/prototypes)

### External Resources
- [Library Documentation](url)
- [GitHub Repository](url)
- [Community Forum](url)

## Metadata

- **Research Duration**: [X days]
- **Libraries Evaluated**: 3
- **Prototypes Created**: 3
- **Model Used**: [Model name]
- **Total Research Tokens**: [X]
- **Estimated Implementation Tokens**: [Y]
- **Decision Confidence**: [High/Medium/Low]
- **Next Review Date**: [YYYY-MM-DD]
```

### Archive ADR
Copy `decision.adr.md` to `.kiro/research/adrs/[YYYY-MM-DD]-[decision-title].md`

### Update Session Status
```json
{
  "status": "completed",
  "completedDate": "2024-01-15T18:00:00Z",
  "decision": "Library A",
  "tokensUsed": 25000,
  "adrGenerated": true
}
```

## Research Commands Reference

### Session Management
```bash
# Start new research
"Start research: [topic]"

# Continue paused research
"Continue research: [session-id]"

# Pause current research
"Pause research"

# Finalize and generate ADR
"Finalize research"
```

### Analysis Commands
```bash
# Compare libraries
"Compare [lib1] vs [lib2] vs [lib3]"

# Analyze complexity
"Analyze complexity of [library]"

# Analyze modularity
"Analyze modularity of [library]"

# Estimate tokens
"Estimate token usage for [library]"
```

### Report Commands
```bash
# Generate comparison report
"Generate comparison report"

# Generate final report
"Generate final report"

# Generate ADR
"Generate ADR"
```

## Best Practices

### Research Phase
1. **Limit scope**: Max 3 libraries to avoid analysis paralysis
2. **Document as you go**: Don't wait until the end
3. **Be objective**: Use quantitative metrics where possible
4. **Consider context**: Your priorities may differ from others
5. **Track tokens**: Monitor AI assistance costs

### Prototype Phase
1. **Start minimal**: Simplest possible working example
2. **Test immediately**: Keyboard, screen reader, accessibility
3. **Document issues**: Capture problems as they arise
4. **Time yourself**: Track actual implementation time
5. **Compare fairly**: Use same test scenarios for all libraries

### Decision Phase
1. **Review all data**: Don't rely on gut feeling alone
2. **Consider trade-offs**: No perfect solution exists
3. **Think long-term**: Maintenance and evolution matter
4. **Document rationale**: Future you will thank you
5. **Set review date**: Revisit decision periodically

### Token Efficiency
1. **Estimate early**: Plan AI assistance budget
2. **Track actual usage**: Compare estimates to reality
3. **Update estimates**: World changes, models improve
4. **Consider alternatives**: Sometimes simpler is better
5. **Document model**: Token costs vary by model

## Integration with Spec Workflow

### Transition to Spec
When research is complete and you're ready for formal development:

1. **Review ADR**: Understand the decision context
2. **Review final report**: Understand implementation plan
3. **Create spec**: Use research artifacts as input
4. **Reference research**: Link spec to research session
5. **Use prototypes**: Convert prototypes to production code

### Spec Requirements Input
From research, extract:
- Functional requirements (what it must do)
- Non-functional requirements (performance, accessibility)
- Constraints (bundle size, complexity limits)
- Dependencies (libraries, tools)
- Success criteria (how to validate)

### Spec Design Input
From research, extract:
- Architecture patterns (from chosen library)
- Component structure (from prototypes)
- API design (from examples)
- Integration points (from analysis)
- Testing strategy (from validation)

## Tips for Effective Research

### Do's
✅ Start with clear goals
✅ Limit to 2-3 libraries max
✅ Use quantitative metrics
✅ Build working prototypes
✅ Test accessibility thoroughly
✅ Document as you go
✅ Generate reports at milestones
✅ Create ADR on completion
✅ Track token usage
✅ Consider long-term maintenance

### Don'ts
❌ Compare more than 3 libraries
❌ Rely only on documentation
❌ Skip prototype phase
❌ Ignore accessibility
❌ Forget to document decisions
❌ Skip ADR generation
❌ Ignore token costs
❌ Rush to decision
❌ Forget to archive research
❌ Lose track of session state

## Troubleshooting

### "Too many libraries to compare"
**Solution**: Narrow down to top 3 based on initial criteria

### "Can't decide between options"
**Solution**: Review decision drivers, weight by priority

### "Lost track of research progress"
**Solution**: Check session.json, review comparison-report.md

### "Token budget exceeded"
**Solution**: Pause research, review efficiency, adjust approach

### "Prototype not working"
**Solution**: Review library examples, check documentation, ask for help

## Remember

- Research is iterative - it's okay to backtrack
- Perfect is the enemy of good - make a decision
- Document everything - future you will thank you
- ADRs are living documents - update as needed
- Token estimates help plan, but aren't perfect
- Max 3 libraries keeps research focused
- Prototypes reveal truth better than docs
- Accessibility is non-negotiable
- Community matters for long-term success
- Your context is unique - trust your judgment

---

**Ready to start researching! Use `#research-buddy` to begin.**
