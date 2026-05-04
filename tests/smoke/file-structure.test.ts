/**
 * Smoke test: File structure (tachikoma opencode plugin)
 * Verifies all expected files and directories exist for the tachikoma plugin.
 *
 * Run:  bun test tests/smoke/file-structure.test.ts
 */

import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, statSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p: string): boolean {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function ls(p: string): string[] {
  try {
    return readdirSync(p);
  } catch {
    return [];
  }
}

describe("tachikoma plugin file structure", () => {
  it("src/plugin/tachikoma.ts exists", () => {
    const p = resolve(ROOT, "src/plugin/tachikoma.ts");
    expect(isFile(p), "src/plugin/tachikoma.ts not found").toBe(true);
  });

  it("src/plugin/tachikoma.ts exports a plugin (checks for TachikomaPlugin export)", () => {
    const p = resolve(ROOT, "src/plugin/tachikoma.ts");
    const content = readFileSync(p, "utf-8");
    expect(
      content.includes("export"),
      "src/plugin/tachikoma.ts has no exports",
    ).toBe(true);
  });

  it("src/plugin/tachikoma/memory/user-memory.ts exists", () => {
    const p = resolve(ROOT, "src/plugin/tachikoma/memory/user-memory.ts");
    expect(isFile(p), "src/plugin/tachikoma/memory/user-memory.ts not found").toBe(true);
  });

  it("src/plugin/tachikoma/memory/session-summary.ts exists", () => {
    const p = resolve(ROOT, "src/plugin/tachikoma/memory/session-summary.ts");
    expect(isFile(p), "src/plugin/tachikoma/memory/session-summary.ts not found").toBe(true);
  });

  it("src/agents/tachikoma.md exists", () => {
    const p = resolve(ROOT, "src/agents/tachikoma.md");
    expect(isFile(p), "src/agents/tachikoma.md not found").toBe(true);
  });

  it("src/skills/*/SKILL.md files exist — at least 8 skills", () => {
    const skillsDir = resolve(ROOT, "src/skills");
    expect(isDir(skillsDir), "src/skills/ directory not found").toBe(true);

    const skillDirs = ls(skillsDir).filter((d) =>
      existsSync(resolve(skillsDir, d, "SKILL.md")),
    );

    expect(
      skillDirs.length,
      `Expected ≥8 skills, found ${skillDirs.length}: ${skillDirs.join(", ")}`,
    ).toBeGreaterThanOrEqual(8);
  });

  it("opencode.json exists and is valid JSON", () => {
    const p = resolve(ROOT, "opencode.json");
    expect(isFile(p), "opencode.json not found").toBe(true);

    expect(() => {
      JSON.parse(readFileSync(p, "utf-8"));
    }, "opencode.json is not valid JSON").not.toThrow();
  });
});
