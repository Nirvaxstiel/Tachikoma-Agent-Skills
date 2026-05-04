/**
 * Smoke test: Plugin load (tachikoma opencode plugin)
 * Verifies the tachikoma plugin module can be imported and opencode.json
 * has a valid structure (plugins, agents, skills keys).
 *
 * Run:  bun test tests/smoke/plugin-load.test.ts
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readOpencode(): any {
  return JSON.parse(readFileSync(resolve(ROOT, "opencode.json"), "utf-8"));
}

describe("tachikoma plugin load", () => {
  it("tachikoma plugin file has valid TypeScript syntax (can be read without fatal parse errors)", () => {
    // We do a basic check: the file exists and doesn't look completely broken.
    // A full parse would require tsc/typescript — covered by tsc.test.ts.
    const p = resolve(ROOT, "src/plugin/tachikoma.ts");
    const content = readFileSync(p, "utf-8");

    // Check for obvious structural elements that must be present in a valid plugin
    expect(content.trim().length, "tachikoma.ts is empty").toBeGreaterThan(0);
    expect(content, "tachikoma.ts missing 'export' keyword").toContain("export");

    // Must not be full of obvious parse-killers (unmatched braces at the top level only)
    // We count balanced braces to catch egregious breakage
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (const ch of content) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"' || ch === "'" || ch === "`") { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") depth--;
    }
    expect(depth, "Brace mismatch in tachikoma.ts — possible syntax error").toBe(0);
  });

  it("opencode.json has 'plugins' key (via 'plugin' array in schema)", () => {
    const cfg = readOpencode();
    expect(cfg.plugin, "opencode.json missing 'plugin' key").toBeDefined();
    expect(Array.isArray(cfg.plugin), "'plugin' should be an array").toBe(true);
    expect(cfg.plugin.length, "opencode.json 'plugin' array is empty").toBeGreaterThan(0);
  });

  it("opencode.json has 'agents' key (via 'agent' object in schema)", () => {
    const cfg = readOpencode();
    expect(cfg.agent, "opencode.json missing 'agent' key").toBeDefined();
    expect(typeof cfg.agent, "'agent' should be an object").toBe("object");
    expect(Object.keys(cfg.agent).length, "'agent' object is empty").toBeGreaterThan(0);
  });

  it("opencode.json has 'skills' key", () => {
    const cfg = readOpencode();
    expect(cfg.skills, "opencode.json missing 'skills' key").toBeDefined();
    expect(typeof cfg.skills, "'skills' should be an object").toBe("object");
  });

  it("all plugin entries in opencode.json are non-empty strings", () => {
    const cfg = readOpencode();
    for (const entry of cfg.plugin) {
      expect(typeof entry, `Plugin entry is not a string: ${JSON.stringify(entry)}`).toBe("string");
      expect(entry.trim().length, "Plugin entry is an empty string").toBeGreaterThan(0);
    }
  });
});
