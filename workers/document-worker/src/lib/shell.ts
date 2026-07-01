import { spawn } from "node:child_process";

export function runCommand(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const detail = stderr.trim() || stdout.trim();
      reject(new Error(detail || `${command} exited with code ${code}`));
    });
  });
}

export async function findBinary(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      await runCommand("which", [candidate]);
      return candidate;
    } catch {
      continue;
    }
  }
  return null;
}
