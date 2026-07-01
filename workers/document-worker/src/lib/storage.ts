import { readFile, writeFile } from "node:fs/promises";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getStorageConfig } from "../config/storage.js";

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!client) {
    const config = getStorageConfig();
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
  return client;
}

export function buildOutputKey(
  jobId: string,
  fileName: string,
): string {
  const config = getStorageConfig();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${config.outputPrefix}/${jobId}/${safeName}`;
}

export async function downloadObjectToFile(
  key: string,
  destinationPath: string,
): Promise<void> {
  const config = getStorageConfig();
  const response = await getClient().send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );

  const bytes = await response.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("Could not download input file from storage.");
  }

  await writeFile(destinationPath, bytes);
}

export async function uploadFile(
  key: string,
  filePath: string,
  mimeType: string,
): Promise<void> {
  const config = getStorageConfig();
  const body = await readFile(filePath);
  await getClient().send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: body,
      ContentType: mimeType,
    }),
  );
}
