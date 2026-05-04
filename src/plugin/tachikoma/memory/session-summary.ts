import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { logger } from "../../../utils/logger";

const HOME_DIR = process.env.HOME || process.env.USERPROFILE || "";
const SESSION_DIR = join(HOME_DIR, ".opencode", "memory", "SESSION");

async function ensureSessionDir(): Promise<void> {
  if (!existsSync(SESSION_DIR)) {
    await mkdir(SESSION_DIR, { recursive: true });
    logger.debug(`Created session directory: ${SESSION_DIR}`);
  }
}

function formatTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const dateStr = date.toISOString().split("T")[0];
  const timeStr = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  return `${dateStr}_${timeStr}`;
}

export async function appendSessionSummary(
  summary: string,
  metadata?: {
    task?: string;
    filesModified?: string[];
    decisions?: string[];
  },
): Promise<{ success: boolean; path: string; timestamp: string }> {
  await ensureSessionDir();

  const timestamp = formatTimestamp(new Date());
  const filename = `session_${timestamp}.md`;
  const filepath = join(SESSION_DIR, filename);

  const content = [
    `# Session: ${timestamp}`,
    "",
    "## Summary",
    summary,
  ];

  if (metadata?.task) {
    content.push("", "## Task");
    content.push(metadata.task);
  }

  if (metadata?.filesModified && metadata.filesModified.length > 0) {
    content.push("", "## Files Modified");
    for (const file of metadata.filesModified) {
      content.push(`- ${file}`);
    }
  }

  if (metadata?.decisions && metadata.decisions.length > 0) {
    content.push("", "## Decisions");
    for (const decision of metadata.decisions) {
      content.push(`- ${decision}`);
    }
  }

  await writeFile(filepath, content.join("\n"));
  logger.info(`Saved session summary: ${filename}`);

  return { success: true, path: filepath, timestamp };
}

interface SessionEntry {
  path: string;
  timestamp: string;
  summary: string;
  task?: string;
  filesModified?: string[];
}

export async function getRecentSessions(count: number = 5): Promise<SessionEntry[]> {
  await ensureSessionDir();

  let files: string[] = [];
  try {
    files = await readdir(SESSION_DIR);
  } catch {
    logger.warn(`Failed to read session directory: ${SESSION_DIR}`);
    return [];
  }

  const mdFiles = files
    .filter((f) => f.endsWith(".md") && f.startsWith("session_"))
    .sort()
    .reverse()
    .slice(0, count);

  const sessions: SessionEntry[] = [];

  for (const file of mdFiles) {
    const filepath = join(SESSION_DIR, file);
    try {
      const content = await readFile(filepath, "utf-8");
      const timestamp = file.replace("session_", "").replace(".md", "");
      const summary = extractSummary(content);
      const task = extractMetadata(content, "Task");
      const filesModified = extractList(content, "Files Modified");

      sessions.push({
        path: filepath,
        timestamp,
        summary,
        task,
        filesModified,
      });
    } catch {
      logger.warn(`Failed to read session file: ${filepath}`);
    }
  }

  return sessions;
}

function extractSummary(content: string): string {
  const match = content.match(/## Summary\s*\n([\s\S]*?)(?=\n## |\n#|$)/);
  if (match) {
    return match[1].trim();
  }
  return content.split("\n").slice(0, 3).join(" ").substring(0, 200);
}

function extractMetadata(content: string, section: string): string | undefined {
  const match = content.match(new RegExp(`## ${section}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n#|$)`));
  if (match) {
    return match[1].trim();
  }
  return undefined;
}

function extractList(content: string, section: string): string[] | undefined {
  const match = content.match(new RegExp(`## ${section}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n#|$)`));
  if (match) {
    const lines = match[1].split("\n").filter((l) => l.startsWith("- "));
    return lines.map((l) => l.replace(/^- /, "").trim());
  }
  return undefined;
}

export async function getSessionHistory(days: number = 7): Promise<SessionEntry[]> {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const all = await getRecentSessions(100);

  return all.filter((session) => {
    try {
      const date = new Date(session.timestamp.replace("_", "T"));
      return date.getTime() > cutoff;
    } catch {
      return false;
    }
  });
}

export { SESSION_DIR };
