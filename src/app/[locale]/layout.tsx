import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BodyAttributeCleaner from "@/components/body-attribute-cleaner";
import { NextIntlClientProvider } from 'next-intl';

import { getTranslations, getMessages } from 'next-intl/server';
import { locales } from '@/i18n/config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 动态生成多语言SEO元数据
export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isZh = locale === 'zh';
  
  return {
    title: isZh ? "书签专家 | 依据书签解析你的网络性格" : "BookMaven | AI-Powered Bookmark Personality Analysis",
    description: isZh 
      ? "上传书签，AI智能分析你的浏览习惯，生成专属网络性格标签和精美分享卡片，揭示你的真实网络人格。"
      : "Upload your bookmarks and let AI analyze your browsing habits to generate exclusive digital personality tags and beautiful sharing cards.",
    keywords: isZh 
      ? "书签分析,网络人格测试,AI性格分析,浏览习惯分析,个性化书签评价,网络标签生成,书签专家"
      : "bookmark analysis,digital personality test,AI personality analysis,browsing habit analysis,personalized bookmark evaluation,digital tag generation,BookMaven",
    authors: [{ name: isZh ? "书签专家团队" : "BookMaven Team" }],
    creator: isZh ? "书签专家" : "BookMaven",
    publisher: isZh ? "书签专家" : "BookMaven",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `https://www.bookmarkmaven.space/${locale}`,
      languages: {
        'zh-CN': 'https://www.bookmarkmaven.space/zh',
        'en-US': 'https://www.bookmarkmaven.space/en',
        'x-default': 'https://www.bookmarkmaven.space/en', // 默认指向英文版
      }
    },
    // 添加更多SEO相关配置
    category: 'technology',
    classification: 'Web Application',
    openGraph: {
      type: "website",
      url: `https://www.bookmarkmaven.space/${locale}`,
      title: isZh ? "书签专家 - 发现你的网络性格" : "BookMaven - Discover Your Digital Personality",
      description: isZh 
        ? "通过AI分析书签，揭示你独特的网络人格，生成专属性格卡片"
        : "Analyze bookmarks with AI to reveal your unique digital personality and generate exclusive personality cards",
      siteName: isZh ? "书签专家" : "BookMaven",
      locale: locale,
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: isZh ? "书签专家 - 网络性格测试" : "BookMaven - Digital Personality Test",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: isZh ? "书签专家 - 发现你的网络性格" : "BookMaven - Discover Your Digital Personality",
      description: isZh 
        ? "上传书签，获取AI智能分析和专属网络性格标签"
        : "Upload bookmarks, get AI analysis and exclusive digital personality tags",
      images: ["/twitter-image.jpg"],
    },
  };
}

// 生成静态参数
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head>
        {/* Google Analytics 跟踪代码 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-K0HG9EKGWD"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-K0HG9EKGWD');
            `
          }}
        />
        
        {/* 添加结构化数据 */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": locale === 'zh' ? "书签专家" : "BookMaven",
            "alternateName": locale === 'zh' ? "BookMaven" : "Bookmark Expert",
            "url": `https://www.bookmarkmaven.space/${locale}`,
            "description": locale === 'zh' 
              ? "上传书签，AI智能分析你的浏览习惯，生成专属网络性格标签"
              : "Upload bookmarks, AI analyzes your browsing habits to generate exclusive digital personality tags",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "All",
            "inLanguage": locale === 'zh' ? 'zh-CN' : 'en-US',
            "browserRequirements": "Requires JavaScript. Requires HTML5.",
            "softwareVersion": "1.0",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": locale === 'zh' ? "CNY" : "USD",
              "availability": "https://schema.org/InStock"
            },
            "author": {
              "@type": "Organization",
              "name": locale === 'zh' ? "书签专家团队" : "BookMaven Team"
            },
            "publisher": {
              "@type": "Organization",
              "name": locale === 'zh' ? "书签专家" : "BookMaven"
            },
            "featureList": locale === 'zh' ? [
              "书签文件上传",
              "AI智能分析",
              "网络性格测试",
              "个性化标签生成",
              "分享卡片制作"
            ] : [
              "Bookmark file upload",
              "AI intelligent analysis", 
              "Digital personality test",
              "Personalized tag generation",
              "Sharing card creation"
            ],
            "screenshot": "https://www.bookmarkmaven.space/og-image.jpg"
          })
        }} />
        
        {/* 添加面包屑导航结构化数据 */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": locale === 'zh' ? "首页" : "Home",
                "item": `https://www.bookmarkmaven.space/${locale}`
              }
            ]
          })
        }} />
      </head>
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider messages={messages}>
          {children}
          <BodyAttributeCleaner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
