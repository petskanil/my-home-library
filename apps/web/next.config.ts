import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@home-library/shared", "@home-library/api"],
};

export default nextConfig;
