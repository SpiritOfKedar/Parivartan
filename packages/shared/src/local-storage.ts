import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

function findMonorepoRoot(startDir = process.cwd()): string {
  let current = startDir;

  for (let depth = 0; depth < 8; depth += 1) {
    if (existsSync(resolve(current, "turbo.json"))) {
      return current;
    }

    const parent = dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return startDir;
}

/**
 * Resolve LOCAL_STORAGE_DIR to a single absolute path shared by the API and workers.
 * Relative paths are anchored to apps/api so every process reads/writes the same files.
 */
export function resolveLocalStorageRoot(): string {
  const dir = process.env.LOCAL_STORAGE_DIR?.trim();
  if (!dir) {
    throw new Error("LOCAL_STORAGE_DIR is not set");
  }

  if (isAbsolute(dir)) {
    return dir;
  }

  const monorepoRoot = findMonorepoRoot();
  if (dir.startsWith("apps/")) {
    return resolve(monorepoRoot, dir);
  }

  return resolve(monorepoRoot, "apps/api", dir);
}

export function useLocalStorage(): boolean {
  return Boolean(process.env.LOCAL_STORAGE_DIR?.trim());
}
