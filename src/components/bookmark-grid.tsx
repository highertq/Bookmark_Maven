'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getAllBookmarks, getAllCategories } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';

export default function BookmarkGrid() {
  const [bookmarks, setBookmarks] = useState<Tables['bookmarks']['Row'][]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 获取所有分类
        const categoriesData = await getAllCategories();
        setCategories(categoriesData);

        // 获取书签
        const { data, error } = await getAllBookmarks();
        if (error) {
          console.error('获取书签失败:', error);
          return;
        }

        setBookmarks(data || []);
      } catch (error) {
        console.error('加载数据出错:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // 过滤书签
  const filteredBookmarks = bookmarks.filter(bookmark => {
    // 按分类过滤
    const categoryMatch = selectedCategory ? bookmark.category === selectedCategory : true;
    
    // 按搜索词过滤
    const searchMatch = searchTerm
      ? bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return categoryMatch && searchMatch;
  });

  // 获取网站图标
  const getFavicon = (url: string) => {
    try {
      const urlObj = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
    } catch {
      return '/globe.svg';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        {/* 搜索框 */}
        <div className="relative w-full md:w-1/3">
          <input
            type="text"
            placeholder="搜索书签..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>

        {/* 分类选择器 */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 rounded-full text-sm ${!selectedCategory ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            onClick={() => setSelectedCategory(null)}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`px-3 py-1 rounded-full text-sm ${selectedCategory === category ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {filteredBookmarks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm || selectedCategory ? '没有找到匹配的书签' : '还没有添加任何书签，请上传书签文件'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBookmarks.map((bookmark) => (
            <a
              key={bookmark.id}
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start space-x-3">
                {/* <img
                  src={bookmark.icon || getFavicon(bookmark.url)}
                  alt=""
                  className="w-6 h-6 mt-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/globe.svg';
                  }}
                /> */}
              <Image
                src={bookmark.icon || getFavicon(bookmark.url)}
                alt="" // 建议填写有意义的 alt 文本（SEO 要求）
                width={24}  // 必须指定（单位：px，与 className 中的 w-6 对应 6*4=24）
                height={24} // 必须指定（与 className 中的 h-6 对应）
                className="mt-1" // 移除了 w-6 h-6，因为 width/height 已指定
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/globe.svg';
                }}
              />
                <div>
                  <h3 className="font-medium text-gray-900 line-clamp-2">{bookmark.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{bookmark.url}</p>
                  {bookmark.category && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {bookmark.category}
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}