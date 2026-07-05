import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function findMediaPipeWasmDir(startDir) {
  let dir = startDir;

  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = join(
      dir,
      "node_modules",
      "@mediapipe",
      "tasks-vision",
      "wasm",
    );
    if (existsSync(candidate)) {
      return candidate;
    }
    dir = join(dir, "..");
  }

  return null;
}

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceWasmDir = findMediaPipeWasmDir(webRoot);
const targetWasmDir = join(webRoot, "public", "mediapipe", "wasm");

if (!sourceWasmDir) {
  console.warn(
    "copy-mediapipe-assets: @mediapipe/tasks-vision is not installed; skipping WASM copy.",
  );
  process.exit(0);
}

mkdirSync(targetWasmDir, { recursive: true });
cpSync(sourceWasmDir, targetWasmDir, { recursive: true });
console.log(`copy-mediapipe-assets: copied WASM files to ${targetWasmDir}`);
