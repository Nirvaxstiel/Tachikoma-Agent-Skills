---
name: context
description: Retrieve and manage knowledge across codebases, documentation, and large contexts
keywords:
  - research
  - explore
  - find
  - search
  - investigate
  - analyze
  - understand
  - documentation
  - library
  - framework
  - api
  - patterns
  - best practices
  - memory
  - rlm
triggers:
  - research
  - explore
  - find
  - how does
  - understand
  - investigate
  - documentation for
  - best practices for
  - patterns for
  - learn about
  - context for
---

# Context Skill

Research, docs, memory, RLM — four capabilities for knowledge management.

## 1. Research

Process: clarify question → explore sources (glob/grep/web) → synthesize → present.

```
## Research: [Topic]

### Summary
{overview}

### Findings
- {finding} — {source}

### Code References
- @file.ts:line

### Gaps / Recommendations
```

Tips: glob by pattern, grep for content, read key files fully, use @ refs.

## 2. Documentation (Context7)

Live library/framework docs from `https://context7.com/api/v2`.

When: user asks about specific lib/framework, needs API docs, patterns, "how do I..." questions.

```
1. GET /libs/search?libraryName={name}&query={topic} → library ID
2. GET /context?libraryId={id}&query={topic}&type=txt → docs
```

Present: summary, key concepts, code examples, best practices.

## 3. Graph Memory (with meta skill)

### Store when
New code structure, architectural decision, user requirement, bug, solution pattern, API contract.

### Query when
Unfamiliar codebase area, similar implementations, related functionality, dependencies.

### Operations
- `@memory-add-node` — add entities
- `@memory-add-edge` — add relationships
- `@memory-query` — similarity/pattern/traversal search
- `@memory-visualize` — Mermaid diagrams

Performance: 3-5x faster retrieval than linear, 30% context efficiency gain.

## 4. RLM (Recursive Language Models)

Process inputs 100x beyond context windows via symbolic recursion.

LLM writes code calling `sub_LLM()` in loops. Metadata-only history. Results in REPL variables.

```python
chunks = chunk_indices(size=50000)
results = []
for start, end in chunks:
    chunk = peek(start, end)
    result = sub_LLM("Analyze", chunk=chunk)
    if result["success"]:
        results.append(result["result"])
```

**Use when**: context >2000 tokens, entire codebases, large doc sets, 10M+ tokens.

**Skip when**: fits single request, simple localized changes.

| Metric | Result |
|--------|--------|
| Scaling | 100x beyond context windows |
| Accuracy | +28.3% over base |

Tachikoma extensions: adaptive chunking (semantic boundaries), parallel processing (5 chunks/wave), plugin system.

## Routing

Strategy selection via `CostAwareRouter` → `src/constants/router.ts` (`STRATEGY_CONFIG`). Low → direct, medium → single_skill, high → skill_chain, very_high → rlm. Don't hardcode — trust the router.

## Notes

- webfetch for all Context7 API calls
- Cache docs if session may reuse
- Summarize, don't dump
- Actionable patterns > exhaustive docs
- Memory requires meta skill
- RLM uses adaptive chunking + parallel processing
