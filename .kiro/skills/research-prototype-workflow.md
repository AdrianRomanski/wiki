---
name: Research Prototype Workflow
description: Workflow for rapid prototyping and learning in the research phase
tags: [research, prototype, learning, workflow]
---

# Research Prototype Workflow

## Phase 1: Explore & Experiment

### Quick Prototype Cycle
1. **Identify Pattern** - What Angular Aria feature are we exploring?
2. **Minimal Example** - Create smallest possible working example
3. **Test Behavior** - Keyboard test, screen reader test
4. **Document Findings** - What works? What doesn't? Why?

### Example Structure
```
research-notes/
  ├── [feature-name]/
  │   ├── findings.md          # What we learned
  │   ├── example.component.ts # Working code
  │   └── issues.md            # Problems encountered
```

## Phase 2: Refine & Validate

### Validation Steps
- [ ] Does it work with keyboard only?
- [ ] Does screen reader announce correctly?
- [ ] Is the pattern reusable?
- [ ] Does it follow ARIA best practices?

### Documentation Template
```markdown
# [Feature Name] Research

## Goal
What are we trying to learn?

## Approach
How did we implement it?

## Findings
What did we discover?

## Code Example
[Working code snippet]

## Issues Encountered
What problems did we face?

## Best Practices
What patterns should we follow?

## Next Steps
What should we explore next?
```

## Phase 3: Prepare for Spec

### Transition Criteria
When a prototype is stable and validated:
1. Document the pattern clearly
2. Identify reusable components
3. List requirements for production version
4. Create spec for formal implementation

### Spec Readiness Checklist
- [ ] Pattern validated with real accessibility testing
- [ ] Edge cases identified
- [ ] Performance considerations noted
- [ ] Browser compatibility checked
- [ ] Reusability potential assessed

## Research Tips

### Fast Iteration
- Use Angular CLI for quick component generation
- Keep components small and focused
- Test immediately after each change
- Don't worry about perfect code - focus on learning

### Learning Resources
- Angular documentation (https://angular.dev)
- ARIA Authoring Practices Guide (https://www.w3.org/WAI/ARIA/apg/)
- MDN Web Docs for ARIA
- WebAIM articles

### Common Pitfalls
- Over-using ARIA (semantic HTML first!)
- Forgetting keyboard navigation
- Not testing with actual screen readers
- Making assumptions about accessibility
