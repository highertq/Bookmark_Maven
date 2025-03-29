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

      // 根据您的建议，先获取响应文本
      const responseText = await response.text();
      console.log('API原始响应:', responseText);

      // 尝试解析为JSON
      let data;
      try {
        // 尝试直接解析响应文本
        data = JSON.parse(responseText);
        console.log('成功解析JSON响应:', data);
        
        // 如果返回的是有效的JSON对象且包含comment字段
        if (data && data.comment) {
          setComment(data.comment);
        } 
        // 如果返回的是纯文本或普通字符串
        else if (typeof data === 'string') {
          setComment(data);
        }
        // 如果JSON中没有直接的comment字段，检查是否是API标准响应格式
        else if (data.choices && data.choices.length > 0 && data.choices[0].message?.content) {
          setComment(data.choices[0].message.content);
        }
        // 否则将整个JSON作为文本展示
        else {
          setComment(JSON.stringify(data));
        }
      } catch (parseError) {
        console.error('JSON解析失败，作为纯文本处理:', parseError);
        // 如果解析失败，直接使用响应文本
        if (responseText && responseText.trim()) {
          setComment(responseText.trim());
        } else {
          throw new Error('服务器返回了空的响应');
        }
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