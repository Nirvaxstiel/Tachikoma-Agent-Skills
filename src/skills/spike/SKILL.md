---
name: spike
description: Throwaway experiments to validate feasibility before committing to a build
keywords:
  - spike
  - prototype
  - experiment
  - feasibility
  - throwaway
  - exploration
  - research
  - proof-of-concept
triggers:
  - spike
  - try this
  - prototype
  - before I commit
  - is this possible
  - compare a vs b
  - quick test
  - validate
---

# Spike

Validate feasibility, compare approaches, or surface unknowns. Spikes are throwaway — discard once they've paid their debt.

## When NOT to spike

- Answer is knowable from docs or code — research instead
- Work is production path — use `plan` instead
- Idea already validated — jump to implementation

## Core Loop

```
decompose → research → build → verdict
   ↑_________________________________↓
              iterate
```

## 1. Decompose

Break the idea into 2-5 independent feasibility questions. Present as Given/When/Then:

| # | Spike | Validates (Given/When/Then) | Risk |
|---|-------|----------------------------|------|
| 001 | websocket-streaming | Given a WS connection, when LLM streams tokens, then client receives chunks < 100ms | High |
| 002a | pdf-parse-pdfjs | Given a multi-page PDF, when parsed with pdfjs, then structured text is extractable | Medium |
| 002b | pdf-parse-camelot | Given a multi-page PDF, when parsed with camelot, then structured text is extractable | Medium |

**Types:**
- **standard** — one approach, one question
- **comparison** — same question, different approaches (shared number, letter suffix)

**Order by risk.** The spike most likely to kill the idea runs first.

**Skip decomposition** if the user already defines the spike scope.

## 2. Research (per spike, before building)

1. Brief it — 2-3 sentences: what, why, key risk
2. Surface competing approaches:

   | Approach | Tool/Library | Pros | Cons | Status |

3. Pick one. State why.
4. Skip research for pure logic with no external dependencies.

## 3. Build

One directory per spike. Keep standalone.

```
spikes/
├── 001-websocket-streaming/
│   ├── README.md
│   └── main.py
├── 002a-pdf-parse-pdfjs/
└── 002b-pdf-parse-camelot/
```

**Bias toward something the user can interact with:**
1. Runnable CLI with observable output
2. Minimal HTML page
3. Small web server with one endpoint
4. Unit test with recognizable assertions

**Depth over speed.** Test edge cases. Follow surprising findings.

**Avoid** unless required: complex package managers, build tools, Docker, config systems. Hardcode everything.

**Comparison spikes (002a / 002b)** — build back to back, then do a head-to-head.

## 4. Verdict

Each `README.md` closes with:

```markdown
## Spike Verdict: ADOPT | DEFER | REJECT

### What worked
- ...

### What didn't
- ...

### Surprises
- ...

### Recommendation
- ...
```

| Verdict | Meaning |
|---------|---------|
| **ADOPT** | Core question answered yes, with evidence |
| **DEFER** | Works under constraints — document them |
| **REJECT** | Doesn't work for this reason — successful spike |

### Comparison Head-to-Head

```markdown
## Head-to-head: pdfjs vs camelot

| Dimension | pdfjs (002a) | camelot (002b) |
|-----------|--------------|----------------|
| Extraction quality | 9/10 structured | 7/10 table-only |
| Setup complexity | npm install, 1 line | pip + ghostscript |
| Perf on 100-page PDF | 3s | 18s |

**Winner:** pdfjs for our use case.
```

## Output

- `spikes/` in repo root
- One dir per spike: `NNN-descriptive-name/`
- `README.md` per spike with question, approach, results, verdict
- Keep code throwaway — a spike that takes 2 days to clean up was a bad spike

## After a Successful Spike

Use the `plan` skill to turn findings into implementation. Spike validates the path; plan defines the build.

## Frontier Mode

If spikes already exist and the user asks what to spike next, look for:
- Integration risks between validated spikes
- Data handoffs assumed but unproven
- Gaps in the vision
- Alternative approaches for DEFER or REJECT spikes

Propose 2-4 candidates as Given/When/Then. Let the user pick.
