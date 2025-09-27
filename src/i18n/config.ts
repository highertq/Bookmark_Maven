import { getRequestConfig } from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'zh'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'zh';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  // Don't use notFound() here as it can't be used in root layout context
  // Let middleware handle invalid locales instead
  const validLocale = locales.includes(locale as Locale) ? locale : defaultLocale;

  const messages = (await import(`./locales/${validLocale}.json`)).default;

  return {
    locale: validLocale as string,
    messages,
    timeZone: validLocale === 'zh' ? 'Asia/Shanghai' : 'America/New_York'
  };
});

// 语言配置
export const languages = {
  en: {
    name: 'English',
    flag: '🇺🇸',
    dir: 'ltr'
  },
  zh: {
    name: '中文',
    flag: '🇨🇳', 
    dir: 'ltr'
  }
} as const;
