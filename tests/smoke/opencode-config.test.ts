/**
 * Smoke test: opencode.json configuration (tachikoma opencode plugin)
 * Verifies opencode.json has all required top-level keys, skill listings,
 * memory tool references, and MCP server path.
 *
 * Run:  bun test tests/smoke/opencode-config.test.ts
 */

import { describe, it, expect } from "vitest";
import { readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function readOpencode(): any {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return JSON.parse(
    require("node:fs").readFileSync(resolve(ROOT, "opencode.json"), "utf-8"),
  );
}

describe("opencode.json configuration", () => {
  it("has required top-level keys: plugins, agents, skills, mcp", () => {
    const cfg = readOpencode();

    // "plugins" is named "plugin" in the schema
    expect(cfg.plugin, "Missing 'plugin' key").toBeDefined();
    expect(cfg.agent, "Missing 'agent' key").toBeDefined();
    expect(cfg.skills, "Missing 'skills' key").toBeDefined();
    expect(cfg.mcp, "Missing 'mcp' key").toBeDefined();
  });

  it("plugin array contains src/plugin/tachikoma.ts", () => {
    const cfg = readOpencode();
    expect(
      cfg.plugin.includes("src/plugin/tachikoma.ts"),
      "src/plugin/tachikoma.ts not listed in opencode.json plugin array",
    ).toBe(true);
  });

  it("All 8+ skills are present in src/skills/ with SKILL.md", () => {
    const skillsDir = resolve(ROOT, "src/skills");
    expect(existsSync(skillsDir)).toBe(true);

    const skillDirs = readdirSync(skillsDir).filter((d) =>
      existsSync(resolve(skillsDir, d, "SKILL.md")),
    );

    expect(
      skillDirs.length,
      `Expected ≥8 skills, found ${skillDirs.length}: ${skillDirs.join(", ")}`,
    ).toBeGreaterThanOrEqual(8);

    // Verify every skill dir has a non-empty SKILL.md
    for (const dir of skillDirs) {
      const skillMd = resolve(skillsDir, dir, "SKILL.md");
      const content = require("node:fs").readFileSync(skillMd, "utf-8");
      expect(
        content.trim().length,
        `${dir}/SKILL.md is empty`,
      ).toBeGreaterThan(10);
    }
  });

  it("skills.paths in opencode.json points to src/skills/", () => {
    const cfg = readOpencode();
    const paths: string[] = cfg.skills?.paths ?? [];
    expect(paths, "skills.paths is empty").toHaveLength(1);
    expect(paths[0], "skills.paths should point to src/skills/").toBe("src/skills");
  });

  it("memory tools are referenced in tachikoma plugin (via source check)", () => {
    // Memory tools are defined in the tachikoma plugin source.
    // We verify they are present by checking the plugin file content.
    const tachikomaPath = resolve(ROOT, "src/plugin/tachikoma.ts");
    const content = require("node:fs").readFileSync(tachikomaPath, "utf-8");

    const memoryTools = [
      "tachikoma.load-memory",
      "tachikoma.init-project-memory",
      "tachikoma.save-memory",
      "tachikoma.append-session-summary",
      "tachikoma.get-recent-sessions",
    ];

    const missing = memoryTools.filter(
      (tool) => !content.includes(`"${tool}"`),
    );
    expect(
      missing,
      `Memory tools not found in tachikoma.ts: ${missing.join(", ")}`,
    ).toHaveLength(0);
  });

  it("MCP server configuration is present in opencode.json", () => {
    const cfg = readOpencode();
    expect(cfg.mcp, "'mcp' key missing").toBeDefined();
    expect(typeof cfg.mcp, "'mcp' should be an object").toBe("object");
  });
});
