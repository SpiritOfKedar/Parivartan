export interface AudioClipInput {
  file: File;
  trimStartSec: number;
  trimEndSec: number;
}

export type ExportFormat = "mp3" | "wav";

export type FfmpegProgressCallback = (message: string) => void;

const FFMPEG_CORE_VERSION = "0.12.6";
const FFMPEG_BASE_URL = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

let ffmpegInstance: import("@ffmpeg/ffmpeg").FFmpeg | null = null;
let ffmpegLoading: Promise<import("@ffmpeg/ffmpeg").FFmpeg> | null = null;

export function isSupportedAudio(file: File): boolean {
  const lower = file.name.toLowerCase();
  return (
    file.type.startsWith("audio/") ||
    lower.endsWith(".mp3") ||
    lower.endsWith(".wav") ||
    lower.endsWith(".m4a") ||
    lower.endsWith(".aac") ||
    lower.endsWith(".ogg") ||
    lower.endsWith(".flac") ||
    lower.endsWith(".webm")
  );
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function parseTimeInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes(":")) {
    const [minsPart, secsPart] = trimmed.split(":");
    const mins = Number(minsPart);
    const secs = Number(secsPart);
    if (!Number.isFinite(mins) || !Number.isFinite(secs) || secs < 0 || secs >= 60) {
      return null;
    }
    return mins * 60 + secs;
  }

  const seconds = Number(trimmed);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        reject(new Error("Could not read audio duration."));
        return;
      }
      resolve(audio.duration);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read audio duration."));
    };

    audio.src = url;
  });
}

function fileExtension(file: File): string {
  const lower = file.name.toLowerCase();
  const dot = lower.lastIndexOf(".");
  if (dot > 0) {
    return lower.slice(dot + 1);
  }
  if (file.type.includes("mpeg")) return "mp3";
  if (file.type.includes("wav")) return "wav";
  if (file.type.includes("ogg")) return "ogg";
  if (file.type.includes("flac")) return "flac";
  if (file.type.includes("aac")) return "aac";
  if (file.type.includes("mp4")) return "m4a";
  return "audio";
}

export async function loadFfmpeg(
  onProgress?: FfmpegProgressCallback,
): Promise<import("@ffmpeg/ffmpeg").FFmpeg> {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  if (!ffmpegLoading) {
    ffmpegLoading = (async () => {
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { toBlobURL } = await import("@ffmpeg/util");
      const ffmpeg = new FFmpeg();

      ffmpeg.on("log", ({ message }) => {
        onProgress?.(message);
      });

      onProgress?.("Loading audio engine…");
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${FFMPEG_BASE_URL}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await toBlobURL(
          `${FFMPEG_BASE_URL}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
        workerURL: await toBlobURL(
          `${FFMPEG_BASE_URL}/ffmpeg-core.worker.js`,
          "text/javascript",
        ),
      });

      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })();
  }

  return ffmpegLoading;
}

async function trimClipToWav(
  ffmpeg: import("@ffmpeg/ffmpeg").FFmpeg,
  inputName: string,
  outputName: string,
  startSec: number,
  endSec: number,
): Promise<void> {
  await ffmpeg.exec([
    "-ss",
    startSec.toFixed(3),
    "-to",
    endSec.toFixed(3),
    "-i",
    inputName,
    "-ar",
    "44100",
    "-ac",
    "2",
    "-c:a",
    "pcm_s16le",
    outputName,
  ]);
}

function fileDataToArrayBuffer(data: import("@ffmpeg/ffmpeg").FileData): ArrayBuffer {
  if (typeof data === "string") {
    return new TextEncoder().encode(data).buffer;
  }
  return data.buffer.slice(
    data.byteOffset,
    data.byteOffset + data.byteLength,
  ) as ArrayBuffer;
}

function fileDataToBlob(data: import("@ffmpeg/ffmpeg").FileData, type: string): Blob {
  return new Blob([fileDataToArrayBuffer(data)], { type });
}

export async function mergeAudioClips(
  clips: AudioClipInput[],
  format: ExportFormat,
  onProgress?: FfmpegProgressCallback,
): Promise<Blob> {
  if (clips.length === 0) {
    throw new Error("Add at least one audio clip.");
  }

  const ffmpeg = await loadFfmpeg(onProgress);
  const { fetchFile } = await import("@ffmpeg/util");

  const trimmedNames: string[] = [];

  for (let index = 0; index < clips.length; index += 1) {
    const clip = clips[index]!;
    const ext = fileExtension(clip.file);
    const inputName = `input_${index}.${ext}`;
    const trimmedName = `trimmed_${index}.wav`;

    onProgress?.(`Preparing clip ${index + 1} of ${clips.length}…`);
    await ffmpeg.writeFile(inputName, await fetchFile(clip.file));

    const start = Math.max(0, clip.trimStartSec);
    const end = Math.max(start + 0.05, clip.trimEndSec);
    await trimClipToWav(ffmpeg, inputName, trimmedName, start, end);
    await ffmpeg.deleteFile(inputName);
    trimmedNames.push(trimmedName);
  }

  let mergedWav = trimmedNames[0]!;

  if (trimmedNames.length > 1) {
    const listContent = trimmedNames.map((name) => `file '${name}'`).join("\n");
    await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(listContent));

    mergedWav = "merged.wav";
    onProgress?.("Merging clips…");
    await ffmpeg.exec([
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      "concat.txt",
      "-c",
      "copy",
      mergedWav,
    ]);

    await ffmpeg.deleteFile("concat.txt");
    for (const name of trimmedNames) {
      await ffmpeg.deleteFile(name);
    }
  }

  const outputName = format === "wav" ? "output.wav" : "output.mp3";

  if (format === "wav") {
    if (mergedWav !== outputName) {
      await ffmpeg.exec(["-i", mergedWav, "-c", "copy", outputName]);
      await ffmpeg.deleteFile(mergedWav);
    }
  } else {
    onProgress?.("Encoding MP3…");
    try {
      await ffmpeg.exec([
        "-i",
        mergedWav,
        "-c:a",
        "libmp3lame",
        "-b:a",
        "192k",
        outputName,
      ]);
    } catch {
      await ffmpeg.exec(["-i", mergedWav, "-c:a", "libvorbis", "-q:a", "4", "output.ogg"]);
      const oggData = await ffmpeg.readFile("output.ogg");
      await ffmpeg.deleteFile(mergedWav);
      await ffmpeg.deleteFile("output.ogg");
      return fileDataToBlob(oggData, "audio/ogg");
    }
    if (mergedWav !== "output.wav") {
      await ffmpeg.deleteFile(mergedWav);
    }
  }

  const data = await ffmpeg.readFile(outputName);
  await ffmpeg.deleteFile(outputName);

  const mimeType = format === "wav" ? "audio/wav" : "audio/mpeg";
  return fileDataToBlob(data, mimeType);
}

export function mergedDurationSec(
  clips: Array<{ trimStartSec: number; trimEndSec: number }>,
): number {
  return clips.reduce(
    (sum, clip) => sum + Math.max(0, clip.trimEndSec - clip.trimStartSec),
    0,
  );
}
