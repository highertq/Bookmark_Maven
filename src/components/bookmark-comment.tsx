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

  // 保存卡片为图片 - 修复宽度问题和颜色解析错误
  const saveCard = () => {
    if (!cardRef.current) return;
    
    try {
      // 显示加载状态
      console.log("saveCard 函数开始执行");
      const loadingDiv = document.createElement('div');
      loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]';
      loadingDiv.innerHTML = '<div class="bg-white p-4 rounded-lg shadow-lg text-center"><div class="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div><p>正在生成图片...</p></div>';
      document.body.appendChild(loadingDiv);
      
      setTimeout(async () => {
        try {
          console.log("开始生成图片...");
          
          // 克隆预览中的卡片元素，避免修改原始元素
          const cardElement = cardRef.current!;
          const clone = cardElement.cloneNode(true) as HTMLElement;
          
          // 设置克隆元素样式以确保完整渲染 - 增加宽度
          clone.style.position = 'fixed';
          clone.style.top = '-9999px';
          clone.style.left = '-9999px';
          clone.style.width = '430px'; // 增加宽度从375px到430px
          clone.style.height = 'auto';
          clone.style.background = '#ffffff';
          clone.style.padding = '0';
          clone.style.margin = '0';
          clone.style.border = 'none';
          clone.style.borderRadius = '12px';
          clone.style.overflow = 'hidden';
          clone.style.boxShadow = 'none';
          clone.style.zIndex = '-1';
          
          // 处理所有元素中的颜色值，替换不兼容的颜色函数
          const allElements = clone.querySelectorAll('*');
          allElements.forEach((el) => {
            const element = el as HTMLElement;
            try {
              const computedStyle = getComputedStyle(element);
              
              // 将计算后的标准RGB颜色应用到元素上
              if (computedStyle.color) element.style.color = computedStyle.color;
              if (computedStyle.backgroundColor && computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                element.style.backgroundColor = computedStyle.backgroundColor;
              }
              if (computedStyle.borderColor) element.style.borderColor = computedStyle.borderColor;
            } catch (e) {
              console.log('处理元素样式出错:', e);
            }
            
            // 移除可能包含问题颜色函数的渐变并替换为安全颜色
            if (element.style.background && (
                element.style.background.includes('gradient') || 
                element.style.background.includes('oklch'))) {
              // 替换为标准RGB渐变
              element.style.background = 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)';
            }
          });
          
          // 将克隆的元素添加到文档
          document.body.appendChild(clone);
          
          // 等待字体加载完成
          await document.fonts.ready;
          console.log("字体已加载完成");
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log("开始渲染图片...");
          
          try {
            // 使用html2canvas配置优化
            const html2canvas = await import('html2canvas');
            console.log("html2canvas导入成功，开始创建canvas");

            const canvas = await html2canvas.default(clone, {
              scale: 3, // 高清渲染
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              logging: true,
              width: 430, // 增加宽度从375px到430px
              height: clone.offsetHeight
            });
            
            console.log("Canvas创建成功，canvas尺寸:", canvas.width, "x", canvas.height);
            
            // 将canvas转换为图片URL
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            
            // 下载图片
            const link = document.createElement('a');
            link.download = `${nickname || '网络达人'}的书签点评.png`;
            link.href = dataUrl;
            link.click();
            
            console.log("图片已生成并下载");
            
            // 清理
            document.body.removeChild(clone);
            document.body.removeChild(loadingDiv);
            
            // 显示成功提示
            const successToast = document.createElement('div');
            successToast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[100]';
            successToast.textContent = '✅ 图片已保存到你的下载文件夹';
            document.body.appendChild(successToast);
            
            // 3秒后移除成功提示
            setTimeout(() => {
              document.body.removeChild(successToast);
              setShowCardModal(false);
            }, 3000);
          } catch (error) {
            console.error('html2canvas错误:', error);
            document.body.removeChild(clone);
            
            // 尝试使用更简单的DOM-to-Image方法
            try {
              const domtoimage = await import('dom-to-image');
              console.log("使用备用方法dom-to-image");
              
              const dataUrl = await domtoimage.default.toPng(cardElement, {
                quality: 1.0,
                bgcolor: '#ffffff',
                width: 430, // 增加宽度
                height: cardElement.offsetHeight
              });
              
              // 下载图片
              const link = document.createElement('a');
              link.download = `${nickname || '网络达人'}的书签点评.png`;
              link.href = dataUrl;
              link.click();
              
              // 清理
              document.body.removeChild(loadingDiv);
              
              // 显示成功提示
              const successToast = document.createElement('div');
              successToast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[100]';
              successToast.textContent = '✅ 图片已保存到你的下载文件夹';
              document.body.appendChild(successToast);
              
              // 3秒后移除成功提示
              setTimeout(() => {
                document.body.removeChild(successToast);
                setShowCardModal(false);
              }, 3000);
            } catch (backupError) {
              console.error("备用方法也失败:", backupError);
              useScreenshotFallback(loadingDiv);
            }
          }
        } catch (error) {
          console.error('创建卡片元素失败:', error);
          document.body.removeChild(loadingDiv);
          alert('无法生成图片，请尝试使用浏览器的截图功能');
        }
      }, 300);
    } catch (error) {
      console.error('初始化失败:', error);
      alert('无法生成图片，请使用浏览器截图功能保存');
    }
  };

  // 修复备份捕获函数中的引用错误
  const backupCapture = async (clone: HTMLElement, loadingDiv: HTMLElement) => {
    try {
      // 获取元素尺寸 - 增加宽度
      const width = 430; // 从375px增加到430px
      const height = clone.offsetHeight || 700;
      
      // 创建Canvas
      const canvas = document.createElement('canvas');
      canvas.width = width * 3; // 高分辨率
      canvas.height = height * 3;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('无法创建Canvas上下文');
      }
      
      // 设置背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(3, 3); // 缩放以提高质量
      
      // 绘制HTML到Canvas
      const data = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png', 1.0));
        };
        // 先生成临时图片
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        if (tempCtx) {
          tempCtx.fillStyle = '#ffffff';
          tempCtx.fillRect(0, 0, width, height);
          
          // 修复html2canvas引用问题
          import('html2canvas').then(html2canvasModule => {
            html2canvasModule.default(clone, {
              canvas: tempCanvas,
              scale: 1,
              backgroundColor: '#ffffff',
              logging: false
            }).then(canvasResult => {
              img.src = canvasResult.toDataURL('image/png');
            });
          });
        }
      });
      
      // 下载图片
      const link = document.createElement('a');
      link.download = `${nickname || '网络达人'}的书签点评.png`;
      link.href = data;
      link.click();
      
      // 清理
      document.body.removeChild(loadingDiv);
      
      // 显示成功提示
      const successToast = document.createElement('div');
      successToast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[100]';
      successToast.textContent = '✅ 图片已保存到你的下载文件夹';
      document.body.appendChild(successToast);
      
      // 3秒后移除成功提示
      setTimeout(() => {
        document.body.removeChild(successToast);
        setShowCardModal(false);
      }, 3000);
    } catch (error) {
      console.error('备份捕获失败:', error);
      // 恢复原始元素的状态
      useScreenshotFallback(loadingDiv);
    }
  };

  // 截图回退方案
  const useScreenshotFallback = (loadingDiv: HTMLElement) => {
    // 移除加载状态
    if (document.body.contains(loadingDiv)) {
      document.body.removeChild(loadingDiv);
    }
    
    // 显示截图指导
    const screenshotDiv = document.createElement('div');
    screenshotDiv.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]';
    screenshotDiv.innerHTML = `
      <div class="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
        <h3 class="text-lg font-semibold mb-2">请使用截图功能</h3>
        <p class="mb-4">图片自动生成失败，请按以下步骤手动截图：</p>
        <ol class="text-left list-decimal pl-6 mb-4 space-y-2">
          <li>Windows系统: 按键盘上的 <span class="bg-gray-200 px-1 py-0.5 rounded">Windows徽标键 + Shift + S</span></li>
          <li>Mac系统: 按键盘上的 <span class="bg-gray-200 px-1 py-0.5 rounded">Command + Shift + 4</span></li>
          <li>选择要截取的卡片区域</li>
          <li>保存截图</li>
        </ol>
        <button id="screenshot-guide-close" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow">知道了</button>
      </div>
    `;
    document.body.appendChild(screenshotDiv);
    
    // 添加关闭按钮事件
    document.getElementById('screenshot-guide-close')?.addEventListener('click', () => {
      document.body.removeChild(screenshotDiv);
    });
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
        <div className="p-5 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-orange-100 relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
            <span className="text-2xl mr-2">🔥</span>
              <h3 className="text-lg font-medium text-red-600">热辣点评</h3>
            </div>
            
            {/* 超级醒目的卡片生成按钮 */}
            {nickname && (
              <div className="flex flex-col items-end relative">
                {/* 闪烁的光环效果 */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-lg blur opacity-70 animate-pulse"></div>
                <button
                  onClick={generateCard}
                  className="relative px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all shadow-lg flex items-center font-bold z-10"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  免费生成卡片 ✨
                </button>
                <div className="text-sm text-gray-600 mt-1.5 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  <span>完全免费，已有<span className="font-bold text-red-500 mx-1">97%</span>用户使用</span>
                </div>
              </div>
            )}
          </div>
          
          {/* 新功能标志 */}
          {nickname && (
            <div className="absolute -top-4 -right-2 transform rotate-12">
              <span className="inline-block bg-yellow-400 text-yellow-800 text-xs px-2 py-1 rounded-lg font-bold shadow-md animate-bounce">
                🎁 新功能!
              </span>
            </div>
          )}
          
          <div className="text-gray-700 leading-relaxed">
            {comment.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-3 break-words whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* 底部引导横幅 - 全新设计 */}
          {nickname && (
            <div className="mt-5">
              <div 
                onClick={generateCard}
                className="bg-blue-500 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden"
              >
                {/* 标题区域 */}
                <div className="p-3 flex items-center space-x-3">
                  {/* 左侧图标 */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span role="img" aria-label="fire" className="text-2xl">🔥</span>
                    </div>
                  </div>
                  
                  {/* 中间文本 */}
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-base leading-tight">
                      生成你的专属卡片
                    </h3>
                    {/* 外号名字区域 - 解决红色箭头指向的问题 */}
                    <div className="mt-1 bg-white bg-opacity-90 px-2 py-1 rounded text-blue-700 font-bold text-sm inline-block shadow-sm">
                      {nickname}
                    </div>
                  </div>
                  
                  {/* 右侧按钮 */}
                  <div className="flex-shrink-0">
                    <button className="bg-white text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md text-sm font-bold shadow flex items-center transition-colors">
                      <span>立即生成</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* 底部特点区域 */}
                <div className="bg-blue-600 px-3 py-2 flex items-center justify-between text-xs text-blue-100">
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span>高清图片</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span>随时保存分享</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                    </svg>
                    <span>已有<span className="font-bold text-white mx-0.5">97%</span>用户使用</span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
            
            {/* 卡片预览区域 - 修改以解决显示问题和比例问题 */}
            <div 
              ref={cardRef} 
              className="relative overflow-hidden rounded-xl shadow-lg mb-4"
              style={{
                width: '375px',
                margin: '0 auto',
                backgroundColor: '#fff',
                fontFamily: '"Noto Sans SC", "Source Sans Pro", system-ui, -apple-system, sans-serif',
              }}
            >
              {/* 顶部渐变背景 */}
              <div 
                className="absolute top-0 left-0 w-full h-16 z-0"
                style={{
                  background: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
                }}
              ></div>
              
              {/* 卡片内容容器 */}
              <div className="relative z-10 px-5 pt-4 pb-5">
                {/* 头部区域 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-10 h-10 flex items-center justify-center rounded-full"
                      style={{ background: 'rgba(255,255,255,0.9)' }}
                    >
                      <span className="text-xl">🔥</span>
                    </div>
                    <h2 className="text-white font-bold text-lg">书签热辣点评</h2>
                  </div>
                  <div 
                    className="text-xs text-white px-2 py-1 rounded-full"
                    style={{ background: 'rgba(0,0,0,0.2)' }}
                  >
                    {new Date().toLocaleDateString('zh-CN')}
                  </div>
                </div>
                
                {/* 增加间隔，使外号区域远离顶部 */}
                <div className="h-4"></div>
                
                {/* 外号展示区 - 增强字体清晰度 */}
                <div className="mb-4 text-center">
                  <h1 
                    className="text-xl font-black inline-block"
                    style={{ 
                      color: '#FF416C',
                      textShadow: '1px 1px 0 rgba(0,0,0,0.1)',
                      fontFamily: '"Arial Black", "Noto Sans SC", sans-serif',
                      letterSpacing: '0.5px',
                      fontWeight: 900,
                    }}
                  >
                    {nickname}
                  </h1>
                  <div 
                    className="w-16 h-1 mx-auto mt-1"
                    style={{ 
                      background: 'linear-gradient(90deg, transparent, #FF416C, transparent)',
                    }}
                  ></div>
                </div>
                
                {/* 内容区域 - 改进字体和样式提高清晰度 */}
                <div 
                  className="bg-white rounded-lg p-4 shadow-sm"
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    fontFamily: '"Noto Sans SC", "Source Sans Pro", system-ui, sans-serif',
                  }}
                >
                  {/* 装饰元素 */}
                  <div className="absolute right-4 top-24 opacity-10 rotate-12">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="#FF416C">
                      <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                    </svg>
                  </div>
                  
                  {/* 评论内容 - 提高文字渲染质量 */}
                  <div 
                    className="text-gray-700 leading-relaxed space-y-2"
                    style={{ 
                      fontSize: '14px',
                      lineHeight: 1.5,
                      fontWeight: 400,
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
                </div>
                
                {/* 底部信息 */}
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            
            <div className="flex flex-col items-center mt-6">
              <button
                onClick={saveCard}
                className="group relative inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg text-lg font-bold shadow-lg hover:from-blue-700 hover:to-indigo-800 transition-all overflow-hidden"
              >
                {/* 背景动画效果 */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-90 transition-opacity"></span>
                <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent to-black opacity-10"></span>
                
                {/* 按钮内容 */}
                <span className="relative flex items-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  免费保存我的专属卡片
                  <span className="ml-1 animate-pulse">✨</span>
                </span>
              </button>
              <div className="text-center text-gray-500 text-sm mt-2 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span>完全免费，图片将自动下载到你的设备</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}