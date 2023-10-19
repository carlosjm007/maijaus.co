/** @type {import('next').NextConfig} */
// const path = require('path');
// const CopyPlugin = require('copy-webpack-plugin');

let nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // images: {
  //   unoptimized: true
  // },
  compress: true,
}

// const withBundleAnalyzer = require("@next/bundle-analyzer")({
//   enabled: process.env.ANALYZE === "true",
// });
// nextConfig = withBundleAnalyzer(nextConfig);

module.exports = nextConfig
