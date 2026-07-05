import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { resolveLocalStorageRoot, useLocalStorage } from "@convert-hub/shared/local-storage";

export { useLocalStorage };

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function isB2StorageConfigured(): boolean {
  return Boolean(
    process.env.B2_KEY_ID &&
      process.env.B2_APPLICATION_KEY &&
      process.env.B2_BUCKET &&
      process.env.B2_REGION,
  );
}

export function isStorageConfigured(): boolean {
  return useLocalStorage() || isB2StorageConfigured();
}

export function getLocalStorageRoot(): string {
  return resolveLocalStorageRoot();
}

export function resolveLocalStoragePath(key: string): string {
  return join(getLocalStorageRoot(), key);
}

export async function writeLocalStorageFile(
  key: string,
  body: Buffer | Uint8Array,
): Promise<void> {
  const destination = resolveLocalStoragePath(key);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, body);
}

export async function readLocalStorageFile(key: string): Promise<Uint8Array> {
  const bytes = await readFile(resolveLocalStoragePath(key));
  return new Uint8Array(bytes);
}

export function getStorageConfig() {
  const region = required("B2_REGION");
  return {
    keyId: required("B2_KEY_ID"),
    applicationKey: required("B2_APPLICATION_KEY"),
    bucket: required("B2_BUCKET"),
    region,
    endpoint: `https://s3.${region}.backblazeb2.com`,
    presignExpiresIn: Number(process.env.B2_PRESIGN_EXPIRES_IN ?? 3600),
    uploadPrefix: process.env.B2_UPLOAD_PREFIX ?? "incoming",
    outputPrefix: process.env.B2_OUTPUT_PREFIX ?? "outputs",
  };
}

export type StorageConfig = ReturnType<typeof getStorageConfig>;

export function getStorageBackendLabel(): string {
  if (useLocalStorage()) {
    return `local filesystem (${getLocalStorageRoot()})`;
  }
  if (isB2StorageConfigured()) {
    return "Backblaze B2";
  }
  return "not configured";
}
