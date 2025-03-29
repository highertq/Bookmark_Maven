'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseBookmarks, extractAllBookmarks } from '@/lib/bookmark-parser';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import ExportHelpDialog from './export-help-dialog';
import BookmarkAnalytics from './bookmark-analytics';
import BookmarkComment from './bookmark-comment';

interface UploadBookmarkProps {
  onBookmarksProcessed?: (bookmarks: any[]) => void;
}

export default function UploadBookmark({ onBookmarksProcessed }: UploadBookmarkProps) {
  const [message, setMessage] = useState<string>('拖拽HTML书签文件到这里，或点击选择文件');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showHelpDialog, setShowHelpDialog] = useState<boolean>(false);
  const [parsedBookmarks, setParsedBookmarks] = useState<any[]>([]);
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);

  const processBookmarkFile = useCallback(async (content: string) => {
    setIsLoading(true);
    setMessage('正在解析书签...');
    
    try {
      // 解析书签树，然后提取所有书签项
      const bookmarkTree = parseBookmarks(content);
      const bookmarks = extractAllBookmarks(bookmarkTree);
      
      if (bookmarks.length === 0) {
        setMessage('未找到有效的书签数据，请确认文件格式正确');
        return;
      }
      
      setMessage(`成功解析 ${bookmarks.length} 个书签！`);
      // 存储解析的书签
      setParsedBookmarks(bookmarks);
      
      // 显示分析组件
      setShowAnalytics(true);
      
      // 安全地调用回调函数，检查它是否存在
      if (typeof onBookmarksProcessed === 'function') {
        onBookmarksProcessed(bookmarks);
      }
    } catch (error) {
      console.error('解析书签失败:', error);
      setMessage(`解析书签失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  }, [onBookmarksProcessed]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      setMessage('请选择一个有效的HTML文件');
      return;
    }

    const file = acceptedFiles[0];
    
    // 检查文件类型
    if (!file.name.endsWith('.html') && !file.type.includes('html')) {
      setMessage('请选择一个HTML格式的书签文件');
      return;
    }

    setMessage(`正在读取文件: ${file.name}...`);
    setIsLoading(true);

    try {
      const content = await file.text();
      await processBookmarkFile(content);
    } catch (error) {
      console.error('读取文件失败:', error);
      setMessage(`读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
      setIsLoading(false);
    }
  }, [processBookmarkFile]);

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
          <h2 className="text-xl font-semibold">上传书签文件</h2>
          <button
            onClick={() => setShowHelpDialog(true)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
            title="查看如何导出书签"
          >
            <QuestionMarkCircleIcon className="h-5 w-5 mr-1" />
            <span>如何导出书签?</span>
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
                支持从Chrome、Firefox、Edge等浏览器导出的书签HTML文件
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