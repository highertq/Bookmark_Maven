'use client';

import { useState } from 'react';
import { Bookmark, analyzeBookmarks, findFullestCategory, findDuplicateBookmarks } from '@/lib/bookmark-parser';

interface BookmarkAnalyticsProps {
  bookmarks: Bookmark[];
}

export default function BookmarkAnalytics({ bookmarks }: BookmarkAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'domains' | 'duplicates'>('overview');
  
  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
        上传书签后可查看分析结果
      </div>
    );
  }
  
  const insights = analyzeBookmarks(bookmarks);
  const fullestCategory = findFullestCategory(bookmarks);
  const duplicates = findDuplicateBookmarks(bookmarks);
  const duplicateCount = Object.keys(duplicates).length;
  
  // 获取网站图标
  const getFavicon = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
      return '/globe.svg'; // 默认图标
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-semibold mb-4">书签数据分析</h2>
      
      {/* 统计概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-blue-600">{bookmarks.length}</div>
          <div className="text-sm text-gray-600">总书签数</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-green-600">{Object.keys(insights.categories).length}</div>
          <div className="text-sm text-gray-600">分类数</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-purple-600">{Object.keys(insights.domains).length}</div>
          <div className="text-sm text-gray-600">域名数</div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-3xl font-bold text-red-600">{duplicateCount}</div>
          <div className="text-sm text-gray-600">重复书签</div>
        </div>
      </div>
      
      {/* 选项卡切换 */}
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
              <span className="inline-block mr-2">📊</span>总览
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
              <span className="inline-block mr-2">📁</span>分类
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
              <span className="inline-block mr-2">🌐</span>域名
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
              <span className="inline-block mr-2">🔄</span>重复项 
              {duplicateCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                  {duplicateCount}
                </span>
              )}
            </button>
          </li>
        </ul>
      </div>
      
      {/* 内容区域 */}
      <div className="mt-4">
        {/* 总览 */}
        {activeTab === 'overview' && (
          <div>
           {/* 年份分布图表 */}
{insights.yearDistribution.length > 0 && (
  <div className="mb-6">
    <h3 className="text-lg font-medium mb-3 text-blue-700">书签收藏年份分布</h3>
    
    {/* 替换原有的柱状图为卡片网格 */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-4">
      {insights.yearDistribution.map(([year, count], index) => {
        // 计算颜色深度 - 数量越多颜色越深
        const maxCount = Math.max(...insights.yearDistribution.map(item => Number(item[1])));
        const intensity = Math.max(0.3, Number(count) / maxCount);
        
        return (
          <div key={index} className="bg-blue-50 rounded-lg border border-blue-100 p-3 text-center">
            <div className="text-lg font-bold text-blue-800">{year}</div>
            <div className="mt-1 text-sm text-gray-600">书签数量</div>
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
            
            {/* 最丰富的分类 */}
            {fullestCategory && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">最多内容的分类: <span className="text-blue-600">{fullestCategory.category}</span></h3>
                <p className="text-sm text-gray-600 mb-2">包含 {fullestCategory.count} 个书签</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                  {fullestCategory.bookmarks.slice(0, 9).map((bookmark, index) => (
                    <a 
                      key={index}
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
                    >
                      <img 
                        src={getFavicon(bookmark.url)} 
                        alt="" 
                        className="w-5 h-5 mr-2" 
                      />
                      <span className="text-blue-600 truncate">{bookmark.title}</span>
                    </a>
                  ))}
                </div>
                
                {fullestCategory.count > 9 && (
                  <p className="text-center text-gray-500 mt-2 text-sm">
                    还有 {fullestCategory.count - 9} 个书签未显示
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* 分类视图 */}
        {activeTab === 'categories' && (
          <div>
            <h3 className="text-lg font-medium mb-3">分类分布</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {insights.topCategories.map(([category, count], index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{category}</span>
                    <span className="text-blue-600 font-bold">{count}</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full" 
                      style={{ width: `${(count as number) / bookmarks.length * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-gray-500 mt-4 text-sm">
              {Object.keys(insights.categories).length > insights.topCategories.length && (
                `显示前 ${insights.topCategories.length} 个，共 ${Object.keys(insights.categories).length} 个分类`
              )}
            </p>
          </div>
        )}
        
        {/* 域名视图 */}
        {activeTab === 'domains' && (
          <div>
            <h3 className="text-lg font-medium mb-3">常用网站</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {insights.topDomains.map(([domain, count], index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-shrink-0 mr-3">
                    <img 
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
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
                        style={{ width: `${(count as number) / Object.values(insights.domains).reduce((a, b) => a + b, 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-center text-gray-500 mt-4 text-sm">
              {Object.keys(insights.domains).length > insights.topDomains.length && (
                `显示前 ${insights.topDomains.length} 个，共 ${Object.keys(insights.domains).length} 个域名`
              )}
            </p>
          </div>
        )}
        
        {/* 重复书签视图 */}
        {activeTab === 'duplicates' && (
          <div>
            <h3 className="text-lg font-medium mb-3">重复书签</h3>
            
            {duplicateCount === 0 ? (
              <div className="text-center py-6 text-gray-500">
                没有找到重复的书签，干得好！
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(duplicates).slice(0, 10).map(([url, bookmarkList], index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <img 
                        src={getFavicon(`https://${url}`)} 
                        alt="" 
                        className="w-5 h-5 mr-2" 
                      />
                      <a 
                        href={`https://${url}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {url}
                      </a>
                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                        {bookmarkList.length}个副本
                      </span>
                    </div>
                    
                    <div className="pl-4 border-l-2 border-gray-200 space-y-1">
                      {bookmarkList.map((bookmark, i) => (
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
                    还有 {Object.keys(duplicates).length - 10} 组重复书签未显示
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