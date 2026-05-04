---
name: systematic-debugging
description: "4-phase root cause debugging: understand bugs before fixing"
keywords:
  - debugging
  - troubleshoot
  - root cause
  - investigate
  - bug
  - fix
  - error
triggers:
  - debug
  - fix bug
  - troubleshoot
  - investigate
  - root cause
  - why is broken
  - error message
  - test failing
---

# Systematic Debugging

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

**Do NOT fix until you understand WHY it's happening.**

## When to Use

ANY technical issue: test failures, bugs, unexpected behavior, performance problems, build failures.

**Use especially when:**
- Under time pressure
- "Quick fix" seems obvious
- Previous fix didn't work
- Don't fully understand the issue

## Four Phases

---

### Phase 1: Root Cause Investigation

**Before ANY fix attempt:**

1. **Read errors completely**
   - Don't skip past errors or warnings
   - Note line numbers, file paths, error codes

2. **Reproduce consistently**
   - Can you trigger it reliably?
   - Exact steps to reproduce?

3. **Check recent changes**
   - Git diff, recent commits
   - New dependencies, config changes

4. **Gather evidence (multi-component systems)**
   - Log data entering/exiting each component
   - Verify environment/config propagation
   - Identify which component actually fails

5. **Trace data flow**
   - Where does the bad value originate?
   - Keep tracing upstream until source found

**Phase 1 complete when:**
- Error fully understood
- Issue reproduced consistently
- Problem isolated to specific code
- Root cause hypothesis formed

---

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

1. **Find working examples**
   - Similar code that works correctly
   - What works that's different from what's broken?

2. **Compare against reference**
   - read_file complete reference implementation
   - Don't skim — understand fully

3. **Identify differences**
   - List every difference, however small
   - Don't assume "that can't matter"

---

### Phase 3: Hypothesis and Testing

**Scientific method:**

1. **Form single hypothesis**
   - State clearly: "X is root cause because Y"
   - Be specific

2. **Test minimally**
   - Smallest possible change to test hypothesis
   - One variable at a time

3. **Verify before continuing**
   - Worked → Phase 4
   - Didn't work → New hypothesis (don't add more fixes)

---

### Phase 4: Implementation

**Fix root cause, not symptom:**

1. **Create failing test case first**
   - Simplest reproduction
   - Use `plan` skill to structure fix implementation

2. **Implement single fix**
   - Address identified root cause
   - One change at a time

3. **Verify fix**
   - Run regression test
   - Full test suite — no regressions

4. **If fix doesn't work (Rule of Three)**
   - 1-2 fixes → Return to Phase 1 with new info
   - 3+ fixes → STOP, question architecture

---

## Red Flags — STOP

Thinking these means return to Phase 1:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- "One more fix attempt" (after 2+ failures)

**3+ failed fixes = architectural problem. Discuss before continuing.**

---

## Don't Fix Yet

**CRITICAL: Investigation first, fixes after.**

Systematic debugging prevents:
- Masking underlying issues
- Creating new bugs
- Wasting time on symptom fixes

Use `plan` skill after Phase 4 to structure and verify fix implementation.

---

## Quick Reference

| Phase | Activities | Success Criteria |
|-------|------------|------------------|
| 1. Root Cause | Read errors, reproduce, check changes, trace flow | Understand WHAT and WHY |
| 2. Pattern | Find working examples, compare, identify differences | Know what's different |
| 3. Hypothesis | Form theory, test minimally | Confirmed or new hypothesis |
| 4. Implementation | Create test, fix root cause, verify | Bug resolved, tests pass |
