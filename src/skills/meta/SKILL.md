---
name: meta
description: Coordinate self-generating agent topology and dynamic tools for complex tasks
keywords:
  - meta
  - self-programming
  - dynamic-agents
  - tool-generation
  - orchestration
  - vertical-decompose
  - horizontal-ensemble
triggers:
  - complex multi-step task
  - explore alternatives
  - generate agents
  - create specialized agent
  - dynamic tool
  - orchestrate
---

# Meta Skill

Self-generating agent topology + dynamic tool synthesis (OpenSage framework).

## Principles

1. Create specialized agents dynamically per task
2. Write custom tools at runtime
3. AI decides structure and tools
4. Manage agent lifecycles + result integration

## Vertical Decomposition

Sequential agents for multi-step tasks with dependencies.

```
@vertical-decompose task="..."
  subtasks=["step1", "step2", "step3"]

→ Run sequentially, pass context forward
→ Each agent can spawn subagents
→ Parent integrates results
```

+20% resolved rate (60.2% vs 39.4% baseline). Fewer summarization events (6.4 vs 13.1).

## Horizontal Ensemble

Parallel agents exploring alternative approaches.

```
@horizontal-ensemble task="..."
  strategies=["option A", "option B", "option C"]

→ All run in parallel
→ Analyze + merge best approaches
→ Coordinator selects optimal
```

+15% improvement. Better for tasks with multiple valid approaches.

## Dynamic Tool Generation

When existing tools insufficient:

1. Identify gap
2. Write spec (type, description, params)
3. Implement (TypeScript/Python/Bash)
4. Test immediately
5. Save for reuse

+25% from domain-specific tools. 39 tools generated in CyberGym eval.

## Coordination Flow

Analyze task → generate agents → coordinate execution → integrate results → iterate.

## When to Use

**Use**: multi-step specialization, parallel exploration, domain expertise needed, tool gaps.

**Skip**: simple tasks, single optimal approach, tools sufficient, time-constrained.

## Memory (with context skill)

Store: code structures, decisions, requirements, bugs, patterns, API contracts.

Query: unfamiliar areas, similar implementations, dependencies.

## Performance (OpenSage)

| Config | Resolved |
|--------|----------|
| Full OpenSage | 60.2% |
| No Horizontal | 52.6% |
| No Vertical | 42.8% |
| No Feature | 39.4% |

| Config | Context Efficiency |
|--------|-------------------|
| Graph Memory + Agent | +30% |
| Graph Memory only | +15% |
| Linear Memory | baseline |

## Safety

- Validate generated prompts before execution
- Review generated code for security
- Sandbox untrusted code
- Limit recursion depth in agent spawning
- Enforce permissions on generated tools

## Skill Combos

- **dev**: implement generated agent tasks
- **think**: reason about architectures
- **plan**: structured planning
- **context**: graph memory + knowledge persistence
