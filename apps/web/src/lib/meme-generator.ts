import {
  baseName,
  encodeCanvas,
  loadImage,
  outputExtension,
} from "./image-io";

export interface MemeGeneratorOptions {
  topText: string;
  bottomText: string;
}

export interface MemeGeneratorResult {
  blob: Blob;
  fileName: string;
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.toUpperCase().trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [];
  }

  const lines: string[] = [];
  let current = words[0]!;

  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (context.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i]!;
    }
  }
  lines.push(current);
  return lines;
}

function drawMemeLines(
  context: CanvasRenderingContext2D,
  lines: string[],
  centerX: number,
  startY: number,
  lineHeight: number,
  fromBottom: boolean,
) {
  const totalHeight = lines.length * lineHeight;
  let y = fromBottom ? startY - totalHeight + lineHeight : startY;

  for (const line of lines) {
    context.strokeText(line, centerX, y);
    context.fillText(line, centerX, y);
    y += lineHeight;
  }
}

export async function generateMeme(
  file: File,
  options: MemeGeneratorOptions,
): Promise<MemeGeneratorResult> {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not create canvas context.");
  }

  context.drawImage(image, 0, 0);

  const fontSize = Math.max(
    24,
    Math.round(Math.min(image.naturalWidth, image.naturalHeight) * 0.09),
  );
  const padding = Math.round(fontSize * 0.5);
  const maxWidth = image.naturalWidth - padding * 2;

  context.font = `bold ${fontSize}px Impact, Haettenschweiler, "Arial Black", sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillStyle = "#ffffff";
  context.strokeStyle = "#000000";
  context.lineWidth = Math.max(2, Math.round(fontSize * 0.08));
  context.lineJoin = "round";

  const topLines = wrapText(context, options.topText, maxWidth);
  const bottomLines = wrapText(context, options.bottomText, maxWidth);
  const lineHeight = Math.round(fontSize * 1.15);

  drawMemeLines(
    context,
    topLines,
    image.naturalWidth / 2,
    padding,
    lineHeight,
    false,
  );
  drawMemeLines(
    context,
    bottomLines,
    image.naturalWidth / 2,
    image.naturalHeight - padding,
    lineHeight,
    true,
  );

  const blob = await encodeCanvas(canvas, "image/jpeg", 0.92);
  return {
    blob,
    fileName: `${baseName(file.name)}-meme.jpg`,
  };
}
