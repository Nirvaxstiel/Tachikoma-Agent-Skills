#!/usr/bin/env python3
"""
Tachikoma MCP Server — Lean
Only working tools: caveman_compress, query_graph_memory
Pruned: analyze_topology, enhanced_rlm_process, execute_with_verification, learn_skill_outcome, caveman_validate (files missing)
"""

import asyncio
import json
import logging
from typing import Dict, List

from mcp.server.lowlevel import Server
from mcp.types import (
    ListResourcesRequest,
    ListResourcesResult,
    ListToolsRequest,
    ListToolsResult,
    Resource,
    TextContent,
    Tool,
)
from pydantic.networks import AnyUrl

from .models import GraphEdge, GraphNode
from .tools.caveman import caveman_compress
from .tools.query_graph_memory import query_graph_memory

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tachikoma-mcp")

server = Server("tachikoma-mcp")

graph_nodes: Dict[str, GraphNode] = {}
graph_edges: List[GraphEdge] = []


@server.list_resources()
async def handle_list_resources(_: ListResourcesRequest) -> ListResourcesResult:
    """List available resources"""
    return ListResourcesResult(
        resources=[
            Resource(
                uri=AnyUrl("tachikoma://graph/stats"),
                name="graph-stats",
                description="Graph memory statistics",
                mimeType="application/json",
            ),
        ]
    )


@server.read_resource()
async def handle_read_resource(uri: AnyUrl) -> str:
    """Read a specific resource"""
    uri_str = str(uri)
    if uri_str == "tachikoma://graph/stats":
        stats = {
            "total_nodes": len(graph_nodes),
            "total_edges": len(graph_edges),
            "node_types": {},
        }
        for node in graph_nodes.values():
            node_type = node.type
            stats["node_types"][node_type] = stats["node_types"].get(node_type, 0) + 1
        content = json.dumps(stats, indent=2)
        return content
    else:
        raise ValueError(f"Unknown resource: {uri_str}")


@server.list_tools()
async def handle_list_tools(_: ListToolsRequest) -> ListToolsResult:
    """List available tools"""
    return ListToolsResult(
        tools=[
            Tool(
                name="query_graph_memory",
                description="Query the graph-based memory system",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "query_type": {
                            "type": "string",
                            "enum": ["similarity", "traversal", "pattern"],
                            "description": "Type of query to perform",
                        },
                        "start_node": {
                            "type": "string",
                            "description": "Starting node ID for traversal queries",
                        },
                        "depth_limit": {
                            "type": "integer",
                            "description": "Maximum traversal depth",
                            "default": 3,
                        },
                        "properties_filter": {
                            "type": "object",
                            "description": "Filter nodes by properties",
                            "default": {},
                        },
                    },
                    "required": ["query_type"],
                },
            ),
            Tool(
                name="caveman_compress",
                description="Detect if content is compressible natural language, return caveman compression instructions for the agent to follow.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "content": {
                            "type": "string",
                            "description": "Text content to analyze for compression",
                        },
                        "file_path": {
                            "type": "string",
                            "description": "Optional file path for extension-based detection",
                        },
                    },
                    "required": ["content"],
                },
            ),
        ]
    )


async def _dispatch_tool(name: str, arguments: dict) -> str:
    """Route tool call to the correct handler."""
    if name == "caveman_compress":
        return await caveman_compress(arguments)
    elif name == "query_graph_memory":
        return await query_graph_memory(arguments, graph_nodes, graph_edges)
    else:
        raise ValueError(f"Unknown tool: {name}")


@server.call_tool()
async def handle_call_tool(name: str, arguments: dict) -> List[TextContent]:
    """Handle tool calls via MCP SDK"""
    arguments = arguments or {}
    logger.info(f"Calling tool: {name} with arguments: {arguments}")
    result = await _dispatch_tool(name, arguments)
    return [TextContent(type="text", text=result)]


async def run():
    """Run MCP server"""
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


def main(argv=None):
    """Main entry point."""
    import argparse
    from . import __version__

    parser = argparse.ArgumentParser(
        prog="tachikoma-mcp-python",
        description="Run the Tachikoma MCP server.",
    )
    parser.add_argument(
        "-V",
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )
    args = parser.parse_args(argv)
    asyncio.run(run())


if __name__ == "__main__":
    main()
