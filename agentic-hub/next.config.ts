import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    turbo: {
      root: __dirname,
    },
  },
  outputFileTracingExcludes: {
    "*": [
      "Desktop/**",
      "Documents/**",
      "Downloads/**",
      "Library/**",
      "Movies/**",
      "Music/**",
      "Pictures/**",
      "Public/**",
      "Projects/**",
      "Applications/**",
      "miniforge3/**",
      ".cache/**",
      ".npm/**",
      ".nvm/**",
      ".bun/**",
      ".claude/**",
      ".config/**",
      "dev/**",
      "ai/**",
      "go/**",
      "bin/**",
      ".Trash/**",
    ],
  },
};

export default nextConfig;
