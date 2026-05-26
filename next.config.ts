import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Headers críticos para WebAR:
  // - .glb necesita Content-Type model/gltf-binary (algunos hosts lo sirven mal)
  // - .usdz necesita Content-Type model/vnd.usdz+zip o iOS lo rechaza
  // - CORS habilitado para preparar la migración a S3/CDN
  async headers() {
    return [
      {
        source: '/models/:path*.glb',
        headers: [
          { key: 'Content-Type', value: 'model/gltf-binary' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
        ],
      },
      {
        source: '/models/:path*.usdz',
        headers: [
          { key: 'Content-Type', value: 'model/vnd.usdz+zip' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/models/:path*.gltf',
        headers: [
          { key: 'Content-Type', value: 'model/gltf+json' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;
