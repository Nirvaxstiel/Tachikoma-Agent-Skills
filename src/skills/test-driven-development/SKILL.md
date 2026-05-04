---
name: test-driven-development
description: "TDD: enforce RED-GREEN-REFACTOR cycle — tests before code, minimal implementation"
keywords:
  - testing
  - tdd
  - red-green-refactor
  - unit-test
  - test-first
  - quality
triggers:
  - tdd
  - test-driven
  - red-green-refactor
  - test first
  - write tests
  - unit test
  - add tests
  - fix with test
---

# Test-Driven Development (TDD)

Write the test first. Watch it fail. Write minimal code to pass.

**Core principle:** If you didn't watch the test fail, you don't know if it tests the right thing.

## When to Use

- New features
- Bug fixes
- Refactoring
- Behavior changes

**Exceptions:** throwaway prototypes, generated code, configuration files.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over.

## Red-Green-Refactor Cycle

### RED — Write Failing Test

Write one minimal test showing what should happen.

**Requirements:**
- One behavior per test
- Clear descriptive name (split if contains "and")
- Test real behavior, not mocks (unless truly unavoidable)
- Name describes behavior, not implementation

**Good test:**
```python
def test_retries_failed_operations_3_times():
    attempts = 0
    def operation():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            raise Exception('fail')
        return 'success'

    result = retry_operation(operation)

    assert result == 'success'
    assert attempts == 3
```

**Bad test:**
```python
def test_retry_works():
    mock = MagicMock()
    mock.side_effect = [Exception(), Exception(), 'success']
    result = retry_operation(mock)
    assert result == 'success'  # What about retry count?
```

### GREEN — Minimal Code

Write the simplest code to pass the test. Nothing more.

**Cheating is OK in GREEN:**
- Hardcode return values
- Skip edge cases
- Duplicate code

**Don't add features or refactor beyond the test.** We'll fix it in REFACTOR.

### REFACTOR — Clean Up

After green only:
- Remove duplication
- Improve names
- Extract helpers
- Simplify expressions

Keep tests green throughout. Don't add behavior.

### Repeat

Next failing test for next behavior. One cycle at a time.

## Verification Checklist

Before marking complete:
- [ ] Every new function/method has a test
- [ ] Watched each test fail before implementing
- [ ] Each test failed for expected reason (feature missing, not typo)
- [ ] Wrote minimal code to pass each test
- [ ] All tests pass
- [ ] Edge cases and errors covered

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Already manually tested" | Ad-hoc ≠ systematic. No record, can't re-run. |
| "Keep as reference" | You'll adapt it. That's testing after. Delete means delete. |
| "Need to explore first" | Throw away exploration, start with TDD. |

## When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write the wished-for API. Write assertion first. Ask user. |
| Test too complicated | Design too complicated. Simplify the interface. |
| Must mock everything | Code too coupled. Use dependency injection. |
| Test setup huge | Extract helpers. Still complex? Simplify the design. |

## Integration

### With plan skill

Before starting TDD, use `plan` skill to define acceptance criteria:

```
<acceptance_criteria>
AC-1: Given {pre}, When {action}, Then {expected}
</acceptance_criteria>
```

Each AC maps to one or more tests.

### With systematic-debugging skill

Bug found? Write failing test reproducing it. Follow TDD cycle. The test proves the fix and prevents regression.

Never fix bugs without a test.

## Anti-Patterns

- Testing mock behavior instead of real behavior
- Testing implementation details instead of behavior
- Happy path only — test edge cases, errors, boundaries
- Brittle tests — refactoring shouldn't break them

## Final Rule

```
Production code → test exists and failed first
Otherwise → not TDD
```
