import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'], // Common avatars
  },
  // Strict mode for robustness
  reactStrictMode: true,
};

export default nextConfig;
