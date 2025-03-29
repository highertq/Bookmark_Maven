/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 即使有 ESLint 错误，也允许生产构建成功
    ignoreDuringBuilds: true,
  },
  // 如果有其他配置，可以在这里添加
};

export default nextConfig; 