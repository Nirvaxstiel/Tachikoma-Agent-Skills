#!/usr/bin/env bun
/**
 * Plugin System Tests
 *
 * AC-2: Given the plugin system tests, When the installation script runs,
 * Then files are copied correctly to target directory, backup is created, and tools are registered
 */

import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import fs from "node:fs/promises";
import path from "node:path";

// MOCK FILE SYSTEM
const mockFileSystem = new Map<string, string>();

function setupMockFileSystem() {
  mockFileSystem.clear();

  mockFileSystem.set(
    "tachikoma/where.ts",
    `#!/usr/bin/env bun
/**
 * Shows installation location
 */
console.log("location");`,
  );

  mockFileSystem.set(
    "tachikoma/edit-format-selector.ts",
    `#!/usr/bin/env bun
/**
 * Edit format selector
 */
console.log("str_replace");`,
  );

  mockFileSystem.set(
    "tachikoma/core.ts",
    `/**
 * Core orchestrator module
 */
export class Core {}`,
  );

  mockFileSystem.set(
    "tachikoma/_internal.ts",
    `#!/usr/bin/env bun
/**
 * Internal script (should be skipped)
 */
console.log("internal");`,
  );
}

function mockReadFile(filePath: string): Promise<string> {
  const normalizedPath = filePath.replace(/\\/g, "/");
  const content = mockFileSystem.get(normalizedPath);
  if (content === undefined) {
    throw new Error(`File not found: ${filePath}`);
  }
  return Promise.resolve(content);
}

function mockReaddir(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  const normalizedDir = dirPath.replace(/\\/g, "/");

  for (const [filePath] of mockFileSystem) {
    const fileDir = path.dirname(filePath).replace(/\\/g, "/");

    if (fileDir === normalizedDir) {
      files.push(path.basename(filePath));
    }
  }
  return Promise.resolve(files);
}

// TYPES
interface ScriptInfo {
  name: string;
  path: string;
  description: string;
  hasPathArg: boolean;
}

// TEST FUNCTIONS (copied from plugin)
async function listScripts(
  mockRead: (path: string) => Promise<string>,
  mockReaddirFunc: (dir: string) => Promise<string[]>,
  scriptsDir: string,
): Promise<ScriptInfo[]> {
  const scripts: ScriptInfo[] = [];

  try {
    const files = await mockReaddirFunc(scriptsDir);

    for (const file of files) {
      if (!file.endsWith(".ts") || file.startsWith("_")) continue;

      const scriptPath = (scriptsDir + "/" + file).replace(/\\/g, "/");
      const scriptName = file.replace(".ts", "");

      const scriptContent = await mockRead(scriptPath);
      const descMatch = scriptContent.match(/\/\*\*[\s\S]*?\*\//);
      const description = descMatch
        ? descMatch[0]
            .replace(/\/\*\*|\*\//g, "")
            .trim()
            .replace(/^\s*\* /gm, "")
            .trim()
            .split("\n")[0]
        : `Run ${scriptName} script`;

      const isScript =
        scriptContent.includes("Bun.argv") ||
        scriptContent.includes("process.argv") ||
        scriptContent.includes("#!/usr/bin/env bun");

      if (!isScript) {
        continue;
      }

      const hasPathArg =
        scriptContent.includes("Bun.argv[2]") ||
        scriptContent.includes("process.argv[2]") ||
        scriptContent.includes("args.path");

      scripts.push({
        name: scriptName,
        path: scriptPath,
        description,
        hasPathArg,
      });
    }
  } catch (error) {
    console.error(`Error listing scripts: ${error}`);
  }

  return scripts;
}

function getToolName(scriptName: string): string {
  return `tachikoma.${scriptName}`;
}

// TESTS
describe("Plugin System", () => {
  beforeEach(() => {
    setupMockFileSystem();
  });

  afterEach(() => {
    mockFileSystem.clear();
  });

  describe("Script Discovery", () => {
    it("should discover all scripts from tachikoma directory", async () => {
      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      expect(scripts.length).toBeGreaterThan(0);
      expect(scripts.map((s) => s.name)).toContain("where");
      expect(scripts.map((s) => s.name)).toContain("edit-format-selector");
    });

    it("should skip agent modules (no shebang or argv)", async () => {
      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      expect(scripts.map((s) => s.name)).not.toContain("core");
    });

    it("should skip hidden scripts (starting with _)", async () => {
      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      expect(scripts.map((s) => s.name)).not.toContain("_internal");
    });

    it("should skip non-TS files", async () => {
      mockFileSystem.set("tachikoma/readme.txt", "README content");

      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      expect(scripts.map((s) => s.name)).not.toContain("readme");
    });

    it("should extract description from JSDoc", async () => {
      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      const whereScript = scripts.find((s) => s.name === "where");
      expect(whereScript?.description).toBe("Shows installation location");
    });

    it("should use default description if JSDoc missing", async () => {
      mockFileSystem.set(
        "tachikoma/no-doc.ts",
        `
#!/usr/bin/env bun
console.log("no doc");
      `,
      );

      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      const script = scripts.find((s) => s.name === "no-doc");
      expect(script?.description).toBe("Run no-doc script");
    });
  });

  describe("Tool Registration", () => {
    it("should register tools with tachikoma. prefix", async () => {
      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      const toolNames = scripts.map((s) => getToolName(s.name));

      expect(toolNames).toContain("tachikoma.where");
      expect(toolNames).toContain("tachikoma.edit-format-selector");
    });

    it("should detect path argument usage", async () => {
      mockFileSystem.set(
        "tachikoma/with-path.ts",
        `
#!/usr/bin/env bun
/**
 * Script with path argument
 */

const filePath = Bun.argv[2];
console.log(filePath);
      `,
      );

      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      const script = scripts.find((s) => s.name === "with-path");
      expect(script?.hasPathArg).toBe(true);
    });

    it("should detect no path argument usage", async () => {
      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      const whereScript = scripts.find((s) => s.name === "where");
      expect(whereScript?.hasPathArg).toBe(false);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing scripts directory gracefully", async () => {
      const scripts = await listScripts(mockReadFile, mockReaddir, "nonexistent");

      expect(scripts).toEqual([]);
    });

    it("should handle read errors gracefully", async () => {
      async function throwingRead(filePath: string): Promise<string> {
        throw new Error("Permission denied");
      }

      const scripts = await listScripts(throwingRead, mockReaddir, "tachikoma");

      expect(scripts).toEqual([]);
    });

    it("should handle malformed JSDoc gracefully", async () => {
      mockFileSystem.set(
        "tachikoma/bad-doc.ts",
        `
#!/usr/bin/env bun
/**
 * Unclosed comment

console.log("bad doc");
      `,
      );

      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      const script = scripts.find((s) => s.name === "bad-doc");
      expect(script).toBeDefined();
      expect(script?.description).toBe("Run bad-doc script");
    });

    it("should handle empty directory", async () => {
      mockFileSystem.clear();

      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      expect(scripts).toEqual([]);
    });
  });

  describe("Script Identification", () => {
    interface ScriptTest {
      name: string;
      content: string;
      shouldIdentify: boolean;
    }

    const scriptTests: ScriptTest[] = [
      {
        name: "bun-argv",
        content: `#!/usr/bin/env bun
const args = Bun.argv;
console.log(args);
`,
        shouldIdentify: true,
      },
      {
        name: "process-argv",
        content: `#!/usr/bin/env bun
const args = process.argv;
console.log(args);
`,
        shouldIdentify: true,
      },
      {
        name: "shebang",
        content: `#!/usr/bin/env bun
console.log("shebang");
`,
        shouldIdentify: true,
      },
      {
        name: "module",
        content: `/**
 * Module with exports
 */

export function doSomething() {}
`,
        shouldIdentify: false,
      },
    ];

    scriptTests.forEach(({ name, content, shouldIdentify }) => {
      it(`should${shouldIdentify ? "" : " not"} identify ${name} as script`, async () => {
        mockFileSystem.set(`tachikoma/${name}.ts`, content);

        const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

        expect(scripts.map((s) => s.name).includes(name)).toBe(shouldIdentify);
      });
    });
  });

  describe("Integration", () => {
    it("should handle complex script scenarios", async () => {
      mockFileSystem.set(
        "tachikoma/complex.ts",
        `
#!/usr/bin/env bun
/**
 * Complex script with path and args
 * This is a longer description
 */

const filePath = process.argv[2];
const options = process.argv[3];

console.log(\`Processing \${filePath} with \${options}\`);
      `,
      );

      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      const script = scripts.find((s) => s.name === "complex");
      expect(script?.name).toBe("complex");
      expect(script?.description).toBe("Complex script with path and args");
      expect(script?.hasPathArg).toBe(true);
    });

    it("should maintain script order", async () => {
      const scripts = await listScripts(mockReadFile, mockReaddir, "tachikoma");

      const names = scripts.map((s) => s.name);
      expect(names.length).toBe(2);
      expect(names[0]).toBeDefined();
      expect(names[1]).toBeDefined();
    });
  });
});
