/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/phpapi/:path*',
        destination: 'http://localhost/pbpvccanteen/backend/api/:path*',
      },
    ];
  },
};

export default nextConfig;
