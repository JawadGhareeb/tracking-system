import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep development and production build artifacts isolated to avoid manifest
  // races when build/dev are run in parallel.
  distDir: process.env.NODE_ENV === "development" ? "sewing-dev" : "sewing",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.hospitalbase.somee.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
