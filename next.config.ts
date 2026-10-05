import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',

  images: {
    unoptimized: true,
  },

  trailingSlash: false,

  basePath: process.env.NODE_ENV === 'production'
    ? '/kidakorn/dailystock'
    : '',
};

export default nextConfig;