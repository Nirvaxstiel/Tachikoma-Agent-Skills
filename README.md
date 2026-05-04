<p align="center">
    <img width="300px" src= "assets/tachikoma1.png" alt="tachikoma1.png">
</p>

# Tachikoma

A general purpose AI agent named after the curious AI tanks from _Ghost in the Shell_.

## Features

- **Checkpoint & Rollback**: Create named checkpoints before risky operations. Supports git stash or file-copy based rollback.
- **Session Memory**: Persistent memory across sessions with repo-local isolation. Memory travels with the repo.
- **Task Delegation**: Spawn subagents for parallel independent workstreams.
- **Cost-Aware Routing**: Match task complexity to optimal execution strategy
- **PAUL Methodology**: Structured Plan-Apply-Unify loop with mandatory closure
- **Verification Loops**: Generator-Verifier-Reviser pattern for complex tasks
- **Position-Aware Context**: Mitigates U-shaped attention bias in LLMs
- **Model-Aware Editing**: Dynamic edit format selection based on model
- **MCP Integration (Optional)**: Leverages external Model Context Protocol servers for enhanced capabilities

## Installation

```bash
bun run install.ts
```

> Interactive installer with three options:
> - **Local** - `.opencode/` (current project only)
> - **Global** - `~/.config/opencode/` (all projects)
> - **Custom** - Specify any installation path

After installation, run `opencode` and use `@tachikoma` in the TUI.

See [Installation Guide](docs/installation.md) for detailed installation options.

## Available Tools

| Tool | Description |
|------|-------------|
| `tachikoma.checkpoint` | Create named checkpoint before risky operations |
| `tachikoma.list-checkpoints` | List available checkpoints |
| `tachikoma.rollback` | Rollback to a previous checkpoint |
| `tachikoma.load-memory` | Load user prefs and project context |
| `tachikoma.save-memory` | Save user/project memory |
| `tachikoma.init-project-memory` | Initialize repo-specific memory |
| `tachikoma.append-session-summary` | Record session with metadata |
| `tachikoma.get-recent-sessions` | Retrieve recent session history |
| `tachikoma.delegate-task` | Spawn subagent for parallel tasks |
| `tachikoma.model-select` | Detect model, select edit format |
| `tachikoma.context-status` | U-shaped position bias config |
| `tachikoma.graph-memory-*` | Graph-based memory queries |

## Available Skills

| Skill | Description |
|-------|-------------|
| `plan` | PAUL methodology planning |
| `dev` | Execute code implementation |
| `context` | Retrieve and manage knowledge |
| `think` | Functional thinking principles |
| `meta` | Self-generating agent topology |
| `self-improving` | Save procedures as skills |
| `caveman` | Token-compressed communication |
| `caveman-commit` | Ultra-compressed commits |
| `caveman-review` | Ultra-compressed reviews |
| `code-review` | Full code review |

## Themes

Ghost in the Shell inspired themes for OpenCode terminal:

| Theme                     | View  | Dark                                                  | Light                                           |
| ------------------------- | ----- | ----------------------------------------------------- | ----------------------------------------------- |
| ghost-in-the-shell        | Start | ![start](assets/tachikoma-dark-theme-gits-solid.png)  | ![start](assets/tachikoma-light-theme-gits.png) |
| lucent-ghost-in-the-shell | Start | ![start](assets/tachikoma-dark-theme-gits-lucent.png) | ![start](assets/tachikoma-light-theme-gits.png) |

> Other screenshots [here](assets/)

### Using Tachikoma Tools

> Tachikoma exposes scripts as OpenCode tools. All core tools are plugin-native (no MCP required).

```bash
@tachikoma Check edit format for current model
# → Uses tachikoma.model-select

@tachikoma Create checkpoint before migration
# → Uses tachikoma.checkpoint

@tachikoma List available checkpoints
# → Uses tachikoma.list-checkpoints

@tachikoma Rollback to latest checkpoint
# → Uses tachikoma.rollback

@tachikoma Load project memory
# → Uses tachikoma.load-memory

@tachikoma Get recent sessions
# → Uses tachikoma.get-recent-sessions

@tachikoma Delegate task to subagent
# → Uses tachikoma.delegate-task
```

## Core Concepts

### Checkpoint & Rollback

Create named checkpoints before risky operations:

1. **checkpoint** — Create named checkpoint (git stash or file-copy)
2. **list-checkpoints** — List all available checkpoints
3. **rollback** — Rollback to specific checkpoint or 'latest'

### Cost-Aware Routing

| Complexity | Strategy          | Latency |
| ---------- | ----------------- | ------- |
| Low        | Direct response   | 1-2s    |
| Medium     | Single skill      | 5-15s   |
| High       | Skill chain       | 15-45s  |
| Very High  | RLM orchestration | 45-120s |

### Session Memory

Persistent memory across sessions with repo-local isolation:

- `load-memory` — Load user prefs and project context
- `save-memory` — Save user/project memory
- `init-project-memory` — Initialize repo-specific memory at `.opencode/PROJECT.md`
- `append-session-summary` — Record session with task, files, decisions
- `get-recent-sessions` — Retrieve recent session history

**Repo-local memory**: `.opencode/PROJECT.md` stays with the repo for team context sharing.

### PAUL Methodology

1. **PLAN**: Define objective, acceptance criteria (Given/When/Then), tasks with verify steps, boundaries
2. **APPLY**: Execute tasks sequentially, each with verification
3. **UNIFY**: Reconcile plan vs actual, update `.tachikoma/state/STATE.md`, create `.tachikoma/state/summary.md`

**Never skip UNIFY** - this is the heartbeat that prevents drift.

### Verification Loops

For complex implementations, use up to 3 verification iterations:

1. GENERATE - Produce initial solution
2. VERIFY - Check with explicit criteria
3. REVISE - Fix based on verification
4. REFLECT - Question approach, flag issues

Use verification for: complex implementations, high-stakes fixes, first-time features, correctness-critical tasks.

## Adding New Scripts

> **Note**: During installation, `src/` is copied to `.opencode/` (the OpenCode convention). Add scripts to the installed location, not `src/`.

1. Create a new `.ts` file in `.opencode/plugin/tachikoma/`:

```typescript
#!/usr/bin/env bun
/**
 * My new capability
 * Description of what it does
 */

const args = Bun.argv.slice(2);

// Your logic here
console.log(`Processing: ${args[0] || "no args"}`);
```

2. Reinstall: `bun run install.ts`

3. Script automatically becomes `tachikoma.my-new-capability` tool!

## Documentation

### Quick Links

- [Getting Started](docs/getting-started.md) - Quick start guide
- [Installation Guide](docs/installation.md) - Installation options and setup
- [src/agents/tachikoma.md](src/agents/tachikoma.md) - Agent configuration

### Full Documentation

- [VitePress Site](https://nirvaxstiel.github.io/Tachikoma-Agent-Skills/)
- [docs/](docs/) - Raw markdown source

## License

MIT
