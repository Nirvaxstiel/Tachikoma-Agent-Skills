---
name: plan
description: Create executable plans with PAUL methodology - Plan-Apply-Unify Loop with mandatory closure
keywords:
  - plan
  - roadmap
  - design
  - architecture
  - approach
  - paul
  - methodology
  - acceptance criteria
triggers:
  - plan
  - design
  - roadmap
  - approach
  - how to
  - strategy
  - acceptance criteria
  - when/then/given
---

# Plan Skill (PAUL)

Plan-Apply-Unify Loop. **Never skip Unify.** Prevents drift, enforces consistency.

## Three Phases

### 1. PLAN

Define "done" before starting.

Output → `.opencode/plans/PLAN-{id}.md`:

```
---
phase: {phase}
plan: {plan}
type: execute
autonomous: true
---

<objectjective>
{clear objective}
</objective>

<context>
{constraints, assumptions}
</context>

<acceptance_criteria>
AC-1: Given {pre}, When {action}, Then {expected}
AC-2: ...
</acceptance_criteria>

<tasks>
<task type="auto">
  <name>{name}</name>
  <files>{files}</files>
  <action>{action}</action>
  <verify>{verification}</verify>
  <done>{completion criteria}</done>
</task>
</tasks>

<boundaries>
- {in scope / out of scope}
</boundaries>
```

### 2. APPLY

Execute tasks sequentially. Verify each against AC before next. Track deviations. Never skip ahead.

### 3. UNIFY (mandatory)

Reconcile plan vs actual. Output → `.opencode/plans/SUMMARY-{id}.md`:

```
# Summary {id}

## Objective
{from PLAN}

## AC Status
- AC-1: {pass/fail} — {notes}
- AC-2: ...

## Tasks Completed
1. {task} — {status}

## Deviations / Decisions / Unresolved / Next Steps
```

Update `.opencode/plans/STATE.md` → `loop_position: UNIFY`.

## State Transitions

```
PLAN (only when position=none|UNIFY)
  → APPLY (only when position=PLAN)
    → UNIFY (only when position=APPLY) — NEVER SKIP
      → next loop
```

## Quality Gates

**PLAN→APPLY**: all AC documented, ≥1 task, boundaries set, verification steps included.

**APPLY→UNIFY**: all tasks executed or documented why not, verified against AC, deviations noted.

**UNIFY→next**: SUMMARY created, STATE.md updated, no blocking issues.

## Long Sessions

State at `.opencode/plans/`:
```
.opencode/
  plans/
    STATE.md          # loop position, AC status
    PLAN-{id}.md      # PLAN phase output
    SUMMARY-{id}.md   # UNIFY phase output
    artifacts/         # large outputs, test results
```

**Filesystem patterns**: tool outputs >2000 tokens → write to artifacts, return summary + reference.

**Compress context** at 70-80% utilization. Optimize tokens-per-task.

## Integration

1. glob/grep → find patterns
2. read → understand state
3. write/edit → make changes
4. bash → run verification
5. Verify before next task
6. UNIFY before "done"

## Complete When

1. PLAN with AC + boundaries
2. APPLY with verification
3. UNIFY with summary
4. STATE.md updated to UNIFY

**Never stop at APPLY — always UNIFY.**

## Hermes Compatibility

Tachikoma and Hermes share the same PAUL methodology but use different state directories:

| Agent | State Directory |
|-------|----------------|
| **Tachikoma** | `.opencode/plans/` |
| **Hermes** | `.hermes/plans/` |

Both store the same structure:
- `STATE.md` — loop position and AC status
- `PLAN-{id}.md` — PLAN phase output
- `SUMMARY-{id}.md` — UNIFY phase output
- `artifacts/` — large outputs, test results

**Cross-reference**: Hermes also uses the plan skill with PAUL methodology. See [Hermes plan skill](src/skills/plan/SKILL.md) for implementation details.
