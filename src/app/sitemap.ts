import { MetadataRoute } from 'next'
import { locales } from '@/i18n/config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.bookmarkmaven.space'
  
  // 生成所有语言版本的URL
  const sitemapEntries: MetadataRoute.Sitemap = []
  
  // 主页面
  locales.forEach((locale) => {
    sitemapEntries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: locale === 'en' ? 1.0 : 0.8, // 英文版本优先级更高
      alternates: {
        languages: {
          'zh': `${baseUrl}/zh`,
          'en': `${baseUrl}/en`,
        }
      }
    })
  })

  // 如果有其他页面，可以在这里添加
  // 例如：隐私政策、使用条款等
  locales.forEach((locale) => {
    sitemapEntries.push({
      url: `${baseUrl}/${locale}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
      alternates: {
        languages: {
          'zh': `${baseUrl}/zh/privacy`,
          'en': `${baseUrl}/en/privacy`,
        }
      }
    })
  })

  return sitemapEntries
}
