import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "www.utahtrap.com",
      },
    ],
  },
};

export default nextConfig;
