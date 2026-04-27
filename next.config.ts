import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: "/workspace/projects",
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
