import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/ui',
  transpilePackages: ['ui-web'],
};

export default nextConfig;
