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
│   │   └── tachikoma.ts     # Plugin entry (tachikoma.model-select, tachikoma.context-status)
│   │   └── tachikoma/
│   │       ├── context-manager.ts
│   │       ├── model-harness.ts
│   │       ├── core.ts
│   │       ├── verifier.ts
│   │       ├── rlm-handler.ts
│   │       ├── graph-routing/       # Dijkstra routing plugin
│   │       └── opensage/            # Attention ensemble + coordinator
│   ├── skills/                  # 8 skills (caveman, plan, dev, think, etc.)
│   └── agents/
│       └── tachikoma.md         # Primary agent
└── opencode.json                # Copy this to project root
```

## MCP Server

The MCP server is at `src/server/` (merged from tachikoma-mcp repo).

```bash
# Install
pip install -e src/server

# Verify
tachikoma-mcp-python --version
```

**Note:** MCP is still required for `caveman_compress` tool only. Graph memory queries (`tachikoma.graph-memory`) are now plugin-native and communicate with tachikoma directly via subprocess — no MCP dependency.

Tools available via MCP:
- `caveman_compress` — detect compressible text, get compression instructions

Tools available via plugin (native):
- `tachikoma.graph-memory` — graph memory queries (similarity, traversal, stats)

## Verification

```bash
# Check plugin loads
opencode --debug 2>&1 | grep -i tachikoma

# Check skills
opencode skill 2>&1 | grep -i caveman

# Check agent
opencode agent 2>&1 | grep -i tachikoma
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
