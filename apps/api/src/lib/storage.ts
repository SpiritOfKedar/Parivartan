import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getStorageConfig, type StorageConfig } from "../config/storage.js";

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
  const { client, config } = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
}
