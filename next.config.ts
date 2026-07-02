import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project so Next.js does not infer a stray
  // parent lockfile (~/package-lock.json) as the root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
