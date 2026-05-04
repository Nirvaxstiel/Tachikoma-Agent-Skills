/**
 * Smoke test: Agent definition validation
 * Validates that the agent declared in opencode.json has a valid prompt file.
 *
 * Run:  npx vitest run tests/smoke/agent.test.ts
 */

import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("Agent", () => {
  it("opencode.json defines at least one agent", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    expect(cfg.agent).toBeDefined();
    expect(typeof cfg.agent).toBe("object");
    expect(Object.keys(cfg.agent).length).toBeGreaterThan(0);
  });

  it("default_agent is set and refers to a defined agent", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    expect(cfg.default_agent).toBeTruthy();
    expect(cfg.agent[cfg.default_agent]).toBeDefined();
  });

  it("every defined agent has required fields", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    const requiredFields = ["description", "mode", "prompt", "permission"];

    for (const [name, agent] of Object.entries(cfg.agent as Record<string, object>)) {
      for (const field of requiredFields) {
        expect(
          (agent as Record<string, unknown>)[field],
          `Agent '${name}' missing field: ${field}`,
        ).toBeTruthy();
      }
    }
  });

  it("every agent's prompt file exists", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));

    for (const [name, agent] of Object.entries(
      cfg.agent as Record<string, { prompt: string }>,
    )) {
      const promptPath = resolve(ROOT, agent.prompt);
      expect(
        existsSync(promptPath),
        `Agent '${name}' prompt file not found: ${agent.prompt}`,
      ).toBe(true);
    }
  });

  it("agent prompt files are non-empty", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));

    for (const [name, agent] of Object.entries(
      cfg.agent as Record<string, { prompt: string }>,
    )) {
      const promptPath = resolve(ROOT, agent.prompt);
      const content = readFileSync(promptPath, "utf-8");
      expect(
        content.trim().length,
        `Agent '${name}' prompt is empty: ${agent.prompt}`,
      ).toBeGreaterThan(10);
    }
  });

  it("permission object has expected permission keys", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    const expectedPermissions = ["terminal", "read", "write"];

    for (const [, agent] of Object.entries(
      cfg.agent as Record<string, { permission: Record<string, string> }>,
    )) {
      const perms = agent.permission;
      for (const perm of expectedPermissions) {
        expect(perms[perm], `Missing permission: ${perm}`).toBeTruthy();
      }
    }
  });

  it("model is set in opencode.json", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    expect(cfg.model).toBeTruthy();
    expect(typeof cfg.model).toBe("string");
    expect(cfg.model.trim().length).toBeGreaterThan(0);
  });
});
