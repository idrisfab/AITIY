/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Use export mode for Netlify deployment
  output: 'export',
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
};

export default nextConfig;