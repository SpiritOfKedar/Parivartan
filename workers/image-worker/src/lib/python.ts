import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const workerRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const scriptsDir = join(workerRoot, "scripts");

export function runPythonScript(
  scriptName: string,
  args: string[],
): Promise<void> {
  const python = process.env.IMAGE_WORKER_PYTHON ?? "python3";
  const scriptPath = join(scriptsDir, scriptName);

  return new Promise((resolve, reject) => {
    const child = spawn(python, [scriptPath, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `${scriptName} exited with code ${code}`));
    });
  });
}
