import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@convert-hub/shared", "@convert-hub/conversion-rules"],
};

export default nextConfig;
