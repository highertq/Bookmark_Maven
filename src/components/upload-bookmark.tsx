'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { parseBookmarks, extractAllBookmarks, Bookmark } from '@/lib/bookmark-parser';
import BookmarkComment from './bookmark-comment';
import BookmarkAnalytics from './bookmark-analytics';

interface MessageState {
  text: string;
  type: 'info' | 'success' | 'error';
}

export default function UploadBookmark() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [parsedBookmarks, setParsedBookmarks] = useState<Bookmark[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理书签内容
  const processBookmarkContent = (content: string) => {
    try {
      // 解析书签
      const bookmarkTree = parseBookmarks(content);
      const bookmarks = extractAllBookmarks(bookmarkTree);
      
      if (bookmarks.length === 0) {
        setMessage({ text: '未找到任何书签', type: 'error' });
        return;
      }

      // 设置解析后的书签
      setParsedBookmarks(bookmarks);
      setMessage({ 
        text: `成功解析 ${bookmarks.length} 个书签，可以生成热辣点评了！`, 
        type: 'success' 
      });
      
      // 自动显示分析
      setShowAnalytics(true);
    } catch (error) {
      console.error('处理书签内容出错:', error);
      setMessage({ text: '处理书签内容时出错', type: 'error' });
    }
  };
  
  // 处理文件上传
  const processFile = async (file: File) => {
    // 检查文件类型
    if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
      setMessage({ text: '请上传HTML格式的书签文件', type: 'error' });
      return;
    }

    setIsUploading(true);
    setMessage({ text: '正在处理书签文件...', type: 'info' });

    try {
      // 读取文件内容
      const content = await file.text();
      processBookmarkContent(content);
    } catch (error) {
      console.error('处理书签文件出错:', error);
      setMessage({ text: '处理书签文件时出错', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // 处理拖放
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // 处理文件选择
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // 触发文件选择对话框
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } transition-colors duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".html"
          className="hidden"
        />
        <div className="mx-auto w-16 h-16 mb-4 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-lg text-gray-700 mb-2">
          {isDragging ? '放开以上传书签' : '拖放书签HTML文件至此或点击上传'}
        </p>
        <p className="text-sm text-gray-500">
          支持浏览器导出的书签HTML文件
        </p>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded-md ${
          message.type === 'info' ? 'bg-blue-50 text-blue-700' :
          message.type === 'success' ? 'bg-green-50 text-green-700' :
          'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {parsedBookmarks.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex justify-between items-center">
            <h3 className="text-lg font-semibold">成功解析 {parsedBookmarks.length} 个书签</h3>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-blue-600 text-sm underline"
            >
              {showAnalytics ? '隐藏分析' : '显示详细分析'}
            </button>
          </div>
          
          {showAnalytics && (
            <div className="mb-6">
              <BookmarkAnalytics bookmarks={parsedBookmarks} />
            </div>
          )}
          
          <BookmarkComment bookmarks={parsedBookmarks} />
        </div>
      )}
    </div>
  );
}