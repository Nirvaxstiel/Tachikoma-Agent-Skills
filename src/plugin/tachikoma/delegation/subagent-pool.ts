import { spawn } from "child_process";

export interface SubagentResult {
  summary: string;
  exitCode: number;
  duration: number;
}

interface RunningTask {
  resolve: (result: SubagentResult) => void;
  reject: (error: Error) => void;
  startTime: number;
  proc: ReturnType<typeof spawn>;
}

const MAX_CONCURRENT = 3;
const TIMEOUT_MS = 300000; // 5 minutes

const runningTasks: RunningTask[] = [];

async function waitForSlot(): Promise<void> {
  while (runningTasks.length >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (runningTasks.length < MAX_CONCURRENT) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
}

function cleanupTask(task: RunningTask): void {
  const index = runningTasks.indexOf(task);
  if (index !== -1) {
    runningTasks.splice(index, 1);
  }
  try {
    task.proc.kill();
  } catch {
    // Process already exited
  }
}

export async function spawnSubagent(
  agent: string,
  task: string,
  _toolsets?: string[],
): Promise<SubagentResult> {
  await waitForSlot();

  return new Promise<SubagentResult>((resolve, reject) => {
    const startTime = Date.now();
    const timeout = setTimeout(() => {
      const elapsed = Date.now() - startTime;
      cleanupTask(runningTask);
      reject(new Error(`Subagent timed out after ${elapsed}ms`));
    }, TIMEOUT_MS);

    const runningTask: RunningTask = {
      resolve: (result) => {
        clearTimeout(timeout);
        cleanupTask(runningTask);
        resolve(result);
      },
      reject: (error) => {
        clearTimeout(timeout);
        cleanupTask(runningTask);
        reject(error);
      },
      startTime,
      proc: null as any,
    };

    const proc = spawn("opencode", ["--agent", agent, "--task", task], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    runningTask.proc = proc;
    runningTasks.push(runningTask);

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code: number | null) => {
      const duration = Date.now() - startTime;
      const exitCode = code ?? -1;

      let summary = stdout.trim();
      if (!summary && stderr.trim()) {
        summary = `[stderr]: ${stderr.trim()}`;
      }
      if (!summary) {
        summary = `Subagent completed with exit code ${exitCode} in ${duration}ms (no output)`;
      }

      runningTask.resolve({
        summary,
        exitCode,
        duration,
      });
    });

    proc.on("error", (err: Error) => {
      runningTask.reject(err);
    });
  });
}
