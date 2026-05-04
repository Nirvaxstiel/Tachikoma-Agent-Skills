/**
 * Smoke test: File structure
 * Validates that all expected files and directories exist.
 *
 * Run:  npx vitest run tests/smoke/file-structure.test.ts
 */

import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, statSync } from "node:fs";
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

describe("File structure", () => {
  it("root config files exist", () => {
    expect(isFile(resolve(ROOT, "package.json"))).toBe(true);
    expect(isFile(resolve(ROOT, "tsconfig.json"))).toBe(true);
    expect(isFile(resolve(ROOT, "opencode.json"))).toBe(true);
    expect(isFile(resolve(ROOT, "AGENTS.md"))).toBe(true);
  });

  it("src/ directory exists and has expected subdirectories", () => {
    expect(isDir(resolve(ROOT, "src"))).toBe(true);
    expect(isDir(resolve(ROOT, "src/plugin"))).toBe(true);
    expect(isDir(resolve(ROOT, "src/skills"))).toBe(true);
    expect(isDir(resolve(ROOT, "src/constants"))).toBe(true);
    expect(isDir(resolve(ROOT, "src/types"))).toBe(true);
    expect(isDir(resolve(ROOT, "src/utils"))).toBe(true);
  });

  it("src/plugin contains all expected plugin modules", () => {
    const pluginDir = resolve(ROOT, "src/plugin");
    const expectedModules = [
      "tachikoma.ts",
      "tachikoma/context-manager.ts",
      "tachikoma/core.ts",
      "tachikoma/model-select.ts",
      "tachikoma/verifier.ts",
      "tachikoma/rlm-handler.ts",
      "tachikoma/skills",
      "tachikoma/opensage",
      "tachikoma/graph-routing",
      "tachikoma/router",
      "tachikoma/verification",
    ];
    for (const mod of expectedModules) {
      expect(
        existsSync(resolve(pluginDir, mod)),
        `Expected plugin module: ${mod}`,
      ).toBe(true);
    }
  });

  it("src/constants contains all expected constant files", () => {
    const constantsDir = resolve(ROOT, "src/constants");
    const expected = [
      "config.ts",
      "edit-formats.ts",
      "model-confidence.ts",
      "model-env.ts",
      "router.ts",
      "tokenization.ts",
    ];
    for (const file of expected) {
      expect(
        isFile(resolve(constantsDir, file)),
        `Expected constant: ${file}`,
      ).toBe(true);
    }
  });

  it("src/types contains index.ts", () => {
    expect(isFile(resolve(ROOT, "src/types/index.ts"))).toBe(true);
    expect(isFile(resolve(ROOT, "src/schemas/index.ts"))).toBe(true);
    expect(isFile(resolve(ROOT, "src/errors/index.ts"))).toBe(true);
  });

  it("src/utils has at least 5 utility files", () => {
    const utils = ls(resolve(ROOT, "src/utils")).filter((f) => f.endsWith(".ts"));
    expect(utils.length).toBeGreaterThanOrEqual(5);
  });

  it("src/agents contains tachikoma.md", () => {
    expect(isFile(resolve(ROOT, "src/agents/tachikoma.md"))).toBe(true);
  });

  it("skills directory contains 5+ skills", () => {
    const skills = ls(resolve(ROOT, "src/skills"));
    expect(skills.length).toBeGreaterThanOrEqual(5);
  });

  it("install.ts exists", () => {
    expect(isFile(resolve(ROOT, "install.ts"))).toBe(true);
  });
});
