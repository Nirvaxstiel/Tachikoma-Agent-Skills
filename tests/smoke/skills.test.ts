/**
 * Smoke test: Skills existence and structure
 * Validates that every skill listed in opencode.json has a matching SKILL.md.
 *
 * Run:  npx vitest run tests/smoke/skills.test.ts
 */

import { describe, it, expect } from "vitest";
import { readdirSync, existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SKILLS_DIR = resolve(ROOT, "src/skills");

function getSkillDirs(): string[] {
  try {
    return readdirSync(SKILLS_DIR).filter((d) =>
      existsSync(resolve(SKILLS_DIR, d, "SKILL.md")),
    );
  } catch {
    return [];
  }
}

describe("Skills", () => {
  it("src/skills/ directory exists", () => {
    expect(existsSync(SKILLS_DIR)).toBe(true);
  });

  it("every skill directory has a SKILL.md file", () => {
    const dirs = readdirSync(SKILLS_DIR);
    const missing = dirs.filter(
      (d) => !existsSync(resolve(SKILLS_DIR, d, "SKILL.md")),
    );
    expect(missing, `Skills missing SKILL.md: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("every SKILL.md has a valid frontmatter name and description", () => {
    const dirs = getSkillDirs();
    const invalid: string[] = [];

    for (const dir of dirs) {
      const content = readFileSync(
        resolve(SKILLS_DIR, dir, "SKILL.md"),
        "utf-8",
      );
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      const descMatch = content.match(/^description:\s*(.+)$/m);

      if (!nameMatch) invalid.push(`${dir}: missing 'name' in frontmatter`);
      else if (!descMatch) invalid.push(`${dir}: missing 'description' in frontmatter`);
    }

    expect(invalid, `Invalid skill frontmatter:\n${invalid.join("\n")}`).toHaveLength(0);
  });

  it("skills paths in opencode.json exist in src/skills/", () => {
    const opencode = JSON.parse(
      readFileSync(resolve(ROOT, "opencode.json"), "utf-8"),
    );

    const skillPaths: string[] = opencode.skills?.paths ?? [];
    expect(skillPaths.length).toBeGreaterThan(0);

    for (const skillPath of skillPaths) {
      const absPath = resolve(ROOT, skillPath);
      expect(
        existsSync(absPath),
        `skills path from opencode.json not found: ${skillPath}`,
      ).toBe(true);

      const entries = readdirSync(absPath);
      expect(entries.length, `skills path ${skillPath} is empty`).toBeGreaterThan(0);
    }
  });

  it("at least 5 skills exist", () => {
    const dirs = getSkillDirs();
    expect(dirs.length, `Found ${dirs.length} skills`).toBeGreaterThanOrEqual(5);
  });

  it("SKILL.md files are non-empty", () => {
    const dirs = getSkillDirs();
    for (const dir of dirs) {
      const content = readFileSync(
        resolve(SKILLS_DIR, dir, "SKILL.md"),
        "utf-8",
      );
      expect(
        content.trim().length,
        `${dir}/SKILL.md is empty`,
      ).toBeGreaterThan(10);
    }
  });
});
