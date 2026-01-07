import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * This repo contains other lockfiles (outside this app).
   * Pin Next.js to this app directory so App Runner builds are predictable.
   */
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
