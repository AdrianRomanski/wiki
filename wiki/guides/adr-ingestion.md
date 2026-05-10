---
title: "ADR Ingestion Guide"
type: concept
tags: ["guide", "adr", "research", "workflow", "ingestion"]
created: 2024-05-10
updated: 2024-05-10
---

# ADR Ingestion Guide

This guide provides step-by-step instructions for ingesting Architecture Decision Records (ADRs) from research sessions into the wiki system.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Step-by-Step Process](#step-by-step-process)
5. [ADR Structure Requirements](#adr-structure-requirements)
6. [Common Scenarios](#common-scenarios)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Overview

The ADR ingestion workflow automates the process of:

1. **Copying** ADRs from research sessions to the raw/ directory
2. **Extracting** metadata and decision information from ADRs
3. **Generating** structured wiki pages (Source_Summary and Entity_Pages)
4. **Creating** cross-references to existing wiki content
5. **Updating** the wiki index and activity log
6. **Committing** changes to git with descriptive messages

This ensures research decisions are preserved, searchable, and connected to your knowledge base.

---

## Prerequisites

Before ingesting an ADR, ensure:

- ✅ Research session directory exists in `.kiro/research/`
- ✅ ADR file named `decision.adr.md` exists in the session directory
- ✅ ADR contains required frontmatter fields (title, date, status, context)
- ✅ Wiki system is initialized (wiki/ and raw/ directories exist)
- ✅ Node.js and TypeScript are installed

---

## Quick Start

### Using the Command Line

```bash
# Navigate to your project root
cd /path/to/your/project

# Run the ingestion workflow
npx tsx scripts/wiki/adr-workflow-example.ts
```

### Using TypeScript

```typescript
import { runADRIngestionWorkflow } from './scripts/wiki/adr-workflow.js';

// Ingest ADR from research session
const result = await runADRIngestionWorkflow({
  sessionPath: '.kiro/research/session-2024-01-15-state-management',
  sessionId: 'session-2024-01-15-state-management',
  generateEntityPages: true,
  addCrossReferences: true,
});

console.log(`Generated ${result.writtenPaths.length} wiki pages`);
```

---

## Step-by-Step Process

### Step 1: Create Research Session

Create a research session directory with a descriptive name:

```bash
mkdir -p .kiro/research/session-2024-01-15-state-management
cd .kiro/research/session-2024-01-15-state-management
```

**Naming Convention:**
- Format: `session-YYYY-MM-DD-topic-name`
- Use kebab-case for topic names
- Include date for chronological ordering

### Step 2: Conduct Research

During your research phase, create:

- **Comparison reports**: Document library comparisons
- **Prototypes**: Build proof-of-concept implementations
- **Final reports**: Summarize findings and recommendations

### Step 3: Create ADR

Create `decision.adr.md` in your session directory with the following structure:

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

[Describe the problem you're solving]

## Decision Drivers

- [Key factor 1]
- [Key factor 2]
- [Key factor 3]

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

## Decision Outcome

Chosen option: **NgRx**

### Rationale

[Explain why this option was chosen]

### Consequences

- Positive: [Benefits]
- Negative: [Drawbacks]
- Neutral: [Trade-offs]

## Research Links

- [Comparison Report](./comparison-report.md)
- [Final Report](./final-report.md)
- [Prototype](./prototypes/ngrx/)
```

### Step 4: Run Ingestion Workflow

Execute the ingestion workflow:

```typescript
import { runADRIngestionWorkflow } from './scripts/wiki/adr-workflow.js';

const result = await runADRIngestionWorkflow({
  sessionPath: '.kiro/research/session-2024-01-15-state-management',
  sessionId: 'session-2024-01-15-state-management',
  generateEntityPages: true,      // Generate Entity_Pages for libraries
  addCrossReferences: true,        // Add cross-reference links
});

// Check results
console.log('Generated pages:');
result.writtenPaths.forEach(path => console.log(`  - ${path}`));
```

### Step 5: Verify Generated Pages

Check the generated wiki pages:

```bash
# View Source_Summary
cat wiki/sources/choose-ngrx-for-state-management.md

# View Entity_Pages
ls wiki/entities/
```

### Step 6: Review and Commit

The workflow automatically commits changes to git. Review the commit:

```bash
git log -1 --stat
```

---

## ADR Structure Requirements

### Required Frontmatter Fields

```yaml
---
title: "Decision Title"           # Required: Short, descriptive title
date: YYYY-MM-DD                  # Required: Decision date
status: accepted                  # Required: accepted, rejected, superseded, deprecated
context: "Brief context"          # Required: One-sentence problem statement
---
```

### Optional Frontmatter Fields

```yaml
---
deciders: ["person1", "person2"]  # Optional: Who made the decision
tags: ["tag1", "tag2"]            # Optional: Technology tags
sessionId: "session-id"           # Optional: Research session ID
supersedes: "path/to/old-adr.md"  # Optional: ADR this replaces
supersededBy: "path/to/new.md"    # Optional: ADR that replaces this
---
```

### Required Sections

1. **Context and Problem Statement**: Describe the problem
2. **Decision Drivers**: List key factors influencing the decision
3. **Considered Options**: Numbered list of alternatives
4. **Decision Outcome**: State the chosen option

### Optional Sections

1. **Comparison Matrix**: Structured comparison tables
2. **Rationale**: Detailed explanation of the choice
3. **Consequences**: Positive, negative, and neutral outcomes
4. **Research Links**: Links to research artifacts

---

## Common Scenarios

### Scenario 1: Simple Decision (No Comparison Matrix)

**Use Case:** Quick decision with minimal research

**ADR Structure:**
```markdown
---
title: "Use TypeScript for New Project"
date: 2024-01-15
status: accepted
context: "Need type safety for large codebase"
---

# Use TypeScript for New Project

## Context and Problem Statement
We need type safety to prevent runtime errors in our growing codebase.

## Decision Drivers
- Type safety
- IDE support
- Team familiarity

## Considered Options
1. TypeScript
2. JavaScript with JSDoc

## Decision Outcome
Chosen option: **TypeScript**

### Rationale
TypeScript provides compile-time type checking and better IDE support.
```

**Ingestion:**
```typescript
const result = await runADRIngestionWorkflow({
  sessionPath: '.kiro/research/session-2024-01-15-typescript',
  sessionId: 'session-2024-01-15-typescript',
  generateEntityPages: true,
  addCrossReferences: true,
});
```

**Expected Output:**
- 1 Source_Summary page
- 2 Entity_Pages (TypeScript, JavaScript)
- Cross-references to existing pages

---

### Scenario 2: Complex Decision with Multiple Libraries

**Use Case:** Comparing 5+ libraries with detailed matrices

**ADR Structure:**
```markdown
---
title: "Choose HTTP Client Library"
date: 2024-02-01
status: accepted
context: "Need robust HTTP client for API integration"
tags: ["http", "api", "networking"]
---

# Choose HTTP Client Library

## Considered Options
1. Axios
2. Fetch API
3. Got
4. Superagent
5. Request

## Comparison Matrix

### Performance Comparison

| Metric | Axios | Fetch | Got | Superagent | Request | Winner |
|--------|-------|-------|-----|------------|---------|--------|
| Speed | Fast | Fastest | Fast | Medium | Slow | Fetch |
| Bundle Size | 13KB | 0KB | 50KB | 20KB | 500KB | Fetch |

### Feature Comparison

| Feature | Axios | Fetch | Got | Superagent | Request | Winner |
|---------|-------|-------|-----|------------|---------|--------|
| Interceptors | Yes | No | Yes | Yes | No | Axios |
| Timeout | Yes | No | Yes | Yes | Yes | Axios |
```

**Ingestion:**
```typescript
const result = await runADRIngestionWorkflow({
  sessionPath: '.kiro/research/session-2024-02-01-http-client',
  sessionId: 'session-2024-02-01-http-client',
  generateEntityPages: true,
  addCrossReferences: true,
});
```

**Expected Output:**
- 1 Source_Summary page with 2 comparison matrices
- 5 Entity_Pages (one per library)
- Cross-references to existing API/networking pages

---

### Scenario 3: Decision with Research Artifacts

**Use Case:** Decision backed by prototypes and reports

**Directory Structure:**
```
.kiro/research/session-2024-02-10-form-validation/
├── decision.adr.md
├── comparison-report.md
├── final-report.md
└── prototypes/
    ├── yup/
    ├── zod/
    └── joi/
```

**ADR Structure:**
```markdown
---
title: "Choose Zod for Form Validation"
date: 2024-02-10
status: accepted
context: "Need schema validation for complex forms"
sessionId: "session-2024-02-10-form-validation"
---

# Choose Zod for Form Validation

## Research Links

- [Comparison Report](./comparison-report.md)
- [Final Report](./final-report.md)
- [Yup Prototype](./prototypes/yup/)
- [Zod Prototype](./prototypes/zod/)
- [Joi Prototype](./prototypes/joi/)
```

**Ingestion:**
```typescript
const result = await runADRIngestionWorkflow({
  sessionPath: '.kiro/research/session-2024-02-10-form-validation',
  sessionId: 'session-2024-02-10-form-validation',
  generateEntityPages: true,
  addCrossReferences: true,
});
```

**Expected Output:**
- Source_Summary with Session Reference section
- Links to comparison report, final report, and prototypes
- 3 Entity_Pages (Yup, Zod, Joi)

---

### Scenario 4: Batch Processing Multiple Sessions

**Use Case:** Migrate existing research sessions to wiki

**Script:**
```typescript
import { runADRIngestionWorkflow } from './scripts/wiki/adr-workflow.js';
import { promises as fs } from 'fs';

async function batchIngest() {
  const researchDir = '.kiro/research';
  const sessions = await fs.readdir(researchDir);
  
  for (const sessionId of sessions) {
    const sessionPath = `${researchDir}/${sessionId}`;
    
    try {
      console.log(`Processing: ${sessionId}`);
      
      const result = await runADRIngestionWorkflow({
        sessionPath,
        sessionId,
        generateEntityPages: true,
        addCrossReferences: true,
      });
      
      console.log(`  ✓ Created ${result.writtenPaths.length} pages`);
      
    } catch (error) {
      console.error(`  ✗ Failed: ${error.message}`);
    }
  }
}

batchIngest();
```

---

## Troubleshooting

### Problem: ADR Not Found

**Error Message:**
```
ADRIngestionError: ADR file not found in session directory
```

**Solution:**
1. Verify the ADR file is named exactly `decision.adr.md`
2. Check the file is in the root of the session directory
3. Ensure the session path is correct

**Example:**
```bash
# Correct structure
.kiro/research/session-2024-01-15-state-management/
└── decision.adr.md  ✓

# Incorrect structure
.kiro/research/session-2024-01-15-state-management/
└── docs/
    └── decision.adr.md  ✗
```

---

### Problem: Missing Required Frontmatter

**Error Message:**
```
ADRParseError: Missing required frontmatter field: title
```

**Solution:**
Ensure all required fields are present in frontmatter:

```yaml
---
title: "Your Decision Title"    # Required
date: 2024-01-15               # Required
status: accepted               # Required
context: "Brief context"       # Required
---
```

---

### Problem: Malformed Comparison Matrix

**Error Message:**
```
ADRParseError: Failed to parse comparison matrix
```

**Solution:**
Ensure your comparison matrix follows this format:

```markdown
| Feature | Library1 | Library2 | Winner |
|---------|----------|----------|--------|
| Feature1 | Value1 | Value2 | Library1 |
```

**Common Issues:**
- Missing pipe separators (`|`)
- Missing header separator row
- Inconsistent column counts
- Special characters not escaped

**Correct Format:**
```markdown
### Feature Comparison

| Feature | NgRx | Akita | Winner |
|---------|------|-------|--------|
| Type Safety | Excellent | Good | NgRx |
| DevTools | Excellent | Good | NgRx |
```

---

### Problem: Broken Session References

**Error Message:**
```
Warning: Session reference validation failed
```

**Solution:**
1. Verify the session directory exists
2. Check that referenced files exist (comparison report, final report)
3. Ensure file paths are relative to session directory

**Validation:**
```typescript
import { validateSessionReference } from './scripts/wiki/research-session-linker.js';

const validation = await validateSessionReference(sessionReference);

if (!validation.valid) {
  console.log('Errors:', validation.errors);
}
```

---

### Problem: Duplicate Entity Pages

**Error Message:**
```
Entity page already exists, skipping: entities/ngrx.md
```

**Solution:**
This is expected behavior. The workflow skips creating duplicate Entity_Pages.

**To Update Existing Entity Pages:**
1. Manually merge information from the new ADR
2. Add backlinks to the new Source_Summary
3. Update tags and metadata as needed

**Future Enhancement:**
Automatic merging of duplicate Entity_Pages is planned for a future release.

---

### Problem: Git Commit Fails

**Error Message:**
```
Warning: Failed to commit changes to git
```

**Solution:**
1. Ensure git is initialized in the project
2. Check git configuration (user.name, user.email)
3. Verify you have write permissions

**Manual Commit:**
```bash
git add wiki/ raw/
git commit -m "[wiki] ingest: ADR from research session [session-id]"
```

---

## Best Practices

### 1. ADR Structure

✅ **Do:**
- Use descriptive titles (50-70 characters)
- Include all required frontmatter fields
- Use comparison matrices for structured data
- Link to research artifacts
- Tag with technology-specific keywords

❌ **Don't:**
- Use vague titles like "Decision 1"
- Skip required frontmatter fields
- Forget to list all considered options
- Omit the decision outcome

---

### 2. Research Session Organization

✅ **Do:**
- Use descriptive session IDs with dates
- Keep all artifacts in the session directory
- Create comparison reports before finalizing
- Build prototypes to validate decisions
- Document thoroughly

❌ **Don't:**
- Use generic session names like "research1"
- Scatter artifacts across multiple directories
- Skip documentation of alternatives
- Make decisions without research

---

### 3. Wiki Maintenance

✅ **Do:**
- Review generated pages after ingestion
- Consolidate duplicate Entity_Pages
- Update superseded decisions
- Validate session references periodically
- Run maintenance workflow regularly

❌ **Don't:**
- Ignore duplicate Entity_Pages
- Leave broken session references
- Forget to mark superseded decisions
- Skip periodic maintenance

---

### 4. Tagging Strategy

✅ **Do:**
- Use technology-specific tags (e.g., "angular", "react")
- Include domain tags (e.g., "state-management", "http")
- Add decision-related tags ("research", "adr", "decision")
- Use consistent tag naming (kebab-case)

❌ **Don't:**
- Use inconsistent tag formats
- Create too many tags (keep it focused)
- Forget to tag with technology stack
- Use vague tags like "misc" or "other"

---

### 5. Cross-References

✅ **Do:**
- Enable cross-reference detection
- Review generated cross-references
- Add manual cross-references when needed
- Link to related concepts and entities

❌ **Don't:**
- Disable cross-reference detection
- Ignore broken cross-references
- Forget to link to existing pages
- Create orphaned pages

---

## Related Documentation

- [Library Research Workflow](../../.kiro/steering/library-research.md)
- [ADR Workflow Implementation](../../scripts/wiki/adr-workflow.ts)
- [ADR Workflow Examples](../../scripts/wiki/adr-workflow-example.ts)
- [Query System Guide](../../scripts/wiki/QUERY_README.md)
- [Maintenance Workflow](../../scripts/wiki/maintenance.ts)
- [Wiki System Overview](../../README.md)

---

## Summary

The ADR ingestion workflow automates the flow of research decisions into your wiki:

1. **Create** research session with ADR
2. **Run** ingestion workflow
3. **Verify** generated wiki pages
4. **Review** cross-references and links
5. **Maintain** wiki health over time

This ensures valuable research insights are preserved, searchable, and connected to your knowledge base.

For more examples, see [adr-workflow-example.ts](../../scripts/wiki/adr-workflow-example.ts).
