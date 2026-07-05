import { copyFile, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import {
  getLocalStorageRoot,
  getStorageConfig,
  useLocalStorage,
} from "../config/storage.js";

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

function resolveLocalPath(key: string): string {
  return join(getLocalStorageRoot(), key);
}

export function buildOutputKey(jobId: string, fileName: string): string {
  const config = getStorageConfig();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${config.outputPrefix}/${jobId}/${safeName}`;
}

export async function downloadObjectToFile(
  key: string,
  destinationPath: string,
): Promise<void> {
  if (useLocalStorage()) {
    await copyFile(resolveLocalPath(key), destinationPath);
    return;
  }

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
  if (useLocalStorage()) {
    const destination = resolveLocalPath(key);
    await mkdirSafe(dirname(destination));
    await copyFile(filePath, destination);
    return;
  }

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

async function mkdirSafe(path: string): Promise<void> {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(path, { recursive: true });
}
