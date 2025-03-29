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
  const [showCardModal, setShowCardModal] = useState<boolean>(false);
  const [nickname, setNickname] = useState<string>('');
  
  const commentCache = useRef(new Map());
  const cardRef = useRef<HTMLDivElement>(null);

  // 替换 getFavicon 函数为使用统一图标组件
  const BookmarkIcon = () => (
    <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
    </svg>
  );

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

  // 从评论中提取外号
  useEffect(() => {
    if (comment) {
      // 使用正则表达式匹配【】中的内容，通常出现在评论末尾
      const match = comment.match(/你真的是个【(.+?)】/);
      if (match && match[1]) {
        setNickname(match[1]);
      } else {
        // 如果没有匹配到标准格式，尝试查找最后一个【】
        const lastBracketMatch = comment.match(/【([^】]+)】(?![^【]*】)/);
        if (lastBracketMatch && lastBracketMatch[1]) {
          setNickname(lastBracketMatch[1]);
        } else {
          setNickname('网络达人'); // 默认外号
        }
      }
    }
  }, [comment]);

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
      setIsLoading(false);
      return;
    }
    
    // 使用间隔更新进度和消息，提供更好的用户体验
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // 慢慢增加到90%，剩下10%留给实际完成
        const newProgress = prev + (35 * Math.random());
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
      const controller = new AbortController();
      // 增加超时时间到3分钟
      const timeoutController = setTimeout(() => controller.abort(), 180000);
      
      const response = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookmarks }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutController);
      
      // 检查内容类型
      const contentType = response.headers.get('content-type');
      const responseText = await response.text();
      console.log('API原始响应:', responseText);
      
      // 检查是否包含错误关键词
      if (responseText.includes('FUNCTION_INVOCATION_TIMEOUT') || 
          responseText.includes('An error occurred with your deployment')) {
        throw new Error('服务器处理超时，请稍后再试');
      }
      
      // 过滤<think>标签及其内容
      let processedText = responseText;
      
      // 使用正则表达式删除所有<think>标签及其内容
      processedText = processedText.replace(/<think>[\s\S]*?<\/think>/g, '');
      
      // 清理任何多余的空行，确保格式美观
      processedText = processedText.replace(/\n{3,}/g, '\n\n');
      processedText = processedText.trim();
      
      // 根据内容类型决定如何处理
      if (contentType && contentType.includes('application/json')) {
        // 如果是JSON格式，则尝试解析
        try {
          const data = JSON.parse(processedText);
          if (data.error) {
            throw new Error(data.error);
          } else if (data.comment) {
            setComment(data.comment);
          } else {
            setComment(JSON.stringify(data));
          }
        } catch (parseError) {
          // JSON解析失败，直接使用过滤后的文本内容
          console.warn('JSON解析失败，使用过滤后的纯文本:', parseError);
          setComment(processedText);
        }
      } else {
        // 如果不是JSON格式，直接使用过滤后的文本
        setComment(processedText);
      }
      
      // 缓存结果
      if (processedText) {
        commentCache.current.set(cacheKey, processedText);
      }

      // API返回后立即完成进度
      setProgress(100);
      clearInterval(progressInterval);
      
      // 添加这一行，设置加载状态为false
      setIsLoading(false);
    } catch (err) {
      console.error('获取评论失败:', err);
      
      // 隐藏技术性错误，显示友好的错误消息
      if (err instanceof Error && err.message.includes('JSON')) {
        // 如果是JSON解析错误，不要显示在用户界面上
        console.warn('JSON解析错误，已忽略:', err.message);
      } else {
        // 其他错误正常显示
        setError(err instanceof Error ? err.message : '热辣评论失败，请稍后再试');
      }
      
      // 确保在错误情况下也清除加载状态
      setIsLoading(false);
      clearInterval(progressInterval);
    }
  };

  // 生成并下载卡片图片
  const generateCard = () => {
    setShowCardModal(true);
  };

  // 保存卡片为图片
  const saveCard = () => {
    if (!cardRef.current) return;
    
    try {
      // 显示加载状态
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]';
      loadingDiv.innerHTML = '<div class="bg-white p-4 rounded-lg shadow-lg text-center"><div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div><p>正在生成图片...</p></div>';
      document.body.appendChild(loadingDiv);
      
      // 确保完整捕获整个卡片
      setTimeout(() => {
        import('html-to-image')
          .then(async (htmlToImage) => {
            // 准备克隆节点以确保捕获完整内容
            const originalNode = cardRef.current!;
            
            // 暂存原始样式
            const originalStyle = {
              width: originalNode.style.width,
              height: originalNode.style.height,
              position: originalNode.style.position,
              overflow: originalNode.style.overflow,
              background: originalNode.style.background,
            };
            
            // 设置捕获时的样式
            originalNode.style.width = '375px';
            originalNode.style.background = '#ffffff';
            originalNode.style.overflow = 'visible';
            
            try {
              // 使用toPng方法，最稳定且广泛支持
              const dataUrl = await htmlToImage.toPng(originalNode, {
                quality: 1.0,
                pixelRatio: 2.5, // 提高分辨率
                cacheBust: true,
                backgroundColor: '#ffffff',
                style: {
                  // 确保所有内容可见
                  overflow: 'visible',
                  borderRadius: '12px',
                },
              });
              
              // 恢复原始样式
              Object.assign(originalNode.style, originalStyle);
              
              // 下载图片
              const link = document.createElement('a');
              link.download = `${nickname}的书签点评.png`;
              link.href = dataUrl;
              link.click();
              
              // 移除加载状态
              document.body.removeChild(loadingDiv);
              
              // 短暂延迟后关闭弹窗
              setTimeout(() => setShowCardModal(false), 500);
            } catch (error) {
              console.error('第一种方法失败:', error);
              // 尝试备用方法
              backupCapture(originalNode, originalStyle, loadingDiv);
            }
          })
          .catch((error) => {
            console.error('导入模块失败:', error);
            document.body.removeChild(loadingDiv);
            alert('图片生成失败，请尝试截屏保存');
          });
      }, 300); // 给DOM充分时间渲染
    } catch (error) {
      console.error('保存卡片出错:', error);
      alert('生成图片失败，请尝试截屏保存');
    }
  };

  // 备用捕获方法
  const backupCapture = async (node: HTMLElement, originalStyle: any, loadingDiv: HTMLElement) => {
    try {
      // 导入库
      const { toBlob } = await import('html-to-image');
      
      // 创建临时画布
      const canvas = document.createElement('canvas');
      canvas.width = 375 * 2;
      canvas.height = node.scrollHeight * 2;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('无法创建画布上下文');
      
      // 填充白色背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 获取Blob
      const blob = await toBlob(node);
      if (!blob) throw new Error('无法生成图像Blob');
      
      // 创建图片元素
      const img = new Image();
      img.onload = () => {
        // 绘制到画布
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 转换为数据URL
        const dataUrl = canvas.toDataURL('image/png');
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `${nickname}的书签点评.png`;
        link.href = dataUrl;
        link.click();
        
        // 恢复原始样式
        Object.assign(node.style, originalStyle);
        
        // 移除加载状态
        document.body.removeChild(loadingDiv);
        
        // 关闭弹窗
        setTimeout(() => setShowCardModal(false), 500);
      };
      
      // 加载Blob为图片
      img.src = URL.createObjectURL(blob);
    } catch (error) {
      console.error('备用方法失败:', error);
      
      // 恢复原始样式
      Object.assign(node.style, originalStyle);
      
      // 移除加载状态
      document.body.removeChild(loadingDiv);
      
      // 提示用户使用截屏
      alert('无法生成图片，请使用截屏功能（在浏览器中按Ctrl+Shift+S或使用系统截图工具）');
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">热辣点评</h2>
        <button
          onClick={generateComment}
          disabled={isLoading || bookmarks.length === 0}
          className={`px-6 py-2.5 rounded-md text-white text-base font-medium shadow-md ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 transform hover:scale-105 transition-all'
          }`}
        >
          {isLoading ? '点评中...' : '✨ 开始热辣点评'}
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
          <div className="flex items-center mb-2">
            <BookmarkIcon />
            <a 
              href={earliestBookmark.bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium"
            >
              {earliestBookmark.bookmark.title}
            </a>
          </div>
          <p className="text-gray-700 mb-1"><span className="font-medium">收藏日期:</span> {earliestBookmark.bookmark.addDateFormatted}</p>
          <p className="text-gray-700"><span className="font-medium">距今:</span> {earliestBookmark.daysAgo} 天</p>
        </div>
      )}

      {comment ? (
        <div className="p-5 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-orange-100">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🔥</span>
              <h3 className="text-lg font-medium text-red-600">热辣点评</h3>
            </div>
            {nickname && (
              <button
                onClick={generateCard}
                className="px-4 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                生成卡片
              </button>
            )}
          </div>
          <div className="text-gray-700 leading-relaxed">
            {comment.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-3 break-words whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-5 bg-gray-50 rounded-lg border border-gray-200 text-center text-gray-500">
          {bookmarks.length > 0 
            ? '点击"点评"按钮，获取你的上网习惯热辣点评'
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
      
      {/* 卡片生成模态框 */}
      {showCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">你的专属点评卡片</h3>
              <button onClick={() => setShowCardModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {/* 卡片预览区域 */}
            <div 
              ref={cardRef} 
              className="relative overflow-hidden rounded-xl shadow-lg mb-4"
              style={{
                width: '375px',
                margin: '0 auto',
                backgroundColor: '#fff',
                fontFamily: '"Segoe UI", Roboto, system-ui, -apple-system, sans-serif',
              }}
            >
              {/* 顶部渐变背景 - 减小高度 */}
              <div 
                className="absolute top-0 left-0 w-full h-20 z-0"
                style={{
                  background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
                }}
              ></div>
              
              {/* 卡片内容容器 */}
              <div className="relative z-10 px-5 pt-6 pb-5">
                {/* 头部区域 */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-10 h-10 flex items-center justify-center rounded-full"
                      style={{ background: 'rgba(255,255,255,0.9)' }}
                    >
                      <span className="text-xl">🔥</span>
                    </div>
                    <h2 className="text-white font-bold text-xl tracking-tight">书签热辣点评</h2>
                  </div>
                  <div 
                    className="text-xs text-white px-2 py-1 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    {new Date().toLocaleDateString('zh-CN')}
                  </div>
                </div>
                
                {/* 增加间隔，使外号区域远离顶部 */}
                <div className="h-8"></div>
                
                {/* 外号展示区 - 简洁居中设计，无边框 */}
                <div className="mb-6 text-center">
                  <h1 
                    className="text-2xl font-black tracking-wide inline-block"
                    style={{ 
                      color: '#FF416C',
                      textShadow: '1px 1px 0 rgba(0,0,0,0.1)',
                      fontFamily: 'Arial Black, Helvetica, sans-serif',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {nickname}
                  </h1>
                  <div 
                    className="w-16 h-1 mx-auto mt-2"
                    style={{ 
                      background: 'linear-gradient(90deg, transparent, #FF416C, transparent)',
                    }}
                  ></div>
                </div>
                
                {/* 内容区域 - 改进字体和样式 */}
                <div 
                  className="bg-white rounded-xl p-5 shadow-sm mt-3"
                  style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    fontFamily: '"Noto Sans SC", "Source Sans Pro", -apple-system, system-ui, sans-serif',
                  }}
                >
                  {/* 装饰元素 - 调整位置 */}
                  <div className="absolute right-4 top-36 opacity-10 rotate-12">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="#FF416C">
                      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                  
                  {/* 评论内容 - 改进文字样式 */}
                  <div 
                    className="text-gray-700 leading-relaxed space-y-3"
                    style={{ 
                      fontSize: '15px',
                      lineHeight: 1.6,
                    }}
                  >
                    {comment.split('\n\n').map((paragraph, index, array) => {
                      // 检查是否是最后一段，并且包含"你真的是个【"
                      if (index === array.length - 1 && paragraph.includes('你真的是个【')) {
                        // 移除这部分内容
                        const cleanedParagraph = paragraph.replace(/你真的是个【.*?】.*?$/, '');
                        return cleanedParagraph ? (
                          <p key={index} className="break-words">
                            {cleanedParagraph}
                          </p>
                        ) : null;
                      }
                      return (
                        <p key={index} className="break-words">
                          {paragraph}
                        </p>
                      );
                    })}
                  </div>
                  
                  {/* 引用标记装饰 - 调整位置 */}
                  <div className="absolute left-8 top-44 opacity-10">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="#FF416C">
                      <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                    </svg>
                  </div>
                </div>
                
                {/* 底部信息 */}
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                    </svg>
                    <span>www.bookmarkmaven.space</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={saveCard}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                保存图片
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}