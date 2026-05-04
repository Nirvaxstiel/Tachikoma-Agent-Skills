# Skill Tracking: Tachikoma → Hermes Review

## What Tachikoma's System Does

The `skill-tracking` subsystem (5 files, ~1,500 lines of TypeScript) provides:

- **CompetenceModelBuilder** — per-skill numerical competence scores: success rate, avg duration, avg cost, trend (improving/stable/declining), anomaly detection
- **SkillExecutionTracker** — records execution traces: skillId, taskId, duration, success, tool calls, llm calls, cost
- **AdaptiveSkillRouter** — routes tasks to skills based on competence + cost/speed tradeoff (exploration/hybrid/exploitation strategies)
- **TrackingManager** — orchestrates all of the above, persists to `.opencode/skill-learning-metrics.json`

### Core Insight

The system tracks **skill effectiveness over time** and uses that data to make better routing decisions. It's a feedback loop: use skill → record outcome → update competence → route better next time.

## Hermes Reality Check

Hermes skills are **passive markdown**. No runtime code execution. No skill lifecycle hooks. The agent loop is:

```
model → tool_calls → execute → repeat
```

There is no interception point where skill invocations can be automatically recorded. The skill system is purely documentation-driven.

## What Can and Cannot Port

| Component | Portable? | Reason |
|---|---|---|
| CompetenceModel (numerical scores) | **No** | Requires runtime code execution to record traces |
| ExecutionTracker (trace recording) | **No** | Requires hooks into skill loading |
| AdaptiveRouter (competence routing) | **No** | No routing engine in hermes; skills are markdown |
| Feedback Loop (log → review → improve) | **Partial** | Manual logging via memory files |

## What Was Implemented for Hermes

Created `skill-feedback` SKILL.md at `~/.hermes/skills/software-development/skill-feedback/`:

- Teaches manual logging to `~/.hermes/memory/skill-feedback.md`
- Session start ritual: read last ~10 entries to inform skill selection
- Quality rating guide (1-5)
- Standard entry format for scannability

## Nuances Compared to Original Design

1. **Passive vs active** — Original is automatic; hermes version requires explicit agent action. The feedback loop depends on the agent remembering to log.

2. **No numerical tracking** — Original has competence scores, trends, anomaly detection. Hermes version is pure text — no trend analysis, no pattern matching over structured data.

3. **No routing** — Original has a full routing engine (exploration vs exploitation). Hermes has no equivalent. The agent must manually infer from memory entries.

4. **Session-based, not task-based** — Original records every skill invocation per task. Hermes version records at session granularity (which skill was used overall).

## Intentional Skips

- `AdaptiveSkillRouter` — too coupled to opencode's skill registry + tool execution model
- Anomaly detection — requires numerical data
- Batch update API — no equivalent in hermes
- Routing presets (FastLearning, StableLearning, etc.) — hermes has no routing engine to configure

## If Hermes Gets Hooks Someday

The competence model is genuinely valuable. If hermes ever adds:
- Skill lifecycle hooks (before_skill, after_skill)
- A plugin system with execution context
- A structured memory provider

Then port: `CompetenceModelBuilder` + `SkillExecutionTracker` as a JSON-based plugin that writes to `~/.hermes/memory/skill-competence.json`.
