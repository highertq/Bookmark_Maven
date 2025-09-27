import { NextResponse } from 'next/server';
import OpenAI from "openai";
import { generatePrompt } from '@/lib/prompts';
import type { Bookmark } from '@/lib/bookmark-parser';

interface BookmarkData {
  title: string;
  url: string;
  category?: string;
  date?: string;
}

// 使用环境变量获取API密钥
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;

export const runtime = 'edge'; // 使用Edge Runtime，通常有更长的执行时间

export const config = {
  api: {
    responseLimit: '4mb',
    bodyParser: {
      sizeLimit: '4mb'
    }
  }
};

export async function POST(
  request: Request,
  context: { params: Promise<{ locale: string }> }
) {
  try {
    const { bookmarks } = await request.json() as { bookmarks: BookmarkData[] };
    const params = await context.params;
    const locale = params.locale;

    if (!bookmarks || !Array.isArray(bookmarks) || bookmarks.length === 0) {
      const errorMessage = locale === 'zh' ? '无效的书签数据' : 'Invalid bookmark data';
      return new NextResponse(JSON.stringify({ error: errorMessage }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 验证语言参数
    if (!['zh', 'en'].includes(locale)) {
      return new NextResponse(JSON.stringify({ error: 'Unsupported locale' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      // 转换书签数据格式
      const processedBookmarks: Bookmark[] = bookmarks.map(bookmark => ({
        title: bookmark.title,
        url: bookmark.url,
        category: bookmark.category,
        addDateFormatted: bookmark.date ? formatBookmarkDate(bookmark.date, locale) : undefined
      }));

      // 使用多语言提示词生成器
      const prompt = generatePrompt(processedBookmarks, locale);
      
      // 调用AI模型生成评论
      const comment = await generateAIComment(prompt, locale);
      
      // 直接返回评论文本，明确设置为text/plain
      return new NextResponse(comment, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    } catch (aiError) {
      console.error('AI模型调用出错:', aiError);
      // 返回更具体的错误信息
      const errorMessage = aiError instanceof Error ? aiError.message : 
        (locale === 'zh' ? '生成评论失败' : 'Failed to generate comment');
      const responseText = locale === 'zh' ? 
        `生成评论失败: ${errorMessage}` : 
        `Failed to generate comment: ${errorMessage}`;
      
      return new NextResponse(responseText, {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  } catch (error) {
    console.error('生成评论出错:', error);
    const params = await context.params;
    const errorMessage = params.locale === 'zh' ? '处理请求失败' : 'Request processing failed';
    return new NextResponse(errorMessage, {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// 格式化书签日期
function formatBookmarkDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '';
  }
  
  if (locale === 'zh') {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}

// 调用AI模型生成评论
async function generateAIComment(prompt: string, locale: string): Promise<string> {
  try {
    if (!DASHSCOPE_API_KEY) {
      const errorMsg = locale === 'zh' 
        ? '未配置API密钥，请在.env.local文件中设置DASHSCOPE_API_KEY'
        : 'API key not configured. Please set DASHSCOPE_API_KEY in .env.local file';
      throw new Error(errorMsg);
    }

    // 使用阿里云百炼API
    const openai = new OpenAI({
      apiKey: DASHSCOPE_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    });

    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const systemMessage = locale === 'zh' 
          ? '你是一个毒舌评论员。请直接输出评论内容，不要有任何前缀或格式化。确保你的回复是完整的，不要因为字数限制而截断内容。'
          : 'You are a savage critic. Please output commentary directly without any prefix or formatting. Ensure your response is complete and not truncated due to length limits.';

        const completion = await openai.chat.completions.create({
          model: "deepseek-v3",
          messages: [
            {
              role: 'system', 
              content: systemMessage
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 10000,
          top_p: 0.7,
          frequency_penalty: 0.5
        });
        
        // 直接返回内容部分
        return completion.choices[0].message.content || '';
      } catch (fetchError) {
        retryCount++;
        console.error(`API请求失败(尝试 ${retryCount}/${maxRetries + 1}):`, fetchError);

        if ((fetchError as { name?: string }).name === 'AbortError') {
          console.error('API请求超时');
          if (retryCount > maxRetries) {
            const timeoutMsg = locale === 'zh' ? 'API请求超时，请稍后再试' : 'API request timeout, please try again later';
            throw new Error(timeoutMsg);
          }
        } else if (retryCount > maxRetries) {
          const failMsg = locale === 'zh' 
            ? `API请求失败: ${(fetchError as Error).message ?? '未知错误'}`
            : `API request failed: ${(fetchError as Error).message ?? 'Unknown error'}`;
          throw new Error(failMsg);
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    const noResponseMsg = locale === 'zh' ? 'API请求失败，无法获取响应' : 'API request failed, unable to get response';
    throw new Error(noResponseMsg);
  } catch (error) {
    console.error('AI模型调用失败:', error);
    throw error; // 抛出错误，让上层函数处理
  }
}
