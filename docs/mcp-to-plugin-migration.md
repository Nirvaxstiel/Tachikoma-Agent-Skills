# MCP to Plugin Migration Audit

**Repo:** `Tachikoma-MCP`  
**Audited files:** `src/tachikoma_mcp/tools/caveman.py`, `src/tachikoma_mcp/tools/query_graph_memory.py`  
**Date:** 2025-05-04  
**Prepared by:** Hermes Agent

---

## Tool Summary

| Tool | File | Lines | Registered in `server.py` | Recommendation |
|---|---|---|---|---|
| `caveman_compress` | `tools/caveman.py` | 35 (exported fn) | ✅ Yes (line 131) | **Keep** — MCP advisory pattern |
| `caveman_validate` | `tools/caveman.py` | 14 (exported fn) | ❌ No | **Move** — orphaned helper |
| `query_graph_memory` | `tools/query_graph_memory.py` | 101 | ✅ Yes (line 133) | **Move** — stateful, tightly coupled |

---

## Tool 1: `caveman_compress`

**File:** `tools/caveman.py`  
**Server registration:** `handle_list_tools()` / `_dispatch_tool()`  
**Purpose:** Detect whether input content is natural-language text, and if so, return a structured set of compression instructions for the calling agent to execute.

### Assessment

| Dimension | Rating | Notes |
|---|---|---|
| **Complexity** | Low | ~35 LOC for the exported async fn; bulk of file is helpers |
| **External deps** | None | stdlib only (`re`, `json`, `pathlib`) |
| **State** | Stateless | No reads or writes to shared state |
| **Coupling** | Tight | Imports regex constants defined in same file |
| **Reusability** | High | Logic is generic; applicable outside this server |
| **MCP pattern** | Advisory | Returns instructions for agent to follow — a natural fit for MCP's "tool as advisor" role |

**Keep as MCP tool — Rationale:**
1. The tool does not perform the compression itself; it returns structured instructions. This is precisely the advisory pattern MCP was designed for.
2. Zero external dependencies make it safe to keep in-process.
3. No shared state means no synchronisation concerns.
4. The tool's behaviour is deterministic and easy to test in isolation.

---

## Tool 2: `caveman_validate`

**File:** `tools/caveman.py` (same file as `caveman_compress`, same module)  
**Server registration:** ❌ **Not registered** — referenced in `caveman_compress`'s response as a "next step" but never exposed via `handle_list_tools()`.

### Assessment

| Dimension | Rating | Notes |
|---|---|---|
| **Complexity** | Low | ~14 LOC for the exported fn; bulk of logic lives in `_validate_content` |
| **External deps** | None | stdlib only |
| **State** | Stateless | Pure input → validation output |
| **Coupling** | Low | Imports nothing from the server |
| **Current usage** | Zero (orphaned) | Referenced only as a string in `caveman_compress` output |

**Move to plugin — Rationale:**
1. The function is already dead code from a server perspective. It was likely intended to be registered but was never wired in.
2. Keeping it in `caveman.py` (which stays with MCP) creates a false dependency for a plugin.
3. Moving it to a dedicated plugin lets it be developed, versioned, and tested independently.
4. The `cavikoma_validate` tool should be registered in its new plugin's `handle_list_tools()` so it can actually be called.

**Action:** Extract the validation function and `_validate_content` + its helpers (`_extract_headings`, `_extract_code_blocks`, `_extract_urls`, `_extract_paths`, `_count_bullets`) into `plugins/caveman_validator/`.

---

## Tool 3: `query_graph_memory`

**File:** `tools/query_graph_memory.py`  
**Server registration:** `handle_list_tools()` / `_dispatch_tool()`  
**Purpose:** Query an in-memory graph structure (nodes + edges) for similarity searches, breadth-first traversal, and statistics.

### Assessment

| Dimension | Rating | Notes |
|---|---|---|
| **Complexity** | Medium | ~101 LOC; three distinct query modes with separate logic branches |
| **External deps** | None | stdlib + `json` + Pydantic models from `../models` |
| **State** | Stateful | Operates on `graph_nodes` and `graph_edges` globals from `server.py` |
| **Coupling** | Very High | Takes `graph_nodes`/`graph_edges` as runtime arguments injected from server globals; cannot function without them |
| **Reusability** | Low | Entirely coupled to the server's in-memory graph schema |
| **MCP pattern** | Poor fit | Tool returns computed results — more suitable as a direct Python API or gRPC method than an MCP advisory tool |

**Move to plugin — Rationale:**
1. **Stateful coupling is the blocker.** The tool's signature (`graph_nodes: dict, graph_edges: list`) is a direct reference to server-level globals. A plugin cannot own this data without a IPC layer.
2. **"Lean" server goal.** The server.py header explicitly states this is a "Lean" build — `analyze_topology`, `enhanced_rlm_process`, `execute_with_verification`, `learn_skill_outcome`, and `caveman_validate` have already been pruned. `query_graph_memory` is the next candidate.
3. **Architectural cleanliness.** Separating the graph query engine from the MCP transport layer lets each evolve independently.
4. **Implementation gap.** The traversal implementation (lines 72–74) is a stub — it adds arbitrary nodes instead of using `graph_edges`. Moving to a plugin allows this to be developed properly against a real graph library (e.g., NetworkX) without coupling to the MCP server.

**Migration path options:**

| Option | Description | Pros | Cons |
|---|---|---|---|
| **A — Python plugin with IPC** | Expose `query_graph_memory` as a local Python plugin that communicates with the MCP server over a local socket or Redis | Full graph state access | IPC complexity |
| **B — gRPC plugin** | Rewrite the graph engine as a gRPC service; MCP server calls it as a client | Clean separation, language-agnostic | Extra service to deploy |
| **C — Plugin owning its own graph** | Move `GraphNode`/`GraphEdge` models to the plugin; plugin maintains its own graph state; MCP server sends requests via stdin/stdio | Simplest for local-only setup | Duplication of graph schema |

**Recommended: Option C (Plugin owning its own graph).** The MCP server currently holds `graph_nodes` and `graph_edges` as module-level dicts — no persistence, no query engine. Moving ownership to a plugin is a net reduction in server complexity.

---

## Migration Action Plan

### Phase 1 — Immediate (Low Risk)
1. **`caveman_validate` → New plugin `plugins/caveman_validator/`**  
   - Extract `_validate_content` and all its helper functions into the plugin.  
   - Register `caveman_validate` in the plugin's `handle_list_tools()`.  
   - Keep `caveman_compress` in the MCP server; update its `"next_step"` instruction to reference the plugin's tool name.

### Phase 2 — Short Term (Medium Risk)
2. **`query_graph_memory` → New plugin `plugins/graph_query/`**  
   - Extract the function and Pydantic models (`GraphNode`, `GraphEdge`) to the plugin.  
   - Plugin registers `query_graph_memory` under its own `handle_list_tools()`.  
   - Update `server.py` to remove the `query_graph_memory` dispatch branch and drop the `graph_nodes`/`graph_edges` globals.  
   - Fix traversal implementation to properly use `graph_edges` instead of arbitrary node selection.

### Phase 3 — Verification
3. Update `server.py` header comment to reflect pruned tools.
4. Add integration tests in `tests/` for the new plugin packages.
5. Update `README.md` with plugin discovery / installation instructions.

---

## Risks & Caveats

| Risk | Severity | Mitigation |
|---|---|---|
| `caveman_validate` is referenced by string in `caveman_compress` output | Low | Update the "next_step" instruction to use the plugin's fully-qualified tool name |
| `query_graph_memory` traversal is a stub | Medium | Fix traversal to use `graph_edges` before migration; document the stub nature |
| Graph schema duplication (`GraphNode`/`GraphEdge` in two places) | Medium | Keep models in `src/tachikoma_mcp/models.py` and have the plugin import from there (or publish as a shared internal package) |
| No existing plugin architecture in the repo | Medium | Create `src/plugins/` directory with a minimal `Plugin` base class / protocol; document the interface |

---

## Decision Summary

| Tool | Recommendation | Reason |
|---|---|---|
| `caveman_compress` | **Keep in MCP** | Advisory pattern; stateless; zero deps; fits MCP model perfectly |
| `caveman_validate` | **Move to plugin** | Already orphaned; should have been a plugin all along |
| `query_graph_memory` | **Move to plugin** | Statefully coupled to server globals; server header signals intent to prune |
