'use client';

import { useState, useEffect, useRef } from 'react';
import { Bookmark, findEarliestBookmark } from '@/lib/bookmark-parser';

interface BookmarkCommentProps {
  bookmarks: Bookmark[];
}

export default function BookmarkComment({ bookmarks }: BookmarkCommentProps) {
  const [comment, setComment] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [earliestBookmark, setEarliestBookmark] = useState<{ bookmark: Bookmark | null, daysAgo: number | null }>({ bookmark: null, daysAgo: null });
  const [progress, setProgress] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>('准备生成评论...');
  
  const commentCache = useRef(new Map());

  // 预设一些有趣的评论模板
  const fallbackComments = [
    "看了你的书签列表，我怀疑你是靠随机点击收集网址的。这些杂乱无章的网站散发着「半途而废爱好者」的气息。",
    "你的书签就像一个被遗弃的数字垃圾场，充满了无人问津的链接和被时间遗忘的网站。这是数字囤积症的典型表现。",
    "这些书签真是令人眼前一亮——如果「亮」指的是'惊讶于有人会收藏这么无聊的网站'的话。",
    "你的书签收藏仿佛是互联网的随机采样，没有任何品味可言。建议整理一下，或者干脆全部删除重来。",
    "从这些书签来看，你的网络生活比纪录片《无聊至死》还要平淡无奇。试着走出舒适区，访问一些有挑战性的网站吧。"
  ];

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
    setProgress(0);
    setLoadingMessage('准备生成评论...');
    
    // 生成缓存键（使用书签标题的组合）
    const cacheKey = JSON.stringify(bookmarks.map(b => b.title).sort());
    
    // 检查缓存中是否已有结果
    if (commentCache.current.has(cacheKey)) {
      console.log('使用缓存的评论结果');
      setComment(commentCache.current.get(cacheKey));
      return;
    }
    
    // 使用间隔更新进度和消息，提供更好的用户体验
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // 慢慢增加到90%，剩下10%留给实际完成
        const newProgress = prev + (5 * Math.random());
        return Math.min(newProgress, 90);
      });
      
      // 随机更换加载消息
      const messages = [
        '分析你的书签中...',
        '思考刻薄的评论...',
        '组织语言，准备开喷...',
        '正在酝酿犀利观点...',
        '正在构思毒舌评论...',
        '这需要一点时间，但会很精彩...',
        '正在挖掘深藏的嘲讽...'
      ];
      
      setLoadingMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 2000);
    
    try {
      // 使用AbortController实现客户端超时控制
      const controller = new AbortController();
      const timeoutController = setTimeout(() => controller.abort(), 20000);
      
      const response = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookmarks }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutController);
      
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

      // 缓存结果
      if (comment) {
        commentCache.current.set(cacheKey, comment);
      }
    } catch (err) {
      console.error('获取评论失败:', err);
      
      // 如果是超时错误，使用预设评论
      if (err instanceof Error && (
        err.message.includes('超时') || 
        err.name === 'AbortError' || 
        err.message.includes('timeout')
      )) {
        const fallbackComment = fallbackComments[Math.floor(Math.random() * fallbackComments.length)];
        setComment(`[API超时，使用备用评论] ${fallbackComment}`);
        setError('API请求超时，已使用备用评论。你也可以稍后再试。');
      } else {
        setError(err instanceof Error ? err.message : '生成评论失败，请稍后再试');
      }
    } finally {
      clearInterval(progressInterval);
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

      {isLoading && (
        <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <div className="mb-2">{loadingMessage}</div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}