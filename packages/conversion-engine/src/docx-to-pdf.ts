import { accessSync } from "node:fs";
import mammoth from "mammoth";
import puppeteer from "puppeteer-core";
import type { ConversionOptions } from "./types.js";

function resolveChromiumPath(): string {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const candidates = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
  ];

  for (const path of candidates) {
    try {
      accessSync(path);
      return path;
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    "Chromium not found. Set PUPPETEER_EXECUTABLE_PATH or install Chromium (included in the document-worker Docker image).",
  );
}

const PRINT_HTML = (body: string) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: "Liberation Serif", "Times New Roman", serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #111;
    }
    p { margin: 0 0 0.75em; }
    h1, h2, h3 { margin: 1em 0 0.5em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid #ccc; padding: 4px 8px; vertical-align: top; }
  </style>
</head>
<body>${body}</body>
</html>`;

export async function docxToPdf(
  input: Buffer,
  options: ConversionOptions = {},
): Promise<Buffer> {
  options.onStage?.("Converting Word document to HTML…");
  const { value: html } = await mammoth.convertToHtml({ buffer: input });

  options.onStage?.("Rendering PDF…");
  const executablePath = resolveChromiumPath();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(PRINT_HTML(html), { waitUntil: "load" });
    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
    });
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}
