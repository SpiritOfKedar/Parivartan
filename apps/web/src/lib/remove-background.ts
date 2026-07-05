import { removeBackground } from "@imgly/background-removal";
import { baseName } from "./image-io";

export interface RemoveBackgroundResult {
  blob: Blob;
  fileName: string;
}

export async function removeImageBackground(
  file: File,
  onProgress?: (message: string, current: number, total: number) => void,
): Promise<RemoveBackgroundResult> {
  const blob = await removeBackground(file, {
    model: "isnet_fp16",
    output: {
      format: "image/png",
      quality: 0.9,
    },
    progress: onProgress,
  });

  return {
    blob,
    fileName: `${baseName(file.name)}-nobg.png`,
  };
}
