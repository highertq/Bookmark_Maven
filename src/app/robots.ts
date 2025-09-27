import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 不允许爬取API路由和内部文件
        disallow: ['/api/', '/_next/', '/_vercel/', '/admin/'],
      },
      {
        // 优先考虑英文内容
        userAgent: 'Googlebot',
        allow: ['/en/', '/en/*'],
        crawlDelay: 1,
      }
    ],
    sitemap: 'https://www.bookmarkmaven.space/sitemap.xml',
    host: 'https://www.bookmarkmaven.space'
  }
}
