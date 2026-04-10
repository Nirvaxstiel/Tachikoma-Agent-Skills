# MCP Integration

Tachikoma integrates with two Model Context Protocol (MCP) servers to extend capabilities and reduce code duplication.

## Integrated MCPs

### Tachikoma-MCP
**Repository**: https://github.com/Nirvaxstiel/Tachikoma-MCP

Provides meta-orchestration capabilities for agent topology and dynamic tool generation:

**Tools Used:**
- `tachikoma-mcp_analyze_topology` - Analyzes task complexity for optimal agent topology
- `tachikoma-mcp_execute_with_verification` - Executes operations with verification loops
- `tachikoma-mcp_learn_skill_outcome` - Tracks skill execution outcomes for learning
- `tachikoma-mcp_query_graph_memory` - Queries graph-based knowledge store
- `tachikoma-mcp_enhanced_rlm_process` - Processes large contexts with hierarchical indexing

**Code Integration:**
- `src/plugin/tachikoma/opensage/coordinator.ts` - Topology analysis
- `src/plugin/tachikoma/opensage/graph-memory.ts` - Graph memory queries
- `src/plugin/tachikoma/rlm-handler.ts` - Large context processing

### jcodemunch-mcp
**Repository**: https://github.com/jgravelle/jcodemunch-mcp/

Provides codebase indexing and navigation capabilities:

**Tools Used:**
- `jcodemunch-mcp_index_folder` - Indexes local codebase
- `jcodemunch-mcp_get_file_tree` - Retrieves file tree structure
- `jcodemunch-mcp_get_file_outline` - Gets symbols in a file
- `jcodemunch-mcp_get_symbol` - Retrieves symbol implementation
- `jcodemunch-mcp_search_symbols` - Searches across symbols
- `jcodemunch-mcp_search_text` - Full-text search in files
- `jcodemunch-mcp_find_references` - Finds symbol usage
- `jcodemunch-mcp_search_columns` - Searches model metadata

**Code Integration:**
- Used via OpenCode's LSP integration
- No direct `src/` calls - accessed through OpenCode agent context

## Integration Strategy

### Direct Calls (Tachikoma-MCP)

Some modules directly call MCP tools through `globalThis.mcpTools`:

```typescript
// Example from graph-memory.ts
const result = await globalThis.mcpTools?.queryGraphMemory?.({
  query_type: "similarity",
  query: args.query,
  depth_limit: 3,
});
```

### Fallback Behavior

When MCP tools are unavailable, the codebase falls back to local implementations:

```typescript
// Example from rlm-handler.ts
try {
  const mcpResult = await globalThis.mcpTools.enhancedRLMProcess({...});
  return mcpResult;
} catch (error) {
  console.log("MCP tool unavailable, using local fallback");
  return localProcessing();
}
```

### Replaced Functionality

The following functionality has been removed from `src/` in favor of MCP tools:

| Removed File | Lines Removed | MCP Tool Replacement |
|-------------|---------------|----------------------|
| `edit-format-selector.ts` | 248 | `tachikoma.edit-format-selector` |
| `where.ts` | 69 | `tachikoma.where` |
| `hierarchical-index-plugin.ts` | 171 | `tachikoma-mcp_enhanced_rlm_process` |
| `graph-memory.ts` (query portion) | 78 | `tachikoma-mcp_query_graph_memory` |

**Total Reduction**: 566 lines removed from codebase

## Preserved Local Functionality

Not all functionality is replaced. Some features remain in `src/` because they're unique to this agent:

### graph-memory.ts (Local Only)
- `tool.execute.after` - Tracks tool execution errors automatically
- `session.compacted` - Cleans up old events
- `memory-add-node` - Manual node creation
- `memory-add-edge` - Manual edge creation
- `memory-compress-session` - Session-specific compression
- `memory-visualize` - Local graph visualization

### rlm-handler.ts (Local + MCP)
- Configuration management
- Adaptive chunking detection
- Local fallback processing

## Performance Characteristics

### Graph Memory Queries
- **With MCP**: O(log N) retrieval via hierarchical indexing
- **Without MCP**: O(N) linear scan
- **Speedup**: ~3.6x for typical queries

### Large Context Processing
- **With MCP**: Hierarchical indexing with semantic boundaries
- **Without MCP**: Fixed-size chunking
- **Improvement**: Better semantic coherence, adaptive chunking

## Development Notes

### Adding MCP Tool Calls

To add new MCP tool integrations:

1. Check `globalThis.mcpTools` availability
2. Provide fallback to local implementation
3. Log MCP usage for debugging
4. Handle errors gracefully

Example:
```typescript
async function myOperation(args: any) {
  try {
    if (globalThis.mcpTools?.someTool) {
      return await globalThis.mcpTools.someTool(args);
    }
    throw new Error("MCP tool not available");
  } catch (error) {
    console.log("MCP failed, using local:", error);
    return localImplementation(args);
  }
}
```

### Testing Without MCP

The codebase works without MCP tools installed:
- All MCP calls have fallbacks
- Tests use local implementations
- Plugin system tests mock MCP availability

### Type Safety

MCP tools are accessed via optional chaining:
```typescript
globalThis.mcpTools?.toolName?.(args)
```

This prevents runtime errors when MCP tools aren't loaded.

## Troubleshooting

### MCP Tools Not Available

If you see "MCP tool not available" messages:

1. Check MCP server configuration in OpenCode
2. Verify `globalThis.mcpTools` is populated
3. Check MCP server logs for errors
4. Ensure MCP tools are registered

### Fallback Always Triggered

If fallbacks always trigger:

1. Verify MCP server is running
2. Check network connectivity to MCP server
3. Review MCP tool registration
4. Check OpenCode MCP integration

### Performance Issues

If MCP calls are slow:

1. Check MCP server performance metrics
2. Reduce query complexity (smaller topK, shallower depth)
3. Enable query caching in MCP configuration
4. Consider batching multiple queries

## References

- [MCP Specification](https://modelcontextprotocol.io/)
- [Tachikoma-MCP Repository](https://github.com/Nirvaxstiel/Tachikoma-MCP)
- [jcodemunch-mcp Repository](https://github.com/jgravelle/jcodemunch-mcp/)
- [OpenCode Documentation](https://github.com/anomalyco/opencode)
