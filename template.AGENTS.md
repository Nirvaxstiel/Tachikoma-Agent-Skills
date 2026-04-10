# Project Context

This file provides project-specific context for Tachikoma agent.

## About This Project

[Project-specific description goes here]

## Architecture

[Project architecture notes go here]

## Tech Stack

[Technology stack details go here]

## Coding Standards

- [Project-specific coding standards]
- [Team conventions]
- [Any deviations from general best practices]

## Development Workflow

[Development workflow specific to this project]

## Deployment

[Deployment instructions and environment-specific notes]

## Important Notes

[Any important project-specific notes that agents should be aware of]

## Tachikoma Installation

This project uses Tachikoma as an OpenCode agent plugin. Tachikoma is installed via:

```bash
bun run install.ts
# Installs to OPENCODE_DIR
# OPENCODE_DIR = {CWD}/{OPENCODE_DIR}/
# If installed globally, ~/.config/opencode/
```

This creates:

- `{OPENCODE_DIR}/plugins/tachikoma.ts` - Plugin that auto-discovers scripts and modules
- `{OPENCODE_DIR}/plugins/tachikoma/*.ts` - Agent modules (core, router, verifier, opensage, etc.)
  - `opensage/graph-memory.ts` - Graph memory with MCP integration
  - `opensage/rlm-handler.ts` - Large context processing with MCP
  - `opensage/coordinator.ts` - Meta orchestration with MCP
  - `graph-routing/` - Graph-based tool routing
  - `verification/` - Verification modules
  - `skills/tracking/` - Skill competence tracking
- `{OPENCODE_DIR}/skills/*/SKILL.md` - Agent Skills (paul, carl, code, planning, research, verification, context7, refactor, git-commit, reasoning)
- `{OPENCODE_DIR}/agents/tachikoma.md` - Agent configuration

## Available Tachikoma Tools

The plugin automatically registers scripts as tools with prefix `tachikoma.`.

**Note**: Some tools integrate with Model Context Protocol (MCP) servers when available:
- Graph memory queries use `tachikoma-mcp_query_graph_memory` (O(log N) retrieval)
- Large context processing uses `tachikoma-mcp_enhanced_rlm_process` (hierarchical indexing)
- All tools have fallbacks to local implementations when MCP is unavailable

**See**: [MCP Integration Documentation](../docs/internals/mcp-integration.md) for details.

OpenCode automatically discovers skills from `{OPENCODE_DIR}/skills/`:

- `skill` tool lists all available skills
- Skills can be loaded by name via the `skill` tool
- Available skills: paul, carl, code, planning, research, verification, context7, refactor, git-commit, reasoning

Add new scripts to `src/plugin/tachikoma/` and they're automatically available!
Add new skills to `{OPENCODE_DIR}/skills/` and they're automatically discovered!

## Project Structure

```pseudocode
project-root/
  ├── .opencode/              # Tachikoma plugin installation. Local Install = .opencode/ | Global Install = ~/.config/opencode/
  │   ├── plugins/
  │   │   ├── tachikoma.ts               # Main plugin file
  │   │   └── tachikoma/                # Agent modules
  │   │       ├── core.ts
  │   │       ├── router.ts
  │   │       ├── verifier.ts
  │   │       ├── context-manager.ts
  │   │       ├── model-harness.ts
  │   │       ├── opensage/                 # OpenSage orchestration (MCP integration)
  │   │       │   ├── graph-memory.ts        # Graph memory with MCP queries
  │   │       │   ├── rlm-handler.ts         # Large context processing with MCP
  │   │       │   ├── coordinator.ts         # Meta orchestration with MCP
  │   │       │   ├── hierarchical-index.ts  # Hierarchical memory indexing
  │   │       │   ├── agent-registry.ts     # Agent registry
  │   │       │   ├── dynamic-tools.ts       # Dynamic tool generation
  │   │       │   ├── attention/             # Attention mechanisms
  │   │       │   └── graph-memory.ts       # Graph memory plugin
  │   │       ├── graph-routing/           # Graph-based tool routing
  │   │       │   ├── tool-graph.ts          # Tool graph implementation
  │   │       │   └── plugin-integration.ts  # Routing plugin
  │   │       ├── verification/            # Verification modules
  │   │       │   ├── deep-verifier.ts       # Deep verification logic
  │   │       │   ├── plugin-integration.ts  # Verification plugin
  │   │       │   ├── gvr-integration.ts     # GVR verification
  │   │       │   ├── failure-taxonomy.ts    # Failure categories
  │   │       │   └── types.ts
  │   │       └── skills/tracking/        # Skill competence tracking
  │   │           ├── competence-model.ts   # Competence model
  │   │           ├── tracking-manager.ts  # Tracking manager
  │   │           ├── adaptive-router.ts    # Adaptive routing
  │   │           ├── execution-tracker.ts # Execution tracking
  │   │           ├── tracking-config.ts   # Configuration
  │   │           └── types.ts
  │   ├── skills/                           # Agent Skills (OpenCode standard)
  │   │   ├── paul/SKILL.md
  │   │   ├── carl/SKILL.md
  │   │   ├── code/SKILL.md
  │   │   ├── planning/SKILL.md
  │   │   ├── research/SKILL.md
  │   │   ├── verification/SKILL.md
  │   │   ├── context7/SKILL.md
  │   │   ├── refactor/SKILL.md
  │   │   ├── git-commit/SKILL.md
  │   │   └── reasoning/SKILL.md
  │   └── agents/
  │       └── tachikoma.md              # Agent configuration
  ├── .tachikoma/            # STATE files (project-local)
  │   ├── state/
  │   │   ├── STATE.md       # Current task state, AC status
  │   │   ├── plan.md        # Original plan
  │   │   ├── summary.md     # UNIFY summary
  │   │   └── artifacts/     # Intermediate files
  │   └── .active-session  # Session tracking
  ├── .gitignore              # Includes .tachikoma/ to avoid committing state
  └── AGENTS.md              # This file (project-specific context)
```

**Note**: `.tachikoma/` is gitignored to prevent committing work state. Each project gets its own state, enabling parallel development without conflicts.
