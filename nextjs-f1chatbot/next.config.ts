import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config: any) => {
    // Handle binary .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
      type: 'javascript/auto',
    });

    // Add ONNX to externals to prevent webpack from trying to bundle it
    config.externals = [
      ...(config.externals || []),
      { 'onnxruntime-node': 'commonjs onnxruntime-node' }
    ];

    // Handle potential AWS SDK fallbacks if needed
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      "aws-crt": false,
      "@aws-sdk/credential-providers": false,
    };

    return config;
  },
};

export default nextConfig;