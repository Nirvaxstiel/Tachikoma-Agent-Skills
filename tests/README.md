# Tachikoma Test Suite

Comprehensive test suite for Tachikoma agent, covering infrastructure, behaviour, and quality.

## Quick Start

```bash
# Run all tests
bun test tests/

# Run specific category
bun test tests/infrastructure/
bun test tests/behavioural/
bun test tests/quality/

# Run specific test file
bun test tests/infrastructure/plugin-system.test.ts

# Run existing tests (before migration)
bun test src/test-*.ts
```

## Test Categories

### 1. Infrastructure Tests (`tests/infrastructure/`)

Tests for foundational systems that enable Tachikoma to function.

**Purpose:** Ensure Tachikoma installs correctly and tools are registered properly.

**Test Files:**
- `plugin-system.test.ts` (19 tests)
  - Script auto-discovery
  - Tool registration
  - Command execution
  - Error handling
- `installation.test.ts` (26 tests)
  - Target directory calculation
  - File exclusion rules
  - Backup creation
  - File copying
  - Source validation

**Running:**
```bash
bun test tests/infrastructure/
```

---

### 2. Behavioural Tests (`tests/behavioural/`)

Tests for Tachikoma's decision-making logic and workflow execution.

**Purpose:** Ensure Tachikoma routes tasks correctly and completes workflows properly.

**Test Files:**
- `routing-logic.test.ts` (30 tests)
  - Intent classification (9 intents)
  - Complexity detection
  - Strategy selection
  - Clarification handling
  - Edge cases
  - Routing integration
- `workflow-execution.test.ts` (18 tests)
  - PAUL phase transitions
  - Skill chain execution
  - State management
  - Error recovery
  - Tool usage patterns
  - Verification loops

**Running:**
```bash
bun test tests/behavioural/
```

---

### 3. Quality Tests (`tests/quality/`)

Tests for the structure and format of Tachikoma's outputs.

**Purpose:** Ensure all agent outputs are well-structured and follow standards.

**Test Files:**
- `markdown-validation.test.ts` (17 tests)
  - Required sections
  - Heading hierarchy
  - Code block formatting
  - Placeholder detection
  - Line length checks
  - Trailing whitespace
- `code-quality.test.ts` (19 tests)
  - TypeScript syntax validation
  - Type checking
  - Best practices compliance
  - Code style checks
- `output-structure.test.ts` (16 tests)
  - Response type formatting
  - Required fields
  - Tool call validation
  - Template cleanup

**Running:**
```bash
bun test tests/quality/
```

---

## Test Structure

```
tests/
├── infrastructure/
│   ├── plugin-system.test.ts
│   ├── installation.test.ts
│   └── README.md
├── behavioural/
│   ├── routing-logic.test.ts
│   ├── workflow-execution.test.ts
│   └── README.md
└── quality/
    ├── markdown-validation.test.ts
    ├── code-quality.test.ts
    ├── output-structure.test.ts
    └── README.md
```

## Running Tests

### All Tests

```bash
bun test tests/
```

### By Category

```bash
# Infrastructure tests
bun test tests/infrastructure/

# Behavioural tests
bun test tests/behavioural/

# Quality tests
bun test tests/quality/

# Evaluation tests
bun test tests/evaluation/
```

### Specific Test File

```bash
bun test tests/infrastructure/plugin-system.test.ts
```

### With Output

```bash
# Verbose output
bun test tests/ --verbose

# Coverage report (if configured)
bun test tests/ --coverage
```

### NPM Scripts

The following scripts are available in `package.json`:

```bash
bun run test:infra        # Infrastructure tests
bun run test:behavioural  # Behavioural tests
bun run test:quality      # Quality tests
bun run test:existing     # Original tests in src/
```

## Test Coverage

### Current Status (2026-03-03)

| Category | Tests | Passing | Coverage |
|----------|--------|----------|-----------|
| Infrastructure | 45 | 45 (100%) | Complete |
| Behavioural | 48 | 48 (100%) | Complete |
| Quality | 52 | 52 (100%) | Complete |
| **Total** | **145** | **145 (100%)** | **Complete** |

### Acceptance Criteria

| AC | Status | Description |
|----|--------|-------------|
| AC-1 | ✅ | Test suite execution |
| AC-2 | ✅ | Plugin system tests |
| AC-3 | ✅ | Routing logic tests |
| AC-4 | ✅ | Workflow execution tests |
| AC-5 | ✅ | Markdown validation |
| AC-6 | ✅ | Code quality tests |
| AC-7 | ✅ | Test organization |
| AC-8 | ✅ | Test patterns |

## Writing Tests

### Test Structure

Follow this pattern for new tests:

```typescript
#!/usr/bin/env bun
/**
 * [Component Name] Tests
 *
 * AC-[N]: Given [context], When [action],
 * Then [expected outcome]
 */

import { beforeEach, describe, expect, it } from "bun:test";

describe("Component Name", () => {
  beforeEach(() => {
    // Setup
  });

  it("should do something", () => {
    // Arrange
    const input = ...;

    // Act
    const result = ...;

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Test Naming

Use descriptive names following the format:

- `should [expected behavior]`
- `should handle [edge case]`
- `should detect [condition]`
- `should enforce [rule]`

### Acceptance Criteria

Link tests to acceptance criteria in the plan:

```typescript
// AC-3: Given routing logic tests, When test queries are provided,
// Then the correct intent, complexity level, and strategy are selected

describe("Routing Logic", () => {
  it("should classify code intent", () => {
    // test implementation
  });
});
```

## Troubleshooting

### Tests Failing

1. **Check test isolation**: Ensure tests don't depend on each other
2. **Verify test data**: Confirm fixtures and mocks are correct
3. **Review test expectations**: Ensure assertions match actual behavior
4. **Check dependencies**: Verify all imports are correct
5. **Run individual tests**: Test specific files to isolate failures

### Tests Not Running

1. **Check file permissions**: Ensure test files are executable
2. **Verify shebang**: Test files should start with `#!/usr/bin/env bun`
3. **Check imports**: Ensure all dependencies are installed
4. **Verify bun version**: Ensure Bun is properly installed

### Slow Tests

1. **Use verbose output**: `bun test tests/ --verbose` to see progress
2. **Profile execution**: Add timing to identify slow tests
3. **Mock external calls**: Replace file system I/O with mocks
4. **Skip expensive operations**: Mark slow tests as optional

### Flaky Tests

1. **Fix timing issues**: Use explicit waits or promises
2. **Mock randomness**: Seed random number generators
3. **Isolate state**: Reset state between tests
4. **Increase timeouts**: Allow more time for async operations

## CI/CD Integration

### GitHub Actions

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test tests/
```

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/usr/bin/env bun
bun test tests/infrastructure/ tests/behavioural/ tests/quality/
```

## Migration

### Existing Tests

Original test files in `src/`:
- `test-verifier.ts`
- `test-intent-router.ts`
- `test-context-manager.ts`
- `test-model-harness.ts`
- `test-rlm-handler.ts`

These tests cover core systems and have been migrated to `tests/behavioural/`.

## Documentation

- **Test Strategy**: See `docs/testing.md` for comprehensive testing guide
- **PAUL Methodology**: See `docs/capabilities/paul-methodology.md`
- **Architecture**: See `docs/concepts/architecture.md`

## Contributing

When adding new tests:

1. **Choose category**: Infrastructure, Behavioural, Quality, or Evaluation
2. **Follow patterns**: Use existing test files as templates
3. **Document AC**: Link to acceptance criteria in test comments
4. **Test locally**: Run tests before committing
5. **Update counts**: Add test count to this README
6. **Verify scripts**: Ensure npm scripts work correctly

## Resources

- **Bun Test Docs**: https://bun.sh/docs/test
- **Bun Testing Best Practices**: https://bun.sh/docs/test/writing
- **Test Documentation**: `docs/testing.md`
- **PAUL Methodology**: `docs/capabilities/paul-methodology.md`

---

*Last Updated: 2026-03-03*
