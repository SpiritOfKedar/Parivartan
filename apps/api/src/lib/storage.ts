import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  getStorageConfig,
  readLocalStorageFile,
  type StorageConfig,
  useLocalStorage,
  writeLocalStorageFile,
} from "../config/storage.js";

let client: S3Client | undefined;
let config: StorageConfig | undefined;

function getClient(): { client: S3Client; config: StorageConfig } {
  if (!client || !config) {
    config = getStorageConfig();
    client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.keyId,
        secretAccessKey: config.applicationKey,
      },
      forcePathStyle: true,
    });
  }
  return { client, config };
}

export function buildObjectKey(
  prefix: string,
  jobId: string,
  fileName: string,
): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${prefix}/${jobId}/${safeName}`;
}

export async function createUploadUrl(input: {
  jobId: string;
  fileName: string;
  mimeType: string;
}): Promise<{ key: string; uploadUrl: string; expiresIn: number }> {
  if (useLocalStorage()) {
    throw new Error("Presigned uploads are not supported with LOCAL_STORAGE_DIR.");
  }

  const { client, config } = getClient();
  const key = buildObjectKey(config.uploadPrefix, input.jobId, input.fileName);

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: input.mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: config.presignExpiresIn,
  });

  return { key, uploadUrl, expiresIn: config.presignExpiresIn };
}

export async function createDownloadUrl(key: string): Promise<{
  downloadUrl: string;
  expiresIn: number;
}> {
  if (useLocalStorage()) {
    throw new Error("Presigned downloads are not supported with LOCAL_STORAGE_DIR.");
  }

  const { client, config } = getClient();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  const downloadUrl = await getSignedUrl(client, command, {
    expiresIn: config.presignExpiresIn,
  });

  return { downloadUrl, expiresIn: config.presignExpiresIn };
}

export async function deleteObject(key: string): Promise<void> {
  if (useLocalStorage()) {
    const { unlink } = await import("node:fs/promises");
    const { resolveLocalStoragePath } = await import("../config/storage.js");
    await unlink(resolveLocalStoragePath(key)).catch(() => undefined);
    return;
  }

  const { client, config } = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
}

export async function uploadObject(input: {
  key: string;
  body: Buffer | Uint8Array;
  mimeType: string;
}): Promise<void> {
  if (useLocalStorage()) {
    await writeLocalStorageFile(input.key, input.body);
    return;
  }

  const { client, config } = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: input.key,
      Body: input.body,
      ContentType: input.mimeType,
    }),
  );
}

export async function getObjectBytes(key: string): Promise<Uint8Array> {
  if (useLocalStorage()) {
    return readLocalStorageFile(key);
  }

  const { client, config } = getClient();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("Could not read file from storage.");
  }
  return bytes;
}
