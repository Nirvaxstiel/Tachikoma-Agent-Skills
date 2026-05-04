# Hermes Agent → OpenCode Enhancement Research

**Date:** 2026-05-04
**Purpose:** Identify 3–5 Hermes Agent features with the highest potential to enhance OpenCode, with concrete implementation hints.
**Sources:** [Hermes Agent Docs](https://hermes-agent.nousresearch.com/docs/), [GitHub README](https://github.com/NousResearch/hermes-agent), hermes-agent skill (`~/.hermes/skills/autonomous-ai-agents/hermes-agent`), OpenCode docs.

---

## Background: Feature Gap Summary

| Feature | Hermes Agent | OpenCode |
|---|---|---|
| Self-improving skills | ✅ Auto-created + reused | ❌ None |
| Persistent cross-session memory | ✅ MEMORY.md, USER.md | ❌ None |
| Subagent delegation (`delegate_task`) | ✅ Isolated context, restricted toolsets | ⚠️ Subagents exist but no programmatic delegation tool |
| Filesystem checkpoints + `/rollback` | ✅ Auto-snapshot before changes | ⚠️ `/undo` reverts last diff, no filesystem snapshot |
| Scheduled cron tasks | ✅ Natural language scheduling, platform delivery | ❌ None |
| Batch/trajectory processing | ✅ Parallel + ShareGPT export for RL | ❌ None |
| Context files (CLAUDE.md, SOUL.md) | ✅ Auto-discovery | ⚠️ AGENTS.md only |
| MCP as server (`hermes mcp serve`) | ✅ Expose as OpenAI-compatible endpoint | ❌ |
| Profiles (isolated configs) | ✅ Multiple independent instances | ⚠️ Per-project agents |
| Credential/API key pools | ✅ Auto-rotate across multiple keys | ❌ Single key per provider |
| Voice mode | ✅ STT + TTS, 10 providers | ❌ |

---

## Top 5 Actionable Items

### 1. Implement a Self-Improving Skills System

**Why it matters:** Hermes's defining differentiator. When it solves a complex problem it saves the procedure as a skill; future sessions load it on demand. OpenCode has agents but no procedural-memory layer — every session starts from scratch.

**What to build:**
A `~/.opencode/skills/` directory (global) and `.opencode/skills/` (per-project) containing `SKILL.md` files with YAML frontmatter. Skills are loaded via:
- Auto-discovery on session start (scan for relevant skills by tag).
- Explicit invocation via `/skill <name>` or `@skill <name>` in the prompt.
- Autonomous creation: after a multi-turn complex task, the agent offers to save the procedure.

**Implementation hints:**

```
# Skill file structure (agentskills.io-compatible)
---
name: tdd-workflow
description: Red-Green-Refactor TDD loop for Python
tags: [python, testing, tdd, devops]
---

# TDD Workflow Skill

## When to Use
Use this when the user asks to implement a feature in Python and no tests exist.

## Steps
1. Write a failing test in `tests/`
2. Run it: `pytest tests/test_feature.py`
3. Implement the minimum code to pass
4. Refactor
5. Repeat until feature complete

## Pitfalls
- Don't skip step 1
- Keep tests isolated; mock external services
```

- **Frontmatter schema:** `name`, `description`, `tags[]`, `author`, `version`.
- **Skill registry:** `~/.opencode/skills/index.json` (or SQLite) tracking installed skills, tags, last-used.
- **Auto-load logic:** At session start, scan `tags` for keywords matching the conversation context (e.g., project language, framework from AGENTS.md).
- **Hermes skill compat:** Skills following the `agentskills.io` open standard are portable — an OpenCode skill works in Hermes too.
- **Skill self-improvement:** After running a skill, the agent notes deviations and appends corrections to the skill file.
- **CLI commands:**
  ```
  opencode skills list
  opencode skills search <query>
  opencode skills install <url-or-id>
  opencode skills publish
  ```

---

### 2. Add Persistent Cross-Session Memory

**Why it matters:** Hermes remembers "who you are, your preferences, environment details, and lessons learned" across sessions via curated `MEMORY.md` and `USER.md`. OpenCode has no memory — each session is isolated.

**What to build:**
A layered memory system:

1. **`~/.opencode/memory/USER.md`** — User identity, preferences, environment. Written once during onboarding (`opencode setup`), updated when user corrects or teaches something.
2. **`~/.opencode/memory/MEMORY.md`** — Project and session lessons. Created per project root; summaries of complex decisions, gotchas, architecture rationale.
3. **`~/.opencode/memory/SUMMARY.md`** — Session-level summary appended at end of each session. At next session start, inject the last 3–5 session summaries.

**Memory nudge pattern (from Hermes):** Periodically (e.g., every N turns or at session end), the agent asks itself "Should I remember this?" and if yes, writes to the appropriate memory file.

**Implementation hints:**

```
~/.opencode/
  memory/
    USER.md          # Global user preferences
    SESSION/        # Session-level summaries
      2026-05-04_143052.md
      2026-05-03_091200.md
  projects/
    myrepo/
      MEMORY.md     # Per-project context and decisions
```

- **Auto-injection:** At session start, read `USER.md` and last 3 session summaries; inject into system prompt.
- **Memory tool:** A `remember` tool the agent calls to write to memory files (or the user triggers via `/remember <fact>`).
- **Memory pruning:** After 50 sessions, older summaries are compacted into a weekly digest.
- **Honcho/Mem0 compatibility:** Could optionally plug in Honcho dialectic user modeling or Mem0 for richer personalization. See Hermes's `memory` config section.
- **Config option:** `opencode config set memory.enabled true`

---

### 3. Subagent Delegation via `delegate_task` Tool

**Why it matters:** Hermes's `delegate_task` tool lets the agent programmatically spawn child agents for parallel workstreams — 3 concurrent by default. OpenCode has subagents (General, Explore) but no `delegate_task` tool — the agent can't autonomously spawn subagents during a task.

**What to build:**
A `delegate_task` tool callable by the Build agent:

```json
{
  "name": "delegate_task",
  "description": "Spawn a subagent to run a task in parallel. Returns when the subagent completes.",
  "parameters": {
    "type": "object",
    "properties": {
      "task":    { "type": "string", "description": "The task description for the subagent" },
      "agent":   { "type": "string", "description": "Subagent to use: 'general', 'explore', or custom" },
      "tools":   { "type": "array",  "description": "Allowed toolsets override" }
    },
    "required": ["task", "agent"]
  }
}
```

**Implementation hints:**

- Subagent runs in an isolated subprocess (Python `subprocess.Popen` or `asyncio`), separate conversation log file.
- Parent waits for completion (or times out at configurable `max_duration`).
- Subagent has a restricted toolset by default (configurable per subagent type).
- Max concurrent subagents: `opencode config set delegation.max_concurrent 3`.
- The subagent result is a text summary injected back into the parent's context.
- **Hermes parallelization pattern:** Use `--worktree` / git worktree to prevent conflicts when subagents edit the same repo in parallel.
- **Use case:** Agent encounters a complex multi-step refactor — spawns 3 subagents: one for the backend, one for the frontend, one for tests. Parent coordinates and merges.
- **tmux integration (Hermes pattern):** For long-lived interactive subagents, use tmux sessions. OpenCode can follow the same pattern.

---

### 4. Filesystem Checkpoints + `/rollback` Command

**Why it matters:** Hermes automatically snapshots the working directory before making file changes. If something goes wrong, `/rollback` restores from the snapshot. OpenCode's `/undo` only reverts the last diff — it can't recover from a cascade of changes or corrupted state.

**What to build:**
A checkpoint system triggered before any file-modifying operation:

**Checkpoint strategy:**
- Before any `patch`, `write_file`, or multi-step build operation, snapshot the affected directory to `~/.opencode/checkpoints/<session-id>/<timestamp>/`.
- Use `rsync --delete` or `cp -al` (copy-on-write hardlinks) for efficiency.
- Store a manifest of changed files and the git HEAD SHA at snapshot time.

**Implementation hints:**

```bash
# Snapshot command
rsync -a --delete --link-dest=<last_snapshot> \
  /path/to/project/ \
  ~/.opencode/checkpoints/<session>/<timestamp>/

# Rollback
cp -a ~/.opencode/checkpoints/<session>/<timestamp>/ \
  /path/to/project/
```

- **Max snapshots:** `opencode config set checkpoints.max 50` — prune oldest.
- **Per-session isolation:** Each session gets its own checkpoint tree.
- **Manifest:** JSON file listing `{timestamp, git_sha, files[], parent_snapshot}` for navigation.
- **Rollback CLI:** `opencode rollback [N]` — N steps back (default 1).
- **Rollback in-chat:** `/rollback [N]` — the agent can also trigger it.
- **Incremental snapshots:** Only snapshot directories that will be modified (detected from the agent's planned actions).
- **Integration:** Hook into the existing patch/write_file tool paths. No need to wrap every tool — intercept at the execution layer.

---

### 5. MCP Server Mode (`opencode mcp serve`)

**Why it matters:** Hermes can run as an MCP server (`hermes mcp serve`) exposing its tools via the Model Context Protocol, allowing any MCP client to access Hermes's capabilities. OpenCode has MCP client support (connecting to servers) but no server mode — it can't be consumed by other tools.

**What to build:**
`opencode mcp serve` — OpenCode runs as a stdio-mode MCP server that other AI tools (Claude Desktop, Cursor, Windsurf, etc.) can connect to.

**Implementation hints:**

- Hermes's MCP server implementation is in `hermes_cli/commands.py` and the MCP protocol handler. Reference: [docs/user-guide/features/mcp](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp).
- **Stdio transport:** MCP clients connect via stdin/stdout JSON-RPC. Use the Python `mcp` package or implement the protocol manually.
- **Tool exposure:** Expose OpenCode's core tools (file read/write/patch, terminal, search) as MCP tool schemas.
- **Config:**
  ```
  opencode config set mcp.enabled true
  opencode config set mcp.port 8765  # or stdio
  ```
- **Provider agnostic:** Since OpenCode already supports any LLM provider, the MCP server can route tool calls through whatever model is configured — giving MCP clients (like Claude Desktop) access to OpenCode's multi-provider flexibility.
- **Reverse integration:** Also add `opencode mcp add <name>` (MCP client mode) so OpenCode can connect to external MCP servers. This is bidirectional MCP support.

---

## Summary Table

| # | Feature | Complexity | Impact | First Step |
|---|---|---|---|---|
| 1 | Skills System | High | Transformative | Define SKILL.md schema, build skill registry, add CLI commands |
| 2 | Persistent Memory | Medium | High | Add `~/.opencode/memory/` dir, inject at session start |
| 3 | `delegate_task` Tool | Medium | High | Add tool schema, subprocess runner, result injection |
| 4 | Checkpoints + `/rollback` | Low-Medium | Medium | Hook into patch/write_file layer, add rollback CLI |
| 5 | MCP Server Mode | Medium | Medium | Reference Hermes MCP impl, expose stdio JSON-RPC |

## Reference Links

- Hermes Agent docs: https://hermes-agent.nousresearch.com/docs/
- Hermes GitHub: https://github.com/NousResearch/hermes-agent
- Skills system (Hermes): https://hermes-agent.nousresearch.com/docs/user-guide/skills/
- MCP integration: https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
- Delegation tool: https://hermes-agent.nousresearch.com/docs/user-guide/features/overview
- agentskills.io (skill standard): https://agentskills.io
- OpenCode agents docs: https://dev.opencode.ai/docs/agents
