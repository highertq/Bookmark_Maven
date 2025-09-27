'use client';

import { useState, useEffect } from 'react';
import { Bookmark, analyzeBookmarks, findFullestCategory, findDuplicateBookmarks } from '@/lib/bookmark-parser';
import { useTranslations } from 'next-intl';

interface BookmarkAnalyticsProps {
  bookmarks: Bookmark[];
}

// 定义分析结果类型，避免any类型
interface AnalysisResult {
  categories: Record<string, number>;
  domains: Record<string, number>;
  yearDistribution: [string, number][];
  topCategories: [string, number][];
  topDomains: [string, number][];
}

// 定义分类结果类型
interface CategoryResult {
  category: string;
  count: number;
  bookmarks: Bookmark[];
}

export default function BookmarkAnalytics({ bookmarks }: BookmarkAnalyticsProps) {
  const t = useTranslations('analytics');
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'domains' | 'duplicates'>('overview');
  const [fullBookmarks, setFullBookmarks] = useState<Bookmark[]>([]);
  const [insights, setInsights] = useState<AnalysisResult | null>(null);
  const [fullestCategory, setFullestCategory] = useState<CategoryResult | null>(null);
  const [duplicates, setDuplicates] = useState<Record<string, Bookmark[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (bookmarks && bookmarks.length > 0) {
      console.log("处理书签数据，总数:", bookmarks.length);
      
      const bookmarksCopy = JSON.parse(JSON.stringify(bookmarks));
      setFullBookmarks(bookmarksCopy);
      
      const newInsights = analyzeBookmarks(bookmarksCopy);
      setInsights(newInsights as AnalysisResult);
      
      const newFullestCategory = findFullestCategory(bookmarksCopy);
      setFullestCategory(newFullestCategory as CategoryResult);
      
      const newDuplicates = findDuplicateBookmarks(bookmarksCopy);
      setDuplicates(newDuplicates as Record<string, Bookmark[]>);
      
      setLoading(false);
      
      console.log("Analysis results:", {
        totalBookmarks: bookmarksCopy.length,
        categories: Object.keys(newInsights.categories).length,
        domains: Object.keys(newInsights.domains).length,
        duplicates: Object.keys(newDuplicates).length,
        yearDistribution: newInsights.yearDistribution,
        topCategory: newFullestCategory?.category
      });
    }
  }, [bookmarks]);
  
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        {t('noBookmarksMessage')}
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
        <p className="text-gray-600">{t('analyzingMessage')}</p>
      </div>
    );
  }
  
  const bookmarksCount = fullBookmarks.length;
  const categoriesCount = insights ? Object.keys(insights.categories).length : 0;
  const domainsCount = insights ? Object.keys(insights.domains).length : 0;
  const duplicateCount = duplicates ? Object.keys(duplicates).length : 0;
  
  const BookmarkIcon = () => (
    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
    </svg>
  );
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">{t('title')}</h2>
      
      <div className="text-xs text-gray-500 mb-2">
        {t('loadedBookmarks', { count: bookmarksCount })} | {t('generatedAt', { time: new Date().toLocaleString() })}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600">{bookmarksCount}</div>
          <div className="text-sm text-gray-600">{t('totalBookmarks')}</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600">{categoriesCount}</div>
          <div className="text-sm text-gray-600">{t('categories')}</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-600">{domainsCount}</div>
          <div className="text-sm text-gray-600">{t('domains')}</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-red-600">{duplicateCount}</div>
          <div className="text-sm text-gray-600">{t('duplicates')}</div>
        </div>
      </div>
      
      <div className="border-b-2 border-gray-200 mb-6">
        <ul className="flex flex-wrap -mb-px text-center">
          <li className="mr-2 flex-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`inline-block p-4 w-full rounded-t-lg text-base font-medium transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="inline-block mr-2">📊</span>{t('tabs.overview')}
            </button>
          </li>
          <li className="mr-2 flex-1">
            <button
              onClick={() => setActiveTab('categories')}
              className={`inline-block p-4 w-full rounded-t-lg text-base font-medium transition-all ${
                activeTab === 'categories'
                  ? 'bg-green-50 text-green-700 border-b-2 border-green-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="inline-block mr-2">📁</span>{t('tabs.categories')}
            </button>
          </li>
          <li className="mr-2 flex-1">
            <button
              onClick={() => setActiveTab('domains')}
              className={`inline-block p-4 w-full rounded-t-lg text-base font-medium transition-all ${
                activeTab === 'domains'
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="inline-block mr-2">🌐</span>{t('tabs.domains')}
            </button>
          </li>
          <li className="flex-1">
            <button
              onClick={() => setActiveTab('duplicates')}
              className={`inline-block p-4 w-full rounded-t-lg text-base font-medium transition-all ${
                activeTab === 'duplicates'
                  ? 'bg-red-50 text-red-700 border-b-2 border-red-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="inline-block mr-2">🔄</span>{t('tabs.duplicates')} 
              {duplicateCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                  {duplicateCount}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>
      
      <div className="mt-4">
        {activeTab === 'overview' && insights && (
          <div>
            {insights.yearDistribution.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-blue-700">{t('yearDistributionTitle')}</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-4">
                  {insights.yearDistribution.map(([year, count], index: number) => {
                    const maxCount = Math.max(...insights.yearDistribution.map(item => Number(item[1])));
                    const intensity = Math.max(0.3, Number(count) / maxCount);
                    
                    return (
                      <div key={index} className="bg-blue-50 rounded-lg border border-blue-100 p-3 text-center">
                        <div className="text-lg font-bold text-blue-800">{year} {t('year')}</div>
                        <div className="mt-1 text-sm text-gray-600">{t('bookmarksQuantity')}</div>
                        <div className="mt-1 font-bold text-xl text-blue-600">{count}</div>
                        <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.max(Number(count) / maxCount * 100, 5)}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {fullestCategory && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">{t('topCategoryWithCount', { category: fullestCategory.category })}</h3>
                <p className="text-sm text-gray-600 mb-2">{t('containsBookmarks', { count: fullestCategory.count })}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                  {fullestCategory.bookmarks.slice(0, 9).map((bookmark: Bookmark, index: number) => (
                    <a 
                      key={index}
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
                    >
                      <BookmarkIcon />
                      <span className="text-blue-600 truncate">{bookmark.title}</span>
                    </a>
                  ))}
                </div>
                
                {fullestCategory.count > 9 && (
                  <p className="text-center text-gray-500 mt-2 text-sm">
                    {t('moreBookmarksNotShown', { count: fullestCategory.count - 9 })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'categories' && insights && (
          <div>
            <h3 className="text-lg font-medium mb-3">{t('categoryDistributionTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {insights.topCategories.map(([category, count], index: number) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{category}</span>
                    <span className="text-blue-600 font-bold">{count}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${(Number(count)) / bookmarksCount * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-gray-500 mt-4 text-sm">
              {Object.keys(insights.categories).length > insights.topCategories.length && (
                t('showingTopResults', { shown: insights.topCategories.length, total: Object.keys(insights.categories).length })
              )}
            </p>
          </div>
        )}
        
        {activeTab === 'domains' && insights && (
          <div>
            <h3 className="text-lg font-medium mb-3">{t('frequentWebsitesTitle')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {insights.topDomains.map(([domain, count], index: number) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-shrink-0 mr-3">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/globe.svg';
                      }} 
                      alt="" 
                      className="w-6 h-6" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900 truncate">{domain}</p>
                      <p className="text-sm text-blue-600 font-bold">{count}</p>
                    </div>
                    <div className="mt-1 w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full" 
                        style={{ 
                          width: `${(Number(count)) / 
                            Object.values(insights.domains).reduce((a: number, b: number) => a + b, 0) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-gray-500 mt-4 text-sm">
              {Object.keys(insights.domains).length > insights.topDomains.length && (
                t('showingTopResults', { shown: insights.topDomains.length, total: Object.keys(insights.domains).length })
              )}
            </p>
          </div>
        )}
        
        {activeTab === 'duplicates' && (
          <div>
            <h3 className="text-lg font-medium mb-3">{t('duplicateBookmarksTitle')}</h3>
            
            {duplicateCount === 0 ? (
              <div className="text-center py-6 text-gray-500">
                {t('noDuplicatesFound')}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(duplicates).slice(0, 10).map(([url, bookmarkList], index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <BookmarkIcon />
                      <a 
                        href={url.startsWith('http') ? url : `https://${url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {url}
                      </a>
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                        {t('duplicateCount', { count: bookmarkList.length })}
                      </span>
                    </div>
                    
                    <div className="pl-4 border-l-2 border-gray-200 space-y-1">
                      {bookmarkList.map((bookmark: Bookmark, i: number) => (
                        <div key={i} className="text-sm text-gray-700">
                          <span className="font-medium">{bookmark.title}</span>
                          {bookmark.category && (
                            <span className="text-gray-500 ml-2">({bookmark.category})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {Object.keys(duplicates).length > 10 && (
                  <p className="text-center text-gray-500 mt-2 text-sm">
                    {t('moreNotShown', { count: Object.keys(duplicates).length - 10 })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 