/**
 * MCP test: opencode.json MCP configuration
 * Validates the mcp section of opencode.json.
 *
 * Run:  npx vitest run tests/mcp/mcp-config.test.ts
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("MCP configuration", () => {
  it("opencode.json has an mcp section", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    expect(cfg.mcp).toBeDefined();
  });

  it("mcp section is an object", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    expect(typeof cfg.mcp).toBe("object");
  });

  it("each MCP server has type, command, and enabled fields", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    const required = ["type", "command", "enabled"];

    for (const [serverName, serverCfg] of Object.entries(
      cfg.mcp as Record<string, object>,
    )) {
      for (const field of required) {
        expect(
          (serverCfg as Record<string, unknown>)[field],
          `MCP server '${serverName}' missing field: ${field}`,
        ).toBeDefined();
      }
    }
  });

  it("command field is a non-empty array of strings", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));

    for (const [serverName, serverCfg] of Object.entries(
      cfg.mcp as Record<string, { command: unknown }>,
    )) {
      const cmd = serverCfg.command;
      expect(
        Array.isArray(cmd),
        `MCP server '${serverName}' command is not an array`,
      ).toBe(true);

      expect(
        (cmd as unknown[]).length,
        `MCP server '${serverName}' command is empty`,
      ).toBeGreaterThan(0);

      for (const part of cmd as unknown[]) {
        expect(
          typeof part,
          `MCP server '${serverName}' command contains non-string: ${JSON.stringify(part)}`,
        ).toBe("string");
      }
    }
  });

  it("enabled is a boolean", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));

    for (const [serverName, serverCfg] of Object.entries(
      cfg.mcp as Record<string, { enabled: unknown }>,
    )) {
      expect(
        typeof serverCfg.enabled,
        `MCP server '${serverName}' enabled is not a boolean`,
      ).toBe("boolean");
    }
  });

  it("type is a known MCP server type", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    const validTypes = ["local", "stdio", "sse", "http"];

    for (const [serverName, serverCfg] of Object.entries(
      cfg.mcp as Record<string, { type: string }>,
    )) {
      expect(
        validTypes.includes(serverCfg.type),
        `MCP server '${serverName}' has unknown type: ${serverCfg.type}`,
      ).toBe(true);
    }
  });
});
