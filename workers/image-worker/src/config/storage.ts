import { resolveLocalStorageRoot, useLocalStorage } from "@convert-hub/shared/local-storage";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export { useLocalStorage };

export function isStorageConfigured(): boolean {
  if (useLocalStorage()) {
    return true;
  }

  return Boolean(
    process.env.B2_KEY_ID &&
      process.env.B2_APPLICATION_KEY &&
      process.env.B2_BUCKET &&
      process.env.B2_REGION,
  );
}

export function getLocalStorageRoot(): string {
  return resolveLocalStorageRoot();
}

export function getStorageConfig() {
  const region = required("B2_REGION");
  return {
    keyId: required("B2_KEY_ID"),
    applicationKey: required("B2_APPLICATION_KEY"),
    bucket: required("B2_BUCKET"),
    region,
    endpoint: `https://s3.${region}.backblazeb2.com`,
    uploadPrefix: process.env.B2_UPLOAD_PREFIX ?? "incoming",
    outputPrefix: process.env.B2_OUTPUT_PREFIX ?? "outputs",
  };
}
