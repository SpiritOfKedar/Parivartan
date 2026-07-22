import { GIFEncoder, quantize, applyPalette } from "gifenc";

export function encodeGif(
  frames: ImageData[],
  width: number,
  height: number,
  delayMs: number,
): Blob {
  const gif = GIFEncoder();
  const delay = Math.max(1, Math.round(delayMs));

  for (const frame of frames) {
    const palette = quantize(frame.data, 256);
    const index = applyPalette(frame.data, palette);
    gif.writeFrame(index, width, height, {
      palette,
      delay,
      repeat: 0,
    });
  }

  gif.finish();
  const bytes = gif.bytes();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "image/gif" });
}
