/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    domains: ['localhost'],
  },
  // Disable static site generation for pages that use React context
  experimental: {
    // This setting helps with the useContext error during build
    appDir: true,
  },
};

export default nextConfig;