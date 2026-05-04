import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { logger } from "../../../utils/logger";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "";
const MEMORY_BASE = join(HOME_DIR, ".opencode", "memory");
const USER_PATH = join(MEMORY_BASE, "USER.md");
const PROJECT_PATH = join(MEMORY_BASE, "PROJECT.md");

const DEFAULT_USER_TEMPLATE = `# [Your Name]

## Preferences
- Communication style:
- Code style preferences:
- Commit message style:
- Documentation preferences:

## Environment
- OS/Platform:
- Shell:
- Editor/IDE:

## Notes
- Anything else worth remembering across sessions
`;

const DEFAULT_PROJECT_TEMPLATE = `# [Project Name]

## Conventions
- Naming conventions:
- Architecture patterns:
- Testing requirements:

## Decisions
- Why certain approaches were chosen:
- Trade-offs documented:

## Gotchas
- Common pitfalls to avoid:
- Known issues or workarounds:

## Context
- Project-specific knowledge:
`;

async function ensureMemoryDir(): Promise<void> {
  if (!existsSync(MEMORY_BASE)) {
    await mkdir(MEMORY_BASE, { recursive: true });
    logger.debug(`Created memory directory: ${MEMORY_BASE}`);
  }
}

async function ensureFile(path: string, template: string): Promise<void> {
  if (!existsSync(path)) {
    await ensureMemoryDir();
    await writeFile(path, template);
    logger.debug(`Created memory file: ${path}`);
  }
}

export async function loadUserMemory(): Promise<{ user: string | null; project: string | null }> {
  await ensureFile(USER_PATH, DEFAULT_USER_TEMPLATE);
  await ensureFile(PROJECT_PATH, DEFAULT_PROJECT_TEMPLATE);

  let userContent: string | null = null;
  let projectContent: string | null = null;

  try {
    userContent = await readFile(USER_PATH, "utf-8");
    userContent = userContent.trim() || null;
  } catch {
    logger.warn(`Failed to read USER.md: ${USER_PATH}`);
  }

  try {
    projectContent = await readFile(PROJECT_PATH, "utf-8");
    projectContent = projectContent.trim() || null;
  } catch {
    logger.warn(`Failed to read PROJECT.md: ${PROJECT_PATH}`);
  }

  return { user: userContent, project: projectContent };
}

export function formatMemoryForPrompt(): string {
  return `${MEMORY_BASE}`;
}

export async function loadAllMemory(): Promise<string> {
  const { user, project } = await loadUserMemory();

  const sections: string[] = [];

  if (user) {
    sections.push("## User Memory\n" + user);
  }

  if (project) {
    sections.push("\n## Project Memory\n" + project);
  }

  if (sections.length === 0) {
    return "No memory files found. Consider calling save-memory to create them.";
  }

  return sections.join("\n");
}

export async function saveUserMemory(content: string): Promise<{ success: boolean; path: string }> {
  await ensureMemoryDir();
  await writeFile(USER_PATH, content);
  logger.info(`Saved USER.md`);
  return { success: true, path: USER_PATH };
}

export async function saveProjectMemory(
  content: string,
): Promise<{ success: boolean; path: string }> {
  await ensureMemoryDir();
  await writeFile(PROJECT_PATH, content);
  logger.info(`Saved PROJECT.md`);
  return { success: true, path: PROJECT_PATH };
}

export async function appendToMemory(
  target: "user" | "project",
  section: string,
  content: string,
): Promise<{ success: boolean; path: string }> {
  const { user, project } = await loadUserMemory();
  const current = target === "user" ? user : project;
  const path = target === "user" ? USER_PATH : PROJECT_PATH;

  let updated = current || "";
  if (updated && !updated.endsWith("\n")) {
    updated += "\n";
  }
  updated += `\n## ${section}\n${content}\n`;

  await writeFile(path, updated);
  logger.info(`Appended to ${target} memory: ${section}`);

  return { success: true, path };
}

export { USER_PATH, PROJECT_PATH, MEMORY_BASE };
