---
name: dev
description: Execute code implementation with quality verification and refactoring
keywords:
  - code
  - implement
  - build
  - develop
  - write
  - feature
  - refactor
  - verify
  - test
  - fix
triggers:
  - create
  - implement
  - build
  - write code
  - develop
  - add feature
  - refactor
  - clean up
  - improve code
  - fix bug
  - verify
  - test
---

# Dev Skill

Implementation + verification + refactoring specialist.

## Process

1. **Understand** — objective, target files, existing patterns (glob/grep)
2. **Implement** — follow conventions, functional patterns, type safety, explicit errors, small fns
3. **Verify** (GVR loop, max 3x): Generate → Verify against AC → Revise
4. **Report** — changes, files, verification pass/fail, concerns

## Comments

Prefer none. Self-document via: clear names, small fns, types encoding intent.

Comment only: external system interfaces, third-party lib workarounds, non-obvious business logic.

Never: what code does, trivial explanations, TODOs (create issues instead).

## Refactoring

Behavior preserved. Small steps. Test after each. Commit at safe states. One thing at a time.

| Smell | Fix |
|-------|-----|
| Long fn (>50 lines) | Extract methods |
| Duplication | Extract common logic |
| Large class | Split by responsibility |
| Long params | Group into object |
| Nested ifs | Guard clauses / early returns |
| Magic numbers | Named constants |
| Feature envy | Move logic to data owner |
| Primitive obsession | Domain types |

Steps: tests exist → commit → identify smell → one small change → test → commit → repeat.

**Don't refactor**: code that won't change again, untested production code, no clear purpose.

## Verification

Check: syntax (linter), types, error handling, edge cases (null/empty/large), security, tests.

Use verification loops for: complex impl, high-stakes fixes, first-time features, security code.

Skip for: <50 line tasks, prototypes, well-understood patterns.

```
## Verification: [Task]

### AC Check
| AC | Status | Notes |
|----|--------|-------|
| AC-1 | PASS/FAIL | ... |

### Quality
| Check | Status |
|-------|--------|
| Syntax / Types / Errors / Security | PASS/FAIL |

### Verdict
PASS / FAIL / NEEDS_REVISION
```

## Model-Aware Editing

Use `tachikoma.edit-format-selector` MCP tool to select edit format for current model. Config in `src/config/edit-format-model-config.yaml`. Don't hardcode format assumptions — always query the tool.

## Rules

- Define AC before implementing
- Every task gets verification
- Link tasks to AC numbers
- Admit uncertainty
- Don't assume — verify with tests/lints
- Report all findings, not just failures
- Max 3 verification iterations
