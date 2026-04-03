import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: [
    'genkit',
    '@genkit-ai/core',
    '@genkit-ai/googleai',
    'express',
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from bundling these packages on the server
      config.externals = config.externals || [];
      config.externals.push({
        'genkit': 'commonjs genkit',
        '@genkit-ai/core': 'commonjs @genkit-ai/core',
        '@genkit-ai/googleai': 'commonjs @genkit-ai/googleai',
        'express': 'commonjs express',
      });
    }
    return config;
  },
};

export default nextConfig;
