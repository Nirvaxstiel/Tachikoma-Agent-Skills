import { spawn } from "node:child_process";
import { tool } from "@opencode-ai/plugin/tool";
import type { Plugin } from "@opencode-ai/plugin";

let mcpProcess: ReturnType<typeof spawn> | null = null;
let requestId = 0;
let pendingRequests = new Map<number, { resolve: (v: any) => void; reject: (e: any) => void }>();
let outputBuffer = "";

function getMcpProcess(worktree: string): ReturnType<typeof spawn> {
  if (mcpProcess) return mcpProcess;

  const pythonCmd = process.platform === "win32" ? "python.exe" : "python3";
  mcpProcess = spawn(pythonCmd, ["-m", "tachikoma_mcp.server"], {
    cwd: worktree,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env },
  });

  mcpProcess.stderr?.on("data", (d) => console.error("[tachikoma-mcp]", d.toString()));

  mcpProcess.on("error", (e) => {
    console.error("[tachikoma-mcp] process error:", e);
    mcpProcess = null;
  });

  mcpProcess.on("exit", () => {
    mcpProcess = null;
  });

  mcpProcess.stdout?.on("data", (data: Buffer) => {
    outputBuffer += data.toString();
    const lines = outputBuffer.split("\n");
    outputBuffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        handleMcpMessage(msg);
      } catch {
        // ignore parse errors
      }
    }
  });

  return mcpProcess;
}

function handleMcpMessage(msg: any) {
  if (msg.id !== undefined && pendingRequests.has(msg.id)) {
    const { resolve, reject } = pendingRequests.get(msg.id)!;
    pendingRequests.delete(msg.id);
    if (msg.error) {
      reject(new Error(msg.error.message || JSON.stringify(msg.error)));
    } else {
      resolve(msg.result);
    }
  }
}

function sendMcpRequest(method: string, params: Record<string, any>, worktree: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = getMcpProcess(worktree);
    const id = ++requestId;
    pendingRequests.set(id, { resolve, reject });

    const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
    proc.stdin?.write(msg, (err) => {
      if (err) {
        pendingRequests.delete(id);
        reject(err);
      }
    });

    setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`MCP request ${id} timed out`));
      }
    }, 30000);
  });
}

export const GraphMemoryPlugin = async (ctx: Parameters<Plugin>[0]) => {
  const { worktree } = ctx;

  return {
    tool: {
      "tachikoma.graph-memory": tool({
        description:
          "Query graph-based memory via tachikoma MCP subprocess. Supports similarity search, graph traversal, and statistics.",
        args: {
          query_type: tool.schema
            .enum(["similarity", "traversal", "stats"])
            .describe("Type of query: similarity, traversal, or stats"),
          query: tool.schema.string().optional().describe("Search query text"),
          start_node: tool.schema.string().optional().describe("Starting node ID for traversal"),
          depth_limit: tool.schema
            .number()
            .optional()
            .default(3)
            .describe("Maximum traversal depth"),
          properties_filter: tool.schema
            .record(tool.schema.string(), tool.schema.string())
            .optional()
            .describe("Filter nodes by property key-value pairs"),
        },
        async execute(args) {
          try {
            const result = await sendMcpRequest(
              "tools/call",
              {
                name: "query_graph_memory",
                arguments: {
                  query_type: args.query_type,
                  query: args.query || "",
                  start_node: args.start_node,
                  depth_limit: args.depth_limit,
                  properties_filter: args.properties_filter || {},
                },
              },
              worktree,
            );

            const text = result?.content?.[0]?.text;
            return text ? JSON.parse(text) : result;
          } catch (error) {
            return { error: String(error) };
          }
        },
      }),
    },
  };
};
