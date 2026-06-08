/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/",
        destination: "/replo-original/index.html",
      },
    ];
  },
};

module.exports = nextConfig;
