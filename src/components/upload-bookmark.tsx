'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseBookmarks, extractAllBookmarks } from '@/lib/bookmark-parser';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import ExportHelpDialog from './export-help-dialog';
import BookmarkAnalytics from './bookmark-analytics';
import BookmarkComment from './bookmark-comment';
import { useTranslations } from 'next-intl';

interface UploadBookmarkProps {
  onBookmarksProcessed?: (bookmarks: any[]) => void;
}

interface Bookmark {
  title: string;
  url: string;
  category?: string;
  date?: string; // 添加日期字段
  add_date?: string; // HTML书签中可能有add_date属性
}

export default function UploadBookmark({ onBookmarksProcessed }: UploadBookmarkProps) {
  const t = useTranslations('upload');
  const [message, setMessage] = useState<string>(t('dragText'));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showHelpDialog, setShowHelpDialog] = useState<boolean>(false);
  const [parsedBookmarks, setParsedBookmarks] = useState<any[]>([]);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

  const processBookmarkFile = useCallback(async (content: string) => {
    setIsLoading(true);
    setMessage(t('processing'));
    
    try {
      // 解析书签树，然后提取所有书签项
      const bookmarkTree = parseBookmarks(content);
      const bookmarks = extractAllBookmarks(bookmarkTree);
      
      if (bookmarks.length === 0) {
        setMessage(t('invalidFile'));
        return;
      }
      
      // 处理书签日期信息
      const bookmarksWithDates = bookmarks.map((bookmark: Bookmark) => {
        // 如果书签有add_date属性（Unix时间戳格式），将其转换为ISO格式
        if (bookmark.add_date && !bookmark.date) {
          // 书签文件中的add_date通常是秒级Unix时间戳
          const timestamp = parseInt(bookmark.add_date);
          if (!isNaN(timestamp)) {
            // 转换为毫秒级时间戳并转为ISO格式
            bookmark.date = new Date(timestamp * 1000).toISOString();
          }
        }
        
        // 如果仍然没有日期信息，添加随机日期
        if (!bookmark.date) {
          bookmark.date = generateRandomPastDate(730); // 过去两年内
        }
        
        return bookmark;
      });
      
      // 不再随机选取，使用全部书签
      setMessage(t('success', { count: bookmarksWithDates.length }));
      
      // 存储解析的书签（使用全部书签而不是随机选择）
      setParsedBookmarks(bookmarksWithDates);
      
      // 显示分析组件
      setShowAnalytics(true);
      
      // 安全地调用回调函数，检查它是否存在
      if (typeof onBookmarksProcessed === 'function') {
        onBookmarksProcessed(bookmarksWithDates);
      }
    } catch (error) {
      console.error('解析书签失败:', error);
      setMessage(t('error', { error: error instanceof Error ? error.message : 'Unknown error' }));
    } finally {
      setIsLoading(false);
    }
  }, [onBookmarksProcessed, t]);

  // 生成过去n天内的随机日期
  function generateRandomPastDate(daysBack: number): string {
    const today = new Date();
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - Math.floor(Math.random() * daysBack));
    return pastDate.toISOString();
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      setMessage(t('invalidFile'));
      return;
    }

    const file = acceptedFiles[0];
    
    // 检查文件类型
    if (!file.name.endsWith('.html') && !file.type.includes('html')) {
      setMessage(t('invalidFile'));
      return;
    }

    setMessage(t('reading', { filename: file.name }));
    setIsLoading(true);

    try {
      const content = await file.text();
      await processBookmarkFile(content);
    } catch (error) {
      console.error('读取文件失败:', error);
      setMessage(t('error', { error: error instanceof Error ? error.message : 'Unknown error' }));
      setIsLoading(false);
    }
  }, [processBookmarkFile, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/html': ['.html', '.htm'],
    },
    maxFiles: 1,
    disabled: isLoading
  });

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <button
            onClick={() => setShowHelpDialog(true)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
            title={t('helpButton')}
          >
            <QuestionMarkCircleIcon className="h-5 w-5 mr-1" />
            <span>{t('helpButton')}</span>
          </button>
        </div>

        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center">
            <svg 
              className={`w-16 h-16 mb-4 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            
            <p className={`text-lg ${isLoading ? 'text-blue-600 font-medium' : ''}`}>
              {message}
            </p>
            
            {isLoading ? (
              <div className="mt-4 w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                {t('supportedFormats')}
              </p>
            )}
          </div>
        </div>

        {/* 导出帮助弹窗 */}
        <ExportHelpDialog
          isOpen={showHelpDialog}
          onClose={() => setShowHelpDialog(false)}
        />
      </div>
      
      {/* 当成功解析书签后显示分析和评论组件 */}
      {showAnalytics && parsedBookmarks.length > 0 && (
        <>
          {/* 书签分析组件 */}
          <div className="mb-6">
            <BookmarkAnalytics bookmarks={parsedBookmarks} />
          </div>
          
          {/* 书签评论组件 */}
          <div>
            <BookmarkComment bookmarks={parsedBookmarks} />
          </div>
        </>
      )}
    </div>
  );
}