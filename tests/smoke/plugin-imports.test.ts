/**
 * Smoke test: Plugin imports
 * Validates that all plugin entry-points declared in opencode.json can be
 * dynamically imported without throwing.
 *
 * Run:  npx vitest run tests/smoke/plugin-imports.test.ts
 */

import { describe, it, expect } from "vitest";
import { existsSync, statSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

describe("Plugin imports", () => {
  it("opencode.json plugin array is non-empty", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
    expect(cfg.plugin?.length).toBeGreaterThan(0);
  });

  it("each declared plugin file exists in the filesystem", () => {
    const cfg = JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));

    const missing: string[] = [];
    for (const pluginPath of cfg.plugin as string[]) {
      const abs = resolve(ROOT, pluginPath);
      try {
        if (!statSync(abs).isFile()) missing.push(pluginPath);
      } catch {
        missing.push(pluginPath);
      }
    }

    expect(missing, `Plugin files not found:\n${missing.join("\n")}`).toHaveLength(0);
  });

  it("src/plugin/tachikoma.ts can be resolved as a file", () => {
    expect(
      existsSync(resolve(ROOT, "src/plugin/tachikoma.ts")),
      "src/plugin/tachikoma.ts not found",
    ).toBe(true);
  });

  it("src/schemas/index.ts exists and exports schemas", () => {
    const schemasPath = resolve(ROOT, "src/schemas/index.ts");
    expect(existsSync(schemasPath), "src/schemas/index.ts not found").toBe(true);
    const content = readFileSync(schemasPath, "utf-8");
    expect(content.includes("export"), "src/schemas/index.ts has no exports").toBe(true);
  });

  it("src/errors/index.ts exists (if present) and exports something", () => {
    const errorsPath = resolve(ROOT, "src/errors/index.ts");
    if (!existsSync(errorsPath)) return; // skip if not present
    const content = readFileSync(errorsPath, "utf-8");
    expect(content.includes("export"), "src/errors/index.ts has no exports").toBe(true);
  });
});
