function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.B2_KEY_ID &&
      process.env.B2_APPLICATION_KEY &&
      process.env.B2_BUCKET &&
      process.env.B2_REGION,
  );
}

export function getStorageConfig() {
  const region = required("B2_REGION");
  return {
    keyId: required("B2_KEY_ID"),
    applicationKey: required("B2_APPLICATION_KEY"),
    bucket: required("B2_BUCKET"),
    region,
    endpoint: `https://s3.${region}.backblazeb2.com`,
    /** Presigned URL lifetime (seconds). Files should also expire via B2 lifecycle rules. */
    presignExpiresIn: Number(process.env.B2_PRESIGN_EXPIRES_IN ?? 3600),
    /** Prefix for user uploads; set a B2 lifecycle rule to delete after 24h. */
    uploadPrefix: process.env.B2_UPLOAD_PREFIX ?? "incoming",
    /** Prefix for conversion outputs. */
    outputPrefix: process.env.B2_OUTPUT_PREFIX ?? "outputs",
  };
}

export type StorageConfig = ReturnType<typeof getStorageConfig>;
