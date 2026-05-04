/**
 * Smoke test: opencode.json parse
 * Validates that opencode.json is valid JSON and has all required top-level fields.
 *
 * Run:  npx vitest run tests/smoke/opencode.test.ts
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("opencode.json", () => {
  it("file is valid JSON", () => {
    expect(() => {
      JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    }).not.toThrow();
  });

  it("has required top-level fields", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    const required = ["$schema", "model", "default_agent", "skills", "agent", "plugin"];

    for (const field of required) {
      expect(cfg[field], `Missing top-level field: ${field}`).toBeDefined();
    }
  });

  it("$schema URL is correct", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    expect(cfg.$schema).toBe("https://opencode.ai/schema.json");
  });

  it("model field is a non-empty string", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    expect(typeof cfg.model).toBe("string");
    expect(cfg.model.trim().length).toBeGreaterThan(0);
  });

  it("small_model field is present and a string (if defined)", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    if (cfg.small_model !== undefined) {
      expect(typeof cfg.small_model).toBe("string");
    }
  });

  it("skills.paths is a non-empty array", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    expect(Array.isArray(cfg.skills?.paths)).toBe(true);
    expect(cfg.skills.paths.length).toBeGreaterThan(0);
  });

  it("plugin array is non-empty and all entries are strings", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    expect(Array.isArray(cfg.plugin)).toBe(true);
    expect(cfg.plugin.length).toBeGreaterThan(0);

    for (const entry of cfg.plugin) {
      expect(
        typeof entry,
        `Plugin entry is not a string: ${JSON.stringify(entry)}`,
      ).toBe("string");
    }
  });

  it("experimental field is an object (if present)", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    if (cfg.experimental !== undefined) {
      expect(typeof cfg.experimental).toBe("object");
      expect(cfg.experimental).not.toBeNull();
    }
  });
});
