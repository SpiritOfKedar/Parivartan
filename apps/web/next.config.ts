import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@convert-hub/shared", "@convert-hub/conversion-rules"],
  async headers() {
    return [
      {
        source: "/tools/(upscale-image|remove-background|blur-faces|merge-audio)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;
