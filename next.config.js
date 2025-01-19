/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, '@babel/runtime', 'next-auth'];
    }
    return config;
  },
  output: 'standalone'
}

module.exports = nextConfig 