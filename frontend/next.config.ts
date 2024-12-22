import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Enable static exports
  images: {
    unoptimized: true
  }
};

export default nextConfig;
