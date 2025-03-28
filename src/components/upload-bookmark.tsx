'use client';

import { useState, useRef } from 'react';
import { parseBookmarks, extractAllBookmarks } from '@/lib/bookmark-parser';
import BookmarkComment from './bookmark-comment';

export default function UploadBookmark() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedBookmarks, setParsedBookmarks] = useState<ReturnType<typeof extractAllBookmarks>>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

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
      
      // 解析书签
      const bookmarkTree = parseBookmarks(content);
      const bookmarks = extractAllBookmarks(bookmarkTree);
      
      if (bookmarks.length === 0) {
        setMessage({ text: '未找到任何书签', type: 'error' });
        setIsUploading(false);
        return;
      }

      // 设置解析后的书签
      setParsedBookmarks(bookmarks);
      setMessage({ 
        text: `成功解析 ${bookmarks.length} 个书签，可以生成热辣点评了！`, 
        type: 'success' 
      });
    } catch (error) {
      console.error('处理书签文件出错:', error);
      setMessage({ text: '处理书签文件时出错', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".html" 
          onChange={handleFileChange} 
          disabled={isUploading}
        />
        <div className="flex flex-col items-center justify-center space-y-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-lg font-medium text-gray-700">
            {isUploading ? '正在处理...' : '拖拽HTML书签文件到这里或点击上传'}
          </p>
          <p className="text-sm text-gray-500">
            支持浏览器导出的书签HTML文件
          </p>
        </div>
      </div>

      {message && (
        <div className={`mt-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
          {message.text}
        </div>
      )}

      {parsedBookmarks.length > 0 && (
        <BookmarkComment bookmarks={parsedBookmarks} />
      )}
    </div>
  );
}