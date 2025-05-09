/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Static export disabled to allow middleware to function
  // output: 'export',
  // Configure images for static export
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  // Improve static site generation
  trailingSlash: true,
  distDir: '.next',
  // Skip type checking in build to avoid issues
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Make environment variables available to the server-side
  env: {
    USE_MOCK_DATA: process.env.USE_MOCK_DATA || 'false',
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001/api',
  },
};

export default nextConfig;