# Polished Research Workflow

A structured 4-phase workflow system for library research and comparison.

## Directory Structure

```
scripts/research-workflow/
├── types/                      # TypeScript type definitions
│   ├── core.ts                # Core workflow types (Phase, Session, etc.)
│   ├── installation.ts        # Installation-related types
│   ├── analysis.ts            # Analysis and big picture types
│   ├── artifacts.ts           # Artifact generation types
│   └── index.ts               # Central type exports
├── errors/                     # Error classes
│   ├── WorkflowError.ts       # Base and specific error classes
│   └── index.ts               # Central error exports
├── test-utils/                 # Testing utilities
│   ├── property-test-config.ts # Property-based test configuration
│   └── index.ts               # Central test utility exports
├── vitest.config.ts           # Vitest configuration
└── README.md                  # This file
```

## Testing Framework

This project uses:
- **Vitest** for unit and integration testing
- **fast-check** for property-based testing (minimum 100 iterations per property)

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.spec.ts
```

### Property-Based Testing

Property tests validate universal correctness properties across all valid inputs. Each property test includes a comment tag referencing the design property:

```typescript
// Feature: polished-research-workflow, Property 1: Input Validation by Research Mode
test.prop([fc.string(), fc.array(fc.string())])(
  'validates library count by research mode',
  (mode, libraries) => {
    // Test implementation
  }
);
```

## Type Definitions

### Core Types
- `Phase` - Workflow state machine phases
- `ResearchMode` - Single library or comparison mode
- `Session` - Research session state
- `SessionMetadata` - User inputs and configuration

### Installation Types
- `InstallationResult` - Library installation outcome
- `VerificationResult` - Library verification outcome

### Analysis Types
- `LibraryAnalysis` - Complete library analysis
- `StructureAnalysis` - Library structure information
- `CapabilityCategories` - Categorized library capabilities

### Artifact Types
- `Artifact` - Generated artifact structure
- `Decision` - Decision information
- `ComparisonData` - Comparison metrics

## Error Classes

All workflow errors extend `WorkflowError`:
- `InvalidPhaseTransitionError` - Invalid phase transition
- `SessionError` - Session operation failures
- `SessionNotFoundError` - Session not found
- `SessionCorruptedError` - Corrupted session state
- `SessionFinalizedError` - Attempt to modify finalized session
- `InstallationError` - Library installation failure
- `VerificationError` - Library verification failure
- `ArtifactGenerationError` - Artifact generation failure
- `ValidationError` - Input validation failure
- `PrerequisiteError` - Prerequisite check failure

## Development

### Adding New Types

1. Add type definitions to appropriate file in `types/`
2. Export from `types/index.ts`
3. Update this README

### Adding New Errors

1. Add error class to `errors/WorkflowError.ts`
2. Export from `errors/index.ts`
3. Update this README

### Writing Tests

1. Unit tests: Create `*.spec.ts` files alongside implementation
2. Property tests: Use arbitraries from `test-utils/property-test-config.ts`
3. Follow naming convention: `Feature: polished-research-workflow, Property N: Description`
