"use client";

import { useState } from "react";
import { isSupportedImage } from "../lib/image-io";
import { ServerConversionTool } from "./server-conversion-tool";

function validateImage(file: File): string | null {
  return isSupportedImage(file)
    ? null
    : "Only image files are accepted (JPEG, PNG, WebP, GIF).";
}

export function UpscaleImageTool() {
  const [scale, setScale] = useState<2 | 4>(2);

  return (
    <ServerConversionTool
      toolId="upscale-image"
      accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
      uploadLabel="Select an image file"
      uploadHint="upscaled on our servers"
      validateFile={validateImage}
      convertLabel="Upscale image"
      convertingLabel="Upscaling on server…"
      downloadLabel="Download upscaled image"
      successMessage="Upscaling complete. Download your enhanced image above."
      maxBytes={25 * 1024 * 1024}
      getOptions={() => ({ scale })}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Scale factor</p>
        <div className="flex flex-wrap gap-2">
          {([2, 4] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setScale(value)}
              className={[
                "rounded border px-3 py-1.5 text-sm",
                scale === value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
              ].join(" ")}
            >
              {value}×
            </button>
          ))}
        </div>
      </div>
    </ServerConversionTool>
  );
}

export function RemoveBackgroundTool() {
  return (
    <ServerConversionTool
      toolId="remove-background"
      accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
      uploadLabel="Select an image file"
      uploadHint="processed on our servers"
      validateFile={validateImage}
      convertLabel="Remove background"
      convertingLabel="Removing background…"
      downloadLabel="Download PNG"
      successMessage="Background removed. Download your transparent PNG above."
      maxBytes={25 * 1024 * 1024}
    />
  );
}

export function BlurFacesTool() {
  const [blurStrength, setBlurStrength] = useState<
    "light" | "medium" | "strong"
  >("medium");

  return (
    <ServerConversionTool
      toolId="blur-faces"
      accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
      uploadLabel="Select an image file"
      uploadHint="processed on our servers"
      validateFile={validateImage}
      convertLabel="Blur faces"
      convertingLabel="Blurring faces…"
      downloadLabel="Download image"
      successMessage="Face blurring complete. Download your image above."
      maxBytes={25 * 1024 * 1024}
      getOptions={() => ({ blurStrength })}
    >
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Blur strength</p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["light", "Light"],
              ["medium", "Medium"],
              ["strong", "Strong"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setBlurStrength(value)}
              className={[
                "rounded border px-3 py-1.5 text-sm capitalize",
                blurStrength === value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted hover:bg-background-subtle hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </ServerConversionTool>
  );
}
