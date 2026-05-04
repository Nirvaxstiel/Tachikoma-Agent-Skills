#!/usr/bin/env bun
import { tool } from "@opencode-ai/plugin/tool";
import { detectAndSelect } from "./tachikoma/model-harness";
import { loadProjectContext, positionBiasConfig } from "./tachikoma/context-manager";

export const TachikomaPlugin = async (ctx: any) => {
  return {
    tool: {
      "tachikoma.model-select": tool({
        description: "Detect the active model and select the best edit format for it. Pass a task description to get format recommendations.",
        args: {
          request: tool.schema.string().optional().describe("Task description to guide model/format selection"),
        },
        async execute(args) {
          const result = await detectAndSelect(args.request);
          return JSON.stringify(result, null, 2);
        },
      }),

      "tachikoma.context-status": tool({
        description: `Load project context with U-shaped position bias. Reports context sources, token budget, and priority tiers. Config: start=${positionBiasConfig.startWeight} mid=${positionBiasConfig.middleWeight} end=${positionBiasConfig.endWeight}`,
        args: {
          cwd: tool.schema.string().optional().describe("Project directory (defaults to current working directory)"),
        },
        async execute(args) {
          const context = await loadProjectContext(args.cwd || process.cwd());
          return JSON.stringify(context, null, 2);
        },
      }),
    },
  };
};
