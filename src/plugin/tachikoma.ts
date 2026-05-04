#!/usr/bin/env bun
import { tool } from "@opencode-ai/plugin/tool";
import { detectAndSelect } from "./tachikoma/model-harness";
import { CheckpointManager } from "./tachikoma/rollback/checkpoint-manager";
import { loadProjectContext, positionBiasConfig } from "./tachikoma/context-manager";
import { GraphMemoryPlugin } from "./tachikoma/memory/graph-memory-plugin";
import { loadAllMemory, saveUserMemory, saveProjectMemory, appendToMemory, initProjectMemory } from "./tachikoma/memory/user-memory";
import { appendSessionSummary, getRecentSessions, getSessionHistory } from "./tachikoma/memory/session-summary";
import { spawnSubagent } from "./tachikoma/delegation";

const memoryTargetEnum = tool.schema.enum(["user", "project"]);

export const TachikomaPlugin = async (ctx: any) => {
  const graphMemory = await GraphMemoryPlugin(ctx);

  return {
    tool: {
      "tachikoma.model-select": tool({
        description: "Detect the active model and select the best edit format for it. Pass a task description to get format recommendations.",
        args: {
          request: tool.schema.string().optional().describe("Task description to guide model/format selection"),
        },
        async execute(args) {
          const result = await detectAndSelect();
          return JSON.stringify(result, null, 2);
        },
      }),

      "tachikoma.context-status": tool({
        description: `Load project context with U-shaped position bias. Reports context sources, token budget, and priority tiers. Config: start=${positionBiasConfig.priorityPositions.start} mid=${positionBiasConfig.priorityPositions.middle} end=${positionBiasConfig.priorityPositions.end}`,
        args: {
          cwd: tool.schema.string().optional().describe("Project directory (defaults to current working directory)"),
        },
        async execute(args) {
          const context = await loadProjectContext(args.cwd || process.cwd());
          return JSON.stringify(context, null, 2);
        },
      }),

      ...graphMemory.tool,

      "tachikoma.load-memory": tool({
        description: "Load user preferences and project context from persistent memory. Checks repo-local .opencode/PROJECT.md first (for repo isolation), then ~/.opencode/memory/PROJECT.md. USER.md lives at ~/.opencode/memory/USER.md.",
        args: {},
        async execute() {
          const memory = await loadAllMemory();
          return memory;
        },
      }),

      "tachikoma.init-project-memory": tool({
        description: "Initialize repo-specific project memory at cwd/.opencode/PROJECT.md. Creates sections for Conventions, Recent Decisions, Current Work, and Gotchas. Use once per repo to set up isolation.",
        args: {},
        async execute() {
          const result = await initProjectMemory();
          return JSON.stringify(result, null, 2);
        },
      }),

      "tachikoma.save-memory": tool({
        description: "Save user preferences or project context to persistent memory. Creates files on first use. Use when user corrects you, shares preferences, or makes decisions worth remembering.",
        args: {
          target: memoryTargetEnum.describe("Which memory file to update: 'user' for USER.md or 'project' for PROJECT.md"),
          content: tool.schema.string().describe("Full content to write to the memory file"),
          append: tool.schema.boolean().optional().describe("If true, append a new section to existing content"),
          section: tool.schema.string().optional().describe("Section name when appending"),
        },
        async execute(args) {
          if (args.append && args.section) {
            const result = await appendToMemory(args.target as "user" | "project", args.section, args.content);
            return JSON.stringify(result, null, 2);
          }
          if (args.target === "user") {
            return JSON.stringify(await saveUserMemory(args.content), null, 2);
          } else {
            return JSON.stringify(await saveProjectMemory(args.content), null, 2);
          }
        },
      }),

      "tachikoma.append-session-summary": tool({
        description: "Append a session summary to ~/.opencode/memory/SESSION/. Call at end of session.",
        args: {
          summary: tool.schema.string().describe("Concise summary of what was accomplished"),
          task: tool.schema.string().optional().describe("Brief description of the main task"),
          filesModified: tool.schema.array(tool.schema.string()).optional().describe("Files modified"),
          decisions: tool.schema.array(tool.schema.string()).optional().describe("Key decisions made"),
        },
        async execute(args) {
          const result = await appendSessionSummary(args.summary, {
            task: args.task,
            filesModified: args.filesModified,
            decisions: args.decisions,
          });
          return JSON.stringify(result, null, 2);
        },
      }),

      "tachikoma.get-recent-sessions": tool({
        description: "Retrieve recent session summaries from ~/.opencode/memory/SESSION/.",
        args: {
          count: tool.schema.number().optional().describe("Number of recent sessions (default: 5, max: 20)"),
          days: tool.schema.number().optional().describe("Filter to sessions within N days"),
        },
        async execute(args) {
          const sessions = args.days
            ? await getSessionHistory(args.days)
            : await getRecentSessions(Math.min(args.count || 5, 20));
          return JSON.stringify(sessions, null, 2);
        },
      }),
      "tachikoma.delegate-task": tool({
        description: "Spawn a subagent to run a task in parallel. The subagent completes and returns a text summary. Use for parallel independent workstreams.",
        args: {
          task: tool.schema.string().describe("Task description for the subagent"),
          agent: tool.schema.string().optional().describe("Subagent type: 'general' or 'explore'").defaults("general"),
        },
        async execute(args) {
          const result = await spawnSubagent(args.agent || "general", args.task);
          return result.summary;
        },
      }),

      "tachikoma.checkpoint": tool({
        description: "Create a named checkpoint before a risky operation. Stores working directory state via git stash or file copy. Returns checkpoint ID for later rollback.",
        args: {
          label: tool.schema.string().optional().describe("Checkpoint label (default: auto-generated)"),
          cwd: tool.schema.string().optional().describe("Working directory (defaults to current working directory)"),
        },
        async execute(args) {
          const manager = new CheckpointManager(args.cwd);
          try {
            const checkpointId = await manager.createCheckpoint(args.label || "auto");
            return JSON.stringify({ success: true, checkpointId, message: `Checkpoint created: ${checkpointId}` }, null, 2);
          } catch (error: any) {
            return JSON.stringify({ success: false, error: error.message }, null, 2);
          }
        },
      }),

      "tachikoma.list-checkpoints": tool({
        description: "List available checkpoints. Shows all checkpoints created via tachikoma.checkpoint.",
        args: {
          cwd: tool.schema.string().optional().describe("Working directory (defaults to current working directory)"),
        },
        async execute(args) {
          const manager = new CheckpointManager(args.cwd);
          try {
            const checkpoints = await manager.listCheckpoints();
            if (checkpoints.length === 0) {
              return JSON.stringify({ checkpoints: [], message: "No checkpoints found." }, null, 2);
            }
            return JSON.stringify({ checkpoints, message: `${checkpoints.length} checkpoint(s) found` }, null, 2);
          } catch (error: any) {
            return JSON.stringify({ success: false, error: error.message }, null, 2);
          }
        },
      }),

      "tachikoma.rollback": tool({
        description: "Rollback to a previous checkpoint. Restores working directory to checkpoint state. Use 'latest' for most recent checkpoint.",
        args: {
          target: tool.schema.string().optional().describe("Checkpoint ID from list, or 'latest' (default: latest)"),
          cwd: tool.schema.string().optional().describe("Working directory (defaults to current working directory)"),
        },
        async execute(args) {
          const manager = new CheckpointManager(args.cwd);
          let targetId = args.target || "latest";
          
          if (targetId === "latest") {
            const checkpoints = await manager.listCheckpoints();
            if (checkpoints.length === 0) {
              return JSON.stringify({ success: false, error: "No checkpoints found. Use tachikoma.checkpoint first." }, null, 2);
            }
            targetId = checkpoints[0].id;
          }
          
          try {
            await manager.rollbackTo(targetId);
            return JSON.stringify({ success: true, message: `Rolled back to checkpoint: ${targetId}` }, null, 2);
          } catch (error: any) {
            return JSON.stringify({ success: false, error: error.message }, null, 2);
          }
        },
      }),
    },
  };
};
