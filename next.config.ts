/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack is now stable and its configuration is directly under the main config object.
  // The 'turbopack' key is no longer needed.
  // If you have specific Turbopack rules, they would go under 'experimental.turbo.rules'.
  // However, based on your config, the rules object is empty, so we can remove it.

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
};

export default nextConfig;