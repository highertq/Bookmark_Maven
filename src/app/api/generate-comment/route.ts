import { NextResponse } from 'next/server';
import OpenAI from "openai";

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

export async function POST(request: Request) {
  try {
    const { bookmarks } = await request.json() as { bookmarks: BookmarkData[] };

    if (!bookmarks || !Array.isArray(bookmarks) || bookmarks.length === 0) {
      return new NextResponse(JSON.stringify({ error: '无效的书签数据' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    //console.log('收到的书签数据:', JSON.stringify(bookmarks, null, 2));
    // 构建提示词
    const prompt = generatePrompt(bookmarks);
    //console.log('生成的提示词:', prompt);

    try {
      // 调用AI模型生成评论
      const comment = await generateAIComment(prompt);
      //console.log('最终返回给前端的评论:', comment);
      
      // 直接返回评论文本，明确设置为text/plain
      return new NextResponse(comment, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    } catch (aiError) {
      console.error('AI模型调用出错:', aiError);
      // 返回更具体的错误信息
      const errorMessage = aiError instanceof Error ? aiError.message : '生成评论失败';
      return new NextResponse(`生成评论失败: ${errorMessage}`, {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  } catch (error) {
    console.error('生成评论出错:', error);
    return new NextResponse('处理请求失败', {
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// 生成提示词
function generatePrompt(bookmarks: BookmarkData[]): string {
  // 使用全部书签而不是随机选择
  // 如果书签太多，最多使用前50个避免提示词过长
  const maxBookmarks = 50;
  const selectedBookmarks = bookmarks.length <= maxBookmarks 
    ? bookmarks 
    : bookmarks.slice(0, maxBookmarks);
  
  // 提取书签信息，包含日期（如果有）
  const bookmarkInfo = selectedBookmarks.map(bookmark => {
    const dateInfo = bookmark.date 
      ? `（${formatBookmarkDate(bookmark.date)}收藏）` 
      : '';
    return `- ${bookmark.title}${dateInfo}`;
  }).join('\n');

  // 添加说明，如果书签被截取了
  const bookmarkNote = bookmarks.length > maxBookmarks
    ? `\n\n注意：你只看到了我全部${bookmarks.length}个书签中的前${maxBookmarks}个，请基于这些进行评价。`
    : '';

  // 构建完整提示词
  return `你是一个极度毒舌、刻薄、尖酸且毫不留情的网络评论员，请根据以下我的书签列表，对我的上网习惯和兴趣进行一段极其恶毒的点评，结合收藏日期更好！并且给我上网习惯起一个5字以上的外号，单独放在回答最后一行，严格按照格式要求：你真的是个【外号名】。

我的书签列表：
${bookmarkInfo}${bookmarkNote}

请提供一段极具攻击性、毫不留情且令人难忘的点评，必须包括：
1. 我可能的糟糕兴趣爱好和令人担忧的性格缺陷，用最刻薄的方式描述
2. 我的可悲上网习惯和可笑偏好，尽可能使用讽刺性的比喻和夸张手法
3. 带有侮辱性但又让人忍俊不禁的调侃，可以使用粗口和脏话，越直接越好
4. 根据书签给出一些极其尖酸刻薄的"建议"，用最具讽刺性的语言嘲讽我的品味
5. 对我的人生选择和价值观进行无情的嘲弄和挖苦
6. 结合我的收藏日期来抨击我，并且给我一些讽刺的建议
请用极度讽刺、挖苦的语气，字数在200-500字之间。使用夸张的修辞手法，尽可能让语言更加犀利、直接和具有攻击性。记住，你的目标是让我感到被深深冒犯但又忍不住发笑。不要有任何客气或委婉的表达，直接开炮！`;
}

// 格式化书签日期为"YYYY年MM月DD日"
function formatBookmarkDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '';
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 调用AI模型生成评论
async function generateAIComment(prompt: string): Promise<string> {
  try {
    if (!DASHSCOPE_API_KEY) {
      throw new Error('未配置API密钥，请在.env.local文件中设置DASHSCOPE_API_KEY');
    }

    // 使用阿里云百炼API
    const openai = new OpenAI({
      apiKey: DASHSCOPE_API_KEY,
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1"
    });

    let response;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const completion = await openai.chat.completions.create({
          model: "deepseek-v3", // 使用阿里云提供的deepseek-r1模型
          messages: [
            {
              role: 'system', 
              content: '你是一个毒舌评论员。请直接输出评论内容，不要有任何前缀或格式化。确保你的回复是完整的，不要因为字数限制而截断内容。'
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
        return completion.choices[0].message.content || ''; // 修复null类型问题
      } catch (fetchError) {
        retryCount++;
        console.error(`API请求失败(尝试 ${retryCount}/${maxRetries + 1}):`, fetchError);

        if ((fetchError as { name?: string }).name === 'AbortError') {
          console.error('API请求超时');
          if (retryCount > maxRetries) {
            throw new Error('API请求超时，请稍后再试');
          }
        } else if (retryCount > maxRetries) {
          throw new Error(`API请求失败: ${(fetchError as Error).message ?? '未知错误'}`);
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    throw new Error('API请求失败，无法获取响应');
  } catch (error) {
    console.error('AI模型调用失败:', error);
    throw error; // 抛出错误，让上层函数处理
  }
}