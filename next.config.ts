import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: false,
  basePath: process.env.NODE_ENV === 'production' ? '/kidakorn' : '',
};

export default nextConfig;