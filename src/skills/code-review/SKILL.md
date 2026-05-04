---
name: code-review
description: >
  Review code changes for correctness, quality, security, and maintainability.
  Use when asked to review, critique, or give feedback on code changes or diffs.
keywords:
  - review
  - critique
  - feedback
  - diff
  - pr
  - pull request
  - changes
  - security
  - quality
  - risk
triggers:
  - review
  - critique
  - feedback
  - check this
  - look at
  - assess
  - scan for
  - security check
  - what about
  - are there any issues
---

# Code Review Skill

Review changes methodically. Cover correctness, quality, security, and maintainability.

## Process

1. **Scope** — identify changed files, understand the intent
2. **Examine** — read diffs, trace logic, check context
3. **Assess** — categorize findings by severity
4. **Report** — concise, actionable findings

## Severity Levels

| Level | Meaning |
|-------|---------|
| `bug` | Broken behavior, will cause runtime failure |
| `risk` | Works now but fragile (race, null, swallowed error) |
| `nit` | Style, naming, micro-opt; author can ignore |
| `q` | Genuine question, not a suggestion |

## Review Checklist

**Correctness**
- Logic errors, off-by-one, wrong operator
- Edge cases: null, empty, max values
- Error handling: swallowed exceptions, missing fallbacks
- Return values ignored

**Quality**
- Function/class doing too many things (>50 lines)
- Duplication across files
- Magic numbers, hardcoded strings
- Missing or weak types
- Commented-out code left behind

**Security**
- Injection: SQL, command, path, eval
- Auth/authz bypassed
- Secrets or keys in code
- Unvalidated input to external systems
- Overly permissive permissions

**Performance**
- N+1 queries
- Unnecessary allocations in hot paths
- Sync over async where blocking is a concern
- Missing indexes on changed DB queries

**Maintainability**
- Breaking changes without migration path
- API/interface changes not reflected callers
- Missing tests for changed logic
- No CHANGELOG entry for user-facing changes

## Output Format

```
## Review: {PR/branch/commit — description}

### Verdict
{APPROVE / REQUEST_CHANGES / COMMENT} — {one-liner}

### Findings
| # | Severity | Location | Problem | Fix |
|---|----------|----------|---------|-----|
| 1 | risk | src/auth.ts:42 | user can be null after .find() | Add guard before .email |
| 2 | nit | utils/parse.ts | 80-line fn does 4 things | Extract validate/normalize/persist |
| 3 | q | tests/auth.spec.ts | Should 401 also trigger refresh? | Clarify intended behavior |

### Summary
- {n} blocking issues, {n} suggestions, {n} questions
```

## Rules

- State the problem, then the fix — not "here's what this code does"
- Exact file:line references, exact symbol names in backticks
- Drop: "I noticed...", "It seems like...", "You might want to..."
- One finding per line; group by file if >3 per file
- Security findings get full explanation + reference link
- Don't approve/request-changes — output findings for human to act on

## Tools

Use only: `glob`, `grep`, `read`, `edit`, `bash`, `search_files`, `read_file`, `terminal`.
