import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 即使有 ESLint 错误，也允许生产构建成功
    ignoreDuringBuilds: true,
  },
  // SEO 优化配置
  async redirects() {
    return [
      // 重定向根路径到英文版本（有利于谷歌收录英文版）
      {
        source: '/',
        destination: '/en',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  // 启用压缩
  compress: true,
  // 启用静态优化
  trailingSlash: false,
};

export default withNextIntl(nextConfig); 