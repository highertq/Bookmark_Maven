'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useTransition } from 'react';
import { languages, type Locale } from '@/i18n/config';

export default function LanguageSwitcher() {
  const t = useTranslations('language');
  const serverLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  
  // Get locale from pathname to avoid hydration mismatch
  const pathLocale = pathname.split('/')[1] as Locale;
  const locale = pathLocale && ['en', 'zh'].includes(pathLocale) ? pathLocale : serverLocale;

  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale) return;
    
    startTransition(() => {
      // Replace the locale in the current pathname
      const segments = pathname.split('/');
      segments[1] = newLocale;
      const newPath = segments.join('/');
      
      router.push(newPath);
      setIsOpen(false);
      
      // Save language preference
      localStorage.setItem('preferred-locale', newLocale);
    });
  };

  const currentLanguage = languages[locale];

  return (
    <div className="relative">
      {/* Language Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 
          bg-white hover:bg-gray-50 transition-colors duration-200 shadow-sm
          ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        disabled={isPending}
        aria-label={t('switch')}
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="text-sm font-medium text-gray-700 hidden sm:inline">
          {currentLanguage.name}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {Object.entries(languages).map(([langCode, langConfig]) => (
                <button
                  key={langCode}
                  onClick={() => handleLanguageChange(langCode as Locale)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 
                    transition-colors duration-200
                    ${locale === langCode ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                  `}
                >
                  <span className="text-lg">{langConfig.flag}</span>
                  <span className="font-medium">{langConfig.name}</span>
                  {locale === langCode && (
                    <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Loading Indicator */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
