'use client';

import { useState, useEffect } from 'react';
import { Bookmark, findEarliestBookmark } from '@/lib/bookmark-parser';

interface BookmarkCommentProps {
  bookmarks: Bookmark[];
}

export default function BookmarkComment({ bookmarks }: BookmarkCommentProps) {
  const [comment, setComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [earliestBookmark, setEarliestBookmark] = useState<{ bookmark: Bookmark | null, daysAgo: number | null }>({ bookmark: null, daysAgo: null });
  
  useEffect(() => {
    if (bookmarks.length > 0) {
      const earliest = findEarliestBookmark(bookmarks);
      setEarliestBookmark(earliest);
    }
  }, [bookmarks]);

  const generateComment = async () => {
    if (bookmarks.length === 0) {
      setError('没有书签可以评论');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookmarks }),
      });

      const responseText = await response.text();
      console.log('API原始响应:', responseText);

      // 检查是否包含错误关键词
      if (responseText.includes('FUNCTION_INVOCATION_TIMEOUT') || 
          responseText.includes('An error occurred with your deployment')) {
        throw new Error('服务器处理超时，请稍后再试');
      }

      // 尝试解析为JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON解析失败，作为纯文本处理:', parseError);
        // 纯文本处理
        setComment(responseText.trim());
        setIsLoading(false);
        return;
      }

      // JSON处理
      if (data.error) {
        throw new Error(data.error);
      } else if (data.comment) {
        setComment(data.comment);
      } else {
        setComment(JSON.stringify(data));
      }
    } catch (err) {
      console.error('获取评论失败:', err);
      setError(err instanceof Error ? err.message : '生成评论失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">热辣点评</h2>
        <button
          onClick={generateComment}
          disabled={isLoading || bookmarks.length === 0}
          className={`px-4 py-2 rounded-md text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
        >
          {isLoading ? '生成中...' : '生成点评'}
        </button>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}

      {earliestBookmark.bookmark && (
        <div className="p-4 mb-4 bg-blue-50 text-blue-800 rounded-md border border-blue-100">
          <div className="flex items-start mb-2">
            <span className="text-2xl mr-2">📅</span>
            <h3 className="text-lg font-medium text-blue-700">最早收藏的书签</h3>
          </div>
          <p className="text-gray-700 mb-1"><span className="font-medium">标题:</span> {earliestBookmark.bookmark.title}</p>
          <p className="text-gray-700 mb-1"><span className="font-medium">收藏日期:</span> {earliestBookmark.bookmark.addDateFormatted}</p>
          <p className="text-gray-700"><span className="font-medium">距今时间:</span> {earliestBookmark.daysAgo} 天</p>
        </div>
      )}

      {comment ? (
        <div className="p-5 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-orange-100">
          <div className="flex items-start mb-3">
            <span className="text-2xl mr-2">🔥</span>
            <h3 className="text-lg font-medium text-red-600">AI热辣点评</h3>
          </div>
          <p className="text-gray-700 whitespace-pre-line">{comment}</p>
        </div>
      ) : (
        <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
          {bookmarks.length > 0 
            ? '点击"生成点评"按钮，获取AI对你上网习惯的热辣点评'
            : '请先上传书签，然后再生成点评'}
        </div>
      )}
    </div>
  );
}