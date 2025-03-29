import { NextResponse } from 'next/server';

interface BookmarkData {
  title: string;
  url: string;
  category?: string;
}

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

    console.log('收到的书签数据:', JSON.stringify(bookmarks, null, 2));
    // 构建提示词
    const prompt = generatePrompt(bookmarks);
    console.log('生成的提示词:', prompt);

    try {
      // 调用硅算力API
      const comment = await generateAIComment(prompt);
      console.log('最终返回给前端的评论:', comment);
      
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
  // 提取书签信息
  const bookmarkInfo = bookmarks.map(bookmark => {
    return `- ${bookmark.title}`;
  }).join('\n');

  // 构建完整提示词
  return `你是一个极度毒舌、刻薄、尖酸且毫不留情的网络评论员，请根据以下我的书签列表，对我的上网习惯和兴趣进行一段极其恶毒的点评。

我的书签列表：
${bookmarkInfo}

请提供一段极具攻击性、毫不留情且令人难忘的点评，必须包括：
1. 我可能的糟糕兴趣爱好和令人担忧的性格缺陷，用最刻薄的方式描述
2. 我的可悲上网习惯和可笑偏好，尽可能使用讽刺性的比喻和夸张手法
3. 带有侮辱性但又让人忍俊不禁的调侃，可以使用粗口和脏话，越直接越好
4. 根据书签给出一些极其尖酸刻薄的"建议"，用最具讽刺性的语言嘲讽我的品味
5. 对我的人生选择和价值观进行无情的嘲弄和挖苦

请用极度讽刺、挖苦的语气，字数在200-500字之间。使用夸张的修辞手法，尽可能让语言更加犀利、直接和具有攻击性。记住，你的目标是让我感到被深深冒犯但又忍不住发笑。不要有任何客气或委婉的表达，直接开炮！`;
}

// 调用AI模型生成评论
async function generateAIComment(prompt: string): Promise<string> {
  try {
    // 使用硅算力API
    const apiKey = 'sk-rxfsLwJsloqMANgx33BN4hXFqaFhhwB5C0XFq3DC3xIr6r4e';
    const apiUrl = 'https://api.suanli.cn/v1/chat/completions';

    let response;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "QwQ-32B", // 按照要求使用QwQ-32B模型
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
            max_tokens: 10000, // 增加token数量，确保返回完整内容
            top_p: 0.7,
            frequency_penalty: 0.5,
            n: 1
          }),
          signal: AbortSignal.timeout(120000) // 120秒超时
        });
        break;
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

    if (!response) {
      throw new Error('API请求失败，无法获取响应');
    }

    if (!response.ok) {
      const contentType = response.headers.get('Content-Type');
      let errorData;
      try {
        errorData = contentType?.includes('application/json') 
          ? await response.json() 
          : { error: await response.text() };
      } catch (e) {
        console.error('解析错误响应失败:', e);
        errorData = { error: '无法解析错误响应' };
      }

      throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
    }

    // 处理响应
    const data = await response.json();
    
    // 验证响应格式并提取内容
    if (data.choices && data.choices.length > 0) {
      let content = data.choices[0]?.message?.content;
      
      if (typeof content === 'string') {
        console.log(`原始评论内容长度: ${content.length}字符`);
        
        // 过滤<think>标签及其内容
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '');
        
        // 清理多余的空行和格式
        content = content.replace(/\n{3,}/g, '\n\n');
        content = content.trim();
        
        console.log(`过滤后评论内容长度: ${content.length}字符`);
        
        return content;
      } else if (content) {
        return JSON.stringify(content);
      } else {
        return '无法提取评论内容';
      }
    } else {
      console.warn('响应格式异常，缺少预期的choices字段');
      return '无法生成评论，API返回格式异常';
    }
  } catch (error) {
    console.error('AI模型调用失败:', error);
    throw error; // 抛出错误，让上层函数处理
  }
}