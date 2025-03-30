import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BodyAttributeCleaner from "@/components/body-attribute-cleaner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 增强版SEO元数据
export const metadata: Metadata = {
  title: "书签专家 | 依据书签解析你的网络性格",
  description: "上传书签，AI智能分析你的浏览习惯，生成专属网络性格标签和精美分享卡片，揭示你的真实网络人格。",
  keywords: "书签分析,网络人格测试,AI性格分析,浏览习惯分析,个性化书签评价,网络标签生成,书签专家",
  authors: [{ name: "书签专家团队" }],
  creator: "书签专家",
  publisher: "书签专家",
  robots: "index, follow",
  alternates: {
    canonical: "https://www.bookmarkmaven.space",
  },
  openGraph: {
    type: "website",
    url: "https://www.bookmarkmaven.space",
    title: "书签专家 - 发现你的网络性格",
    description: "通过AI分析书签，揭示你独特的网络人格，生成专属性格卡片",
    siteName: "书签专家",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "书签专家 - 网络性格测试",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "书签专家 - 发现你的网络性格",
    description: "上传书签，获取AI智能分析和专属网络性格标签",
    images: ["/twitter-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        {/* 添加结构化数据 */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "书签专家",
            "url": "https://www.bookmarkmaven.space",
            "description": "上传书签，AI智能分析你的浏览习惯，生成专属网络性格标签",
            "applicationCategory": "UtilityApplication",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "CNY"
            }
          })
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <BodyAttributeCleaner />
      </body>
    </html>
  );
}
