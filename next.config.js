/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["react-pdf", "pdfjs-dist"],
  webpack: (config) => {
    config.module.rules.push({
      test: /\.yaml$/,
      type: "asset/source",
    });
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
  async rewrites() {
    const coreEngineUrl = process.env.CORE_ENGINE_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/pdf",
        destination: `${coreEngineUrl}/generate-pdf`,
      },
      {
        source: "/api/:path((?!auth).*)",
        destination: `${coreEngineUrl}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
