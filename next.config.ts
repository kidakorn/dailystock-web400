import type { NextConfig } from 'next';

// Development is served from the site root (http://localhost:3000/); the production build is deployed under
const basePath = process.env.NODE_ENV === 'production' ? '/kidakorn/dailystock' : '';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  // out/package-summary/index.html instead of out/package-summary.html: a plain web server (IIS) resolves the folder's default document.
  trailingSlash: true,
  // The image optimiser needs a server; static export serves images as they are.
  images: { unoptimized: true },
  // Browser code (the sidebar cookie path) needs the prefix too.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
