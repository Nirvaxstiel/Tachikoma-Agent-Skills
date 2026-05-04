# Installation

## Prerequisites

- [OpenCode](https://opencode.ai)
- Bun (for running TypeScript plugin)
- Python 3.14+ (for MCP server)

## Quick Start

```bash
# 1. Install the agent plugin
bun run install.ts

# 2. Install the MCP server (from tachikoma-mcp submodule)
pip install -e src/server

# 3. Copy opencode.json to your project root
cp /path/to/tachikoma-agent-skills/opencode.json /path/to/your-project/

# 4. Run opencode
opencode
```

## What Gets Installed

```
.opencode/                    # Installed by install.ts
├── src/
│   ├── plugin/
│   │   ├── tachikoma.ts     # Plugin entry
│   │   └── tachikoma/
│   │       ├── context-manager.ts
│   │       ├── model-harness.ts
│   │       ├── core.ts
│   │       ├── verifier.ts
│   │       ├── rlm-handler.ts
│   │       ├── topology-classifier.ts
│   │       ├── model-select.ts
│   │       ├── memory/
│   │       │   ├── user-memory.ts      # USER.md / PROJECT.md memory
│   │       │   ├── session-summary.ts  # Session history
│   │       │   └── graph-memory-plugin.ts  # Graph-based memory queries
│   │       ├── delegation/
│   │       │   └── subagent-pool.ts    # Subagent spawning
│   │       ├── rollback/
│   │       │   └── checkpoint-manager.ts  # Checkpoint/rollback system
│   │       ├── graph-routing/       # Dijkstra routing plugin
│   │       └── opensage/            # Attention ensemble + coordinator
│   ├── skills/                  # 10 skills (see Skills section)
│   └── agents/
│       └── tachikoma.md         # Primary agent
├── plans/                       # Plan skill state (PAUL methodology)
│   ├── STATE.md
│   ├── PLAN-{id}.md
│   └── SUMMARY-{id}.md
├── checkpoints/                 # Checkpoint storage (non-git repos)
└── opencode.json                # Copy this to project root
```

### Available Tools

Tachikoma provides **12 native tools** (all plugin-native, no MCP required for core functionality):

| Tool | Description |
|------|-------------|
| `tachikoma.model-select` | Detect active model and select best edit format |
| `tachikoma.context-status` | Load project context with U-shaped position bias |
| `tachikoma.graph-memory` | Graph memory queries (similarity, traversal, stats) |
| `tachikoma.load-memory` | Load user prefs and project context (checks repo-local first) |
| `tachikoma.init-project-memory` | Initialize repo-specific project memory at `.opencode/PROJECT.md` |
| `tachikoma.save-memory` | Save user/project memory (creates files on first use) |
| `tachikoma.append-session-summary` | Append session summary with task, files modified, decisions |
| `tachikoma.get-recent-sessions` | Retrieve recent session summaries (filterable by count/days) |
| `tachikoma.delegate-task` | Spawn subagent for parallel independent workstreams |
| `tachikoma.checkpoint` | Create named checkpoint before risky operations (git stash or file copy) |
| `tachikoma.list-checkpoints` | List available checkpoints with metadata |
| `tachikoma.rollback` | Rollback to previous checkpoint (use 'latest' or specific ID) |

### Available Skills

| Skill | Description |
|-------|-------------|
| `plan` | PAUL methodology - Plan-Apply-Unify Loop with mandatory closure |
| `dev` | Execute code implementation with quality verification |
| `context` | Retrieve and manage knowledge across codebases, documentation, and large contexts |
| `think` | Functional thinking principles for code design |
| `meta` | Self-generating agent topology and dynamic tool synthesis (OpenSage) |
| `self-improving` | Save completed procedures as reusable skills |
| `caveman` | Token-compressed communication (65-75% reduction) |
| `caveman-commit` | Ultra-compressed Conventional Commits messages |
| `caveman-review` | Ultra-compressed code review comments |
| `code-review` | Full code review for correctness, quality, security, maintainability |

### MCP Integration (Optional)

The MCP server (`src/server/`) is **optional** for feat/v2. It provides additional capabilities:

- `caveman_compress` — detect compressible text, get compression instructions
- Enhanced graph memory queries (alternative to plugin-native)
- Enhanced RLM processing (alternative to plugin-native)

**MCP smoke tests status**: See `tests/mcp/` for MCP server and configuration tests. Run with:
```bash
bun test tests/mcp/
```

### Memory Directory

```
~/.opencode/memory/           # Global memory (shared across all projects)
├── USER.md                   # User preferences and communication style
├── PROJECT.md                # Default project conventions and decisions
└── SESSION/                  # Timestamped session summaries
    └── session_YYYY-MM-DD_HH-MM-SS.md
```

#### Repo Isolation (Recommended)

Each repository can have its own `.opencode/PROJECT.md` for repo-isolated memory. This mirrors hermes profiles — each repo has its own isolated memory that stays with the repository.

```
# Repo-local memory (at repo root)
./.opencode/PROJECT.md          # Repo-specific memory (takes priority)
```

**How it works:**
- `tachikoma.load-memory` checks for `cwd/.opencode/PROJECT.md` first (repo-local)
- Falls back to `~/.opencode/memory/PROJECT.md` if no repo-local file exists
- The repo-local `.opencode/PROJECT.md` stays with the repository (commit it to git!)

**Initialize repo memory:**
```bash
# Use the tool
tachikoma.init-project-memory

# Or manually
mkdir -p .opencode && cp ~/.opencode/memory/PROJECT.md ./.opencode/PROJECT.md
```

**Benefits:**
- Memory travels with the repo (team members get context automatically)
- No cross-repo contamination of conventions/decisions
- Can be versioned and shared via git

**Tools for memory management**:
- `tachikoma.load-memory` — Load user prefs and project context (checks repo-local first)
- `tachikoma.init-project-memory` — Initialize repo memory at cwd/.opencode/PROJECT.md
- `tachikoma.save-memory` — Save user/project memory (creates files on first use)
- `tachikoma.append-session-summary` — Record session summary with metadata
- `tachikoma.get-recent-sessions` — Retrieve recent session history (filterable by count/days)

## MCP Server

The MCP server is **optional** in feat/v2. Most functionality is now plugin-native.

```bash
# Install (optional)
pip install -e src/server

# Verify
tachikoma-mcp-python --version
```

### What MCP Provides (Optional)

- `caveman_compress` — detect compressible text, get compression instructions
- Enhanced graph memory queries (alternative to plugin-native)
- Enhanced RLM processing (alternative to plugin-native)

### Plugin-Native Tools (Default)

The following tools run without MCP:

| Tool | Description |
|------|-------------|
| `tachikoma.graph-memory` | Graph memory queries (plugin-native) |
| `tachikoma.delegate-task` | Spawn subagent for parallel tasks |
| `tachikoma.checkpoint` | Create checkpoint before risky ops |
| `tachikoma.list-checkpoints` | List available checkpoints |
| `tachikoma.rollback` | Rollback to previous checkpoint |

## Verification

```bash
# Check plugin loads
opencode --debug 2>&1 | grep -i tachikoma

# Check skills
opencode skill 2>&1 | grep -i tachikoma

# Check agent
opencode agent 2>&1 | grep -i tachikoma

# Run smoke tests
bun test tests/smoke/

# Run MCP tests (if MCP installed)
bun test tests/mcp/
```

## After Installation

```bash
opencode
```

Then in OpenCode TUI:

```
@tachikoma help me refactor this function
```

Or use skills directly:

```
@plan design this system
@caveman review this commit
@dev implement this feature
```

## Troubleshooting

### Plugin not loading

Ensure `opencode.json` is in your project root (same directory you run `opencode` from).

### MCP tools not available

```bash
# Check MCP server starts
tachikoma-mcp-python
# Should not error on import

# Check opencode sees MCP
opencode --debug 2>&1 | grep -i mcp
```

### Skills not showing

Skills must be in `src/skills/*/SKILL.md`. The install script copies `src/` to `.opencode/`.
