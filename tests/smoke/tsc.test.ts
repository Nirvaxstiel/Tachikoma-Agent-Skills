/**
 * Smoke test: TypeScript compilation check
 * Validates that all TypeScript source files compile without errors.
 *
 * Run:  npx vitest run tests/smoke/tsc.test.ts
 */

import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("TypeScript compilation", () => {
  it("tsconfig.json exists", () => {
    const tsconfig = resolve(ROOT, "tsconfig.json");
    expect(existsSync(tsconfig)).toBe(true);
  });

  it("npx tsc --noEmit exits with 0 (no type errors)", () => {
    try {
      execSync("npx tsc --noEmit", {
        cwd: ROOT,
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 60_000,
      });
    } catch (err: any) {
      const stderr = err.stderr?.toString() ?? "";
      const stdout = err.stdout?.toString() ?? "";
      const output = stderr || stdout;
      console.error("tsc output:\n", output);
      // Gracefully skip if tsc isn't installed in this environment
      if (
        output.includes("not the tsc command") ||
        output.includes("not installed")
      ) {
        console.warn(
          "TypeScript (tsc) not installed in this environment — skipping type check.",
        );
        return; // skip this test
      }
      expect.fail(`tsc exited with code ${err.status}:\n${output}`);
    }
  });
});
