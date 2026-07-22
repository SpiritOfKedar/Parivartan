import { encodeCanvas, outputExtension, type ImageOutputFormat } from "./image-io";

export interface HtmlToImageOptions {
  html: string;
  width: number;
  height: number;
  format: ImageOutputFormat;
}

export interface HtmlToImageResult {
  blob: Blob;
  fileName: string;
  outputMimeType: string;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function htmlToImage(
  options: HtmlToImageOptions,
): Promise<HtmlToImageResult> {
  const width = Math.max(1, Math.floor(options.width));
  const height = Math.max(1, Math.floor(options.height));
  const html = options.html.trim();
  if (!html) {
    throw new Error("Paste some HTML to convert.");
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute(
    "sandbox",
    "allow-same-origin allow-scripts",
  );
  iframe.style.cssText =
    "position:fixed;left:-10000px;top:0;border:0;opacity:0;pointer-events:none;";
  iframe.width = String(width);
  iframe.height = String(height);
  document.body.appendChild(iframe);

  try {
    const doc = iframe.contentDocument;
    if (!doc) {
      throw new Error("Could not create render frame.");
    }

    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>
      html, body { margin: 0; padding: 0; width: ${width}px; height: ${height}px; overflow: hidden; background: #fff; }
    </style></head><body>${html}</body></html>`);
    doc.close();

    await wait(80);
    if (doc.fonts?.ready) {
      await doc.fonts.ready.catch(() => undefined);
    }
    await wait(40);

    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(doc.body, {
      width,
      height,
      windowWidth: width,
      windowHeight: height,
      backgroundColor: "#ffffff",
      scale: 1,
      logging: false,
      useCORS: true,
    });

    const mimeType =
      options.format === "png"
        ? "image/png"
        : options.format === "webp"
          ? "image/webp"
          : "image/jpeg";
    const blob = await encodeCanvas(
      canvas,
      mimeType,
      mimeType === "image/png" ? undefined : 0.92,
    );

    return {
      blob,
      fileName: `html-export${outputExtension(mimeType)}`,
      outputMimeType: mimeType,
    };
  } finally {
    iframe.remove();
  }
}
