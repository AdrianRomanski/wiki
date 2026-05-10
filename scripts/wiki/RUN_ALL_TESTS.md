# Running All Tests for ADR Wiki Integration

This document provides instructions for running all validation tests for the Research ADR Wiki Integration feature.

## Prerequisites

- Node.js and npm installed
- All dependencies installed (`npm install`)
- Git repository initialized

## Test Suite Overview

### 1. Unit Tests (384 tests)

Run all unit tests for wiki components:

```bash
npx vitest run scripts/wiki
```

**Expected Output**: All 384 tests should pass

**Test Files**:
- `activity-log.test.ts` - Activity logging tests
- `adr-metadata-extractor.test.ts` - ADR parsing tests
- `cross-reference.test.ts` - Cross-reference detection tests
- `filesystem.test.ts` - File system operations tests
- `frontmatter.test.ts` - Frontmatter parsing tests
- `generators.test.ts` - Wiki page generation tests
- `git-integration.test.ts` - Git integration tests
- `index-manager.test.ts` - Index management tests
- `ingestion.test.ts` - Wiki ingestion tests
- `maintenance.test.ts` - Maintenance workflow tests
- `markdown.test.ts` - Markdown parsing tests
- `naming.test.ts` - Naming convention tests
- `query.test.ts` - Query workflow tests
- `research-session-linker.test.ts` - Session linking tests

### 2. End-to-End Test

Run the complete ADR ingestion workflow test:

```bash
npx tsx scripts/wiki/test-adr-workflow-e2e.ts
```

**Expected Output**: 
- ✅ ADR copied to raw/
- ✅ Metadata extracted successfully
- ✅ Source_Summary page generated
- ✅ 3 Entity_Page entries generated
- ✅ Cross-references added
- ✅ Index updated
- ✅ Activity log recorded
- ✅ Git commit created
- 🎉 END-TO-END TEST PASSED!

**What it tests**:
- Complete workflow from research session to wiki pages
- ADR with all sections (frontmatter, comparison matrices, research links)
- Multiple libraries (3+)
- Wiki page rendering
- Cross-reference insertion
- Git commit creation
- Activity log recording
- Index updates

### 3. Error Handling Tests

Run error handling and edge case tests:

```bash
npx tsx scripts/wiki/test-adr-error-handling.ts
```

**Expected Output**: 6/6 tests passed

**What it tests**:
- Missing ADR file (should fail gracefully)
- Session without ADR file (should fail gracefully)
- Invalid frontmatter (should fail with descriptive error)
- Malformed comparison matrix (should fail with descriptive error)
- Minimal ADR with required fields only (should succeed)
- Broken session references (should succeed with warnings)

## Running All Tests

To run all tests in sequence:

```bash
# 1. Run unit tests
echo "Running unit tests..."
npx vitest run scripts/wiki

# 2. Run end-to-end test
echo "Running end-to-end test..."
npx tsx scripts/wiki/test-adr-workflow-e2e.ts

# 3. Run error handling tests
echo "Running error handling tests..."
npx tsx scripts/wiki/test-adr-error-handling.ts

echo "All tests completed!"
```

## Test Results Summary

After running all tests, you should see:

- **Unit Tests**: 384/384 passed ✅
- **End-to-End Test**: PASSED ✅
- **Error Handling Tests**: 6/6 passed ✅

## Validation Checklist

After running all tests, verify:

- [ ] All unit tests pass (384/384)
- [ ] End-to-end test passes
- [ ] Error handling tests pass (6/6)
- [ ] Generated wiki pages exist and are readable
- [ ] Cross-references are properly formatted
- [ ] Activity log contains ingestion entries
- [ ] Git commits are created with correct messages
- [ ] No temporary files left behind
- [ ] Documentation is complete and accurate

## Troubleshooting

### Test Failures

If any tests fail:

1. Check the error message for details
2. Verify all dependencies are installed
3. Ensure git repository is initialized
4. Check file permissions
5. Review the validation summary: `scripts/wiki/VALIDATION_SUMMARY.md`

### Cleanup

To clean up test artifacts:

```bash
# Remove test research sessions
rm -rf .kiro/research/test-*

# Remove test wiki pages (if needed)
rm -f wiki/sources/test-*.md
rm -f wiki/entities/test-*.md

# Remove test raw files
rm -f raw/research-decisions/test-*.md
```

## Additional Resources

- **Validation Summary**: `scripts/wiki/VALIDATION_SUMMARY.md`
- **ADR Workflow Example**: `scripts/wiki/adr-workflow-example.ts`
- **Library Research Guide**: `.kiro/steering/library-research.md`
- **ADR Ingestion Guide**: `wiki/guides/adr-ingestion.md`
- **Main README**: `README.md` (Research-Wiki Integration section)

## Contact

For questions or issues, refer to the project documentation or create an issue in the repository.
