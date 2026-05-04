import { execSync, exec } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, cp, rm } from "node:fs/promises";
import { join, basename } from "node:path";
import { tmpdir } from "node:os";

export interface Checkpoint {
  id: string;
  label: string;
  timestamp: string;
  type: "git-stash" | "file-copy";
}

export interface CheckpointResult {
  success: boolean;
  checkpoint?: Checkpoint;
  error?: string;
}

export interface RollbackResult {
  success: boolean;
  restored?: string;
  error?: string;
}

export class CheckpointManager {
  private checkpointDir: string;
  private cwd: string;

  constructor(cwd?: string) {
    this.cwd = cwd || process.cwd();
    this.checkpointDir = join(tmpdir(), "tachikoma-checkpoints", basename(this.cwd));
  }

  private isGitRepo(): boolean {
    try {
      execSync("git rev-parse --is-inside-work-tree", { cwd: this.cwd, encoding: "utf8", stdio: "pipe" });
      return true;
    } catch {
      return false;
    }
  }

  private generateCheckpointId(): string {
    return `ckpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private formatTimestamp(date: Date = new Date()): string {
    return date.toISOString().replace("T", " ").substring(0, 19);
  }

  async createCheckpoint(label?: string): Promise<string> {
    const checkpointId = this.generateCheckpointId();
    const checkpointLabel = label || `checkpoint_${checkpointId}`;

    if (this.isGitRepo()) {
      return this.createGitStash(checkpointId, checkpointLabel);
    } else {
      return this.createFileCopy(checkpointId, checkpointLabel);
    }
  }

  private createGitStash(checkpointId: string, label: string): string {
    try {
      execSync(`git stash push -m "${checkpointId}:${label}"`, {
        cwd: this.cwd,
        encoding: "utf8",
        stdio: "pipe",
      });

      const stashList = execSync("git stash list --format='%H:%s'", {
        cwd: this.cwd,
        encoding: "utf8",
        stdio: "pipe",
      }).toString().trim();

      const lines = stashList.split("\n").filter(Boolean);
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        const [hash] = lastLine.split(":");
        return hash.substring(0, 12);
      }

      return checkpointId;
    } catch (error: any) {
      throw new Error(`Git stash failed: ${error.message}`);
    }
  }

  private async createFileCopy(checkpointId: string, label: string): Promise<string> {
    try {
      await mkdir(this.checkpointDir, { recursive: true });

      const copyPath = join(this.checkpointDir, checkpointId);
      await cp(this.cwd, copyPath, { recursive: true });

      const manifestPath = join(copyPath, ".tachikoma-checkpoint-manifest");
      const manifest = JSON.stringify({ id: checkpointId, label, timestamp: this.formatTimestamp() });
      
      const { writeFile } = await import("node:fs/promises");
      await writeFile(manifestPath, manifest);

      return checkpointId;
    } catch (error: any) {
      throw new Error(`File copy failed: ${error.message}`);
    }
  }

  async listCheckpoints(): Promise<Checkpoint[]> {
    if (this.isGitRepo()) {
      return this.listGitStashes();
    } else {
      return this.listFileCopies();
    }
  }

  private listGitStashes(): Checkpoint[] {
    try {
      const output = execSync("git stash list --format='%H|%s|%ci'", {
        cwd: this.cwd,
        encoding: "utf8",
        stdio: "pipe",
      }).toString().trim();

      if (!output) return [];

      const lines = output.split("\n").filter(Boolean);
      return lines.map((line) => {
        const [hash, message, timestamp] = line.split("|");
        const [checkpointId, ...labelParts] = message.split(":");
        
        return {
          id: hash.substring(0, 12),
          label: labelParts.join(":") || checkpointId,
          timestamp: timestamp?.trim() || "",
          type: "git-stash" as const,
        };
      });
    } catch {
      return [];
    }
  }

  private async listFileCopies(): Promise<Checkpoint[]> {
    if (!existsSync(this.checkpointDir)) {
      return [];
    }

    const { readdir } = await import("node:fs/promises");
    const { readFile } = await import("node:fs/promises");

    try {
      const entries = await readdir(this.checkpointDir);
      const checkpoints: Checkpoint[] = [];

      for (const entry of entries) {
        if (entry.startsWith("ckpt_")) {
          const manifestPath = join(this.checkpointDir, entry, ".tachikoma-checkpoint-manifest");
          if (existsSync(manifestPath)) {
            try {
              const manifestContent = await readFile(manifestPath, "utf8");
              const manifest = JSON.parse(manifestContent);
              checkpoints.push({
                id: manifest.id,
                label: manifest.label,
                timestamp: manifest.timestamp,
                type: "file-copy",
              });
            } catch {
              checkpoints.push({
                id: entry,
                label: `checkpoint_${entry}`,
                timestamp: "",
                type: "file-copy",
              });
            }
          }
        }
      }

      return checkpoints;
    } catch {
      return [];
    }
  }

  async rollbackTo(targetId: string): Promise<void> {
    if (this.isGitRepo()) {
      return this.rollbackGitStash(targetId);
    } else {
      return this.rollbackFileCopy(targetId);
    }
  }

  private async rollbackGitStash(targetId: string): Promise<void> {
    try {
      const stashList = execSync("git stash list --format='%H'", {
        cwd: this.cwd,
        encoding: "utf8",
        stdio: "pipe",
      }).toString().trim();

      const lines = stashList.split("\n").filter(Boolean);
      
      let stashIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].substring(0, 12) === targetId || lines[i] === targetId) {
          stashIndex = i;
          break;
        }
      }

      if (stashIndex === -1) {
        throw new Error(`Checkpoint '${targetId}' not found in stash list`);
      }

      execSync(`git stash pop stash@{${stashIndex}}`, {
        cwd: this.cwd,
        encoding: "utf8",
        stdio: "inherit",
      });
    } catch (error: any) {
      throw new Error(`Rollback failed: ${error.message}`);
    }
  }

  private async rollbackFileCopy(targetId: string): Promise<void> {
    const copyPath = join(this.checkpointDir, targetId);

    if (!existsSync(copyPath)) {
      throw new Error(`Checkpoint '${targetId}' not found`);
    }

    try {
      const entries = await import("node:fs/promises");
      
      const currentFiles = await this.getAllFiles(this.cwd);
      for (const file of currentFiles) {
        try {
          await rm(join(this.cwd, file), { recursive: true, force: true });
        } catch {
          continue;
        }
      }

      await cp(copyPath, this.cwd, { recursive: true });
    } catch (error: any) {
      throw new Error(`Rollback failed: ${error.message}`);
    }
  }

  private async getAllFiles(dir: string, baseDir: string = dir): Promise<string[]> {
    const { readdir } = await import("node:fs/promises");
    const files: string[] = [];

    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        const relativePath = entry.name;

        if (entry.name === ".tachikoma-checkpoint-manifest") continue;

        if (entry.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath, baseDir);
          files.push(...subFiles);
        } else {
          files.push(relativePath);
        }
      }
    } catch {
      // Ignore errors for files we can't read
    }

    return files;
  }

  async deleteCheckpoint(targetId: string): Promise<void> {
    if (this.isGitRepo()) {
      return this.deleteGitStash(targetId);
    } else {
      return this.deleteFileCopy(targetId);
    }
  }

  private async deleteGitStash(targetId: string): Promise<void> {
    try {
      const stashList = execSync("git stash list --format='%H'", {
        cwd: this.cwd,
        encoding: "utf8",
        stdio: "pipe",
      }).toString().trim();

      const lines = stashList.split("\n").filter(Boolean);
      
      let stashIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].substring(0, 12) === targetId || lines[i] === targetId) {
          stashIndex = i;
          break;
        }
      }

      if (stashIndex === -1) {
        throw new Error(`Checkpoint '${targetId}' not found`);
      }

      execSync(`git stash drop stash@{${stashIndex}}`, {
        cwd: this.cwd,
        encoding: "utf8",
        stdio: "pipe",
      });
    } catch (error: any) {
      throw new Error(`Delete checkpoint failed: ${error.message}`);
    }
  }

  private async deleteFileCopy(targetId: string): Promise<void> {
    const copyPath = join(this.checkpointDir, targetId);
    
    if (!existsSync(copyPath)) {
      throw new Error(`Checkpoint '${targetId}' not found`);
    }

    await rm(copyPath, { recursive: true, force: true });
  }
}

export const checkpointManager = new CheckpointManager();
