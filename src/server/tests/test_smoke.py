"""
Smoke tests for Tachikoma-MCP Python server.

Tests:
1. Import check — server.py loads without errors
2. Tool registration — exactly 2 tools registered
3. Valid JSON output from tools
"""

import asyncio
import json
import sys
from typing import List

import pytest


# ─── 1. Import check ─────────────────────────────────────────────────────────

def test_server_module_imports_without_error():
    """server.py must load without any ImportError or SyntaxError."""
    # Re-import to exercise the full module body (registration decorators run
    # at import time, so this also catches AttributeError in handlers).
    import importlib
    mod = importlib.import_module("tachikoma_mcp.server")
    importlib.reload(mod)  # ensure decorators fire again
    assert mod is not None


# ─── 2. Tool registration ──────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_exactly_two_tools_registered():
    """
    The MCP server must expose exactly 2 tools:
      - caveman_compress
      - query_graph_memory
    """
    from tachikoma_mcp.server import handle_list_tools
    from mcp.types import ListToolsRequest

    request = ListToolsRequest(method="tools/list")
    result = await handle_list_tools(request)

    tool_names = [t.name for t in result.tools]
    assert set(tool_names) == {"caveman_compress", "query_graph_memory"}, (
        f"Expected exactly 2 tools, got {len(tool_names)}: {tool_names}"
    )
    assert len(result.tools) == 2


@pytest.mark.asyncio
async def test_tool_handler_unknown_tool_raises():
    """Calling an unknown tool must raise ValueError."""
    from tachikoma_mcp.server import _dispatch_tool

    with pytest.raises(ValueError, match="Unknown tool"):
        await _dispatch_tool("nonexistent_tool", {})


# ─── 3. Valid JSON output from tools ─────────────────────────────────────────

@pytest.mark.asyncio
async def test_caveman_compress_returns_valid_json():
    """caveman_compress must return valid, parseable JSON."""
    from tachikoma_mcp.tools.caveman import caveman_compress

    result = await caveman_compress({
        "content": "This is a simple test document with natural language content.",
        "file_path": "test.txt",
    })

    # Must not raise
    data = json.loads(result)

    # Structure assertions
    assert isinstance(data, dict)
    assert "compressible" in data
    assert data["compressible"] is True
    assert "file_type" in data
    assert data["file_type"] == "natural_language"
    assert "instructions" in data
    assert "validation_rules" in data
    assert isinstance(data["validation_rules"], list)


@pytest.mark.asyncio
async def test_caveman_compress_rejects_empty_content():
    """caveman_compress with no content must return a valid JSON error."""
    from tachikoma_mcp.tools.caveman import caveman_compress

    result = await caveman_compress({"content": ""})

    data = json.loads(result)
    assert isinstance(data, dict)
    assert "error" in data or "is_valid" in data


@pytest.mark.asyncio
async def test_caveman_compress_rejects_code_content():
    """caveman_compress must reject code-like content."""
    from tachikoma_mcp.tools.caveman import caveman_compress

    result = await caveman_compress({
        "content": "def foo():\n    return 42\n",
        "file_path": "test.py",
    })

    data = json.loads(result)
    assert data["compressible"] is False
    assert data["file_type"] in ("code", "config")


@pytest.mark.asyncio
async def test_query_graph_memory_similarity_returns_valid_json():
    """query_graph_memory with similarity query must return valid JSON."""
    from tachikoma_mcp.tools.query_graph_memory import query_graph_memory

    result = await query_graph_memory(
        {
            "query_type": "similarity",
            "properties_filter": {"type": "tool"},
        },
        {},   # graph_nodes
        [],   # graph_edges
    )

    data = json.loads(result)
    assert isinstance(data, dict)
    assert data["query_type"] == "similarity"
    assert "matches" in data
    assert "total_matches" in data
    assert isinstance(data["matches"], list)


@pytest.mark.asyncio
async def test_query_graph_memory_traversal_returns_valid_json():
    """query_graph_memory with traversal query must return valid JSON."""
    from tachikoma_mcp.tools.query_graph_memory import query_graph_memory

    result = await query_graph_memory(
        {
            "query_type": "traversal",
            "start_node": "nonexistent_node",
            "depth_limit": 2,
        },
        {},   # graph_nodes
        [],   # graph_edges
    )

    data = json.loads(result)
    assert isinstance(data, dict)
    # When start_node is not found, the result contains an "error" key
    if "error" in data:
        assert "available_nodes" in data
    else:
        # If the node exists and traversal runs, check traversal fields
        assert data["query_type"] == "traversal"
        assert "path" in data
        assert "nodes_visited" in data


@pytest.mark.asyncio
async def test_query_graph_memory_stats_returns_valid_json():
    """query_graph_memory with default / stats query must return valid JSON."""
    from tachikoma_mcp.tools.query_graph_memory import query_graph_memory

    result = await query_graph_memory({}, {}, [])

    data = json.loads(result)
    assert isinstance(data, dict)
    assert data["query_type"] == "stats"
    assert "total_nodes" in data
    assert "total_edges" in data


# ─── 4. Dispatch layer ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_dispatch_caveman_compress():
    """_dispatch_tool must correctly route and return JSON for caveman_compress."""
    from tachikoma_mcp.server import _dispatch_tool

    result = await _dispatch_tool("caveman_compress", {
        "content": "Hello world this is a test.",
        "file_path": "notes.md",
    })

    data = json.loads(result)
    assert data["compressible"] is True


@pytest.mark.asyncio
async def test_dispatch_query_graph_memory():
    """_dispatch_tool must correctly route and return JSON for query_graph_memory."""
    from tachikoma_mcp.server import _dispatch_tool

    result = await _dispatch_tool("query_graph_memory", {
        "query_type": "similarity",
        "properties_filter": {},
    })

    data = json.loads(result)
    assert "query_type" in data


# ─── 5. Server-level integration ─────────────────────────────────────────────

@pytest.mark.asyncio
async def test_server_list_tools_returns_listtoolsresult():
    """handle_list_tools must return a ListToolsResult with exactly 2 tools."""
    from tachikoma_mcp.server import server, handle_list_tools
    from mcp.types import ListToolsRequest

    request = ListToolsRequest(method="tools/list")
    result = await handle_list_tools(request)

    assert result.tools is not None
    assert len(result.tools) == 2
    names = {t.name for t in result.tools}
    assert names == {"caveman_compress", "query_graph_memory"}


@pytest.mark.asyncio
async def test_server_call_tool_caveman():
    """handle_call_tool must wrap tool results in TextContent and return JSON."""
    from tachikoma_mcp.server import handle_call_tool

    result = await handle_call_tool("caveman_compress", {
        "content": "Sample natural language text.",
        "file_path": "sample.md",
    })

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0].type == "text"
    # The text must be valid JSON
    data = json.loads(result[0].text)
    assert "compressible" in data


@pytest.mark.asyncio
async def test_server_call_tool_unknown_raises():
    """handle_call_tool must raise ValueError for unknown tools."""
    from tachikoma_mcp.server import handle_call_tool

    with pytest.raises(ValueError, match="Unknown tool"):
        await handle_call_tool("fake_tool", {})


@pytest.mark.asyncio
async def test_server_read_resource_returns_json():
    """handle_read_resource must return a JSON string for tachikoma://graph/stats."""
    from tachikoma_mcp.server import handle_read_resource
    from pydantic.networks import AnyUrl

    result = await handle_read_resource(AnyUrl("tachikoma://graph/stats"))
    data = json.loads(result)
    assert isinstance(data, dict)
    assert "total_nodes" in data
    assert "total_edges" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
