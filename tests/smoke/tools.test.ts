/**
 * Smoke test: Tools defined in tachikoma plugin
 * Verifies that all expected tachikoma memory/tools are defined in tachikoma.ts
 * via grep/string search.
 *
 * Run:  bun test tests/smoke/tools.test.ts
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function tachikomaContent(): string {
  return readFileSync(resolve(ROOT, "src/plugin/tachikoma.ts"), "utf-8");
}

describe("tachikoma plugin tools", () => {
  it("tachikoma.load-memory is defined in tachikoma.ts", () => {
    const content = tachikomaContent();
    expect(
      content.includes('"tachikoma.load-memory"'),
      '"tachikoma.load-memory" not found in tachikoma.ts',
    ).toBe(true);
  });

  it("tachikoma.init-project-memory is defined in tachikoma.ts", () => {
    const content = tachikomaContent();
    expect(
      content.includes('"tachikoma.init-project-memory"'),
      '"tachikoma.init-project-memory" not found in tachikoma.ts',
    ).toBe(true);
  });

  it("tachikoma.save-memory is defined in tachikoma.ts", () => {
    const content = tachikomaContent();
    expect(
      content.includes('"tachikoma.save-memory"'),
      '"tachikoma.save-memory" not found in tachikoma.ts',
    ).toBe(true);
  });

  it("tachikoma.append-session-summary is defined in tachikoma.ts", () => {
    const content = tachikomaContent();
    expect(
      content.includes('"tachikoma.append-session-summary"'),
      '"tachikoma.append-session-summary" not found in tachikoma.ts',
    ).toBe(true);
  });

  it("tachikoma.get-recent-sessions is defined in tachikoma.ts", () => {
    const content = tachikomaContent();
    expect(
      content.includes('"tachikoma.get-recent-sessions"'),
      '"tachikoma.get-recent-sessions" not found in tachikoma.ts',
    ).toBe(true);
  });

  it("all 5 memory tools are defined together in tachikoma.ts", () => {
    const content = tachikomaContent();
    const tools = [
      "tachikoma.load-memory",
      "tachikoma.init-project-memory",
      "tachikoma.save-memory",
      "tachikoma.append-session-summary",
      "tachikoma.get-recent-sessions",
    ];

    const missing = tools.filter(
      (t) => !content.includes(`"${t}"`),
    );
    expect(
      missing,
      `Missing tools: ${missing.join(", ")}`,
    ).toHaveLength(0);
  });

  it("tachikoma plugin exports TachikomaPlugin", () => {
    const content = tachikomaContent();
    expect(
      content.includes("TachikomaPlugin"),
      "TachikomaPlugin not exported from tachikoma.ts",
    ).toBe(true);
  });
});
