import { NextResponse } from 'next/server';

interface BookmarkData {
  title: string;
  url: string;
  category?: string;
}

export const runtime = 'edge'; // 使用Edge Runtime，通常有更长的执行时间

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
      // 调用deepseek-r1模型
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
  return `你是一个极度毒舌、刻薄、尖酸且毫不留情的网络评论员，请根据以下用户的书签列表，对他/她的上网习惯和兴趣进行一段极其恶毒的点评。

用户的书签列表：
${bookmarkInfo}

请提供一段极具攻击性、毫不留情且令人难忘的点评，必须包括：
1. 用户可能的糟糕兴趣爱好和令人担忧的性格缺陷，用最刻薄的方式描述
2. 用户的可悲上网习惯和可笑偏好，尽可能使用讽刺性的比喻和夸张手法
3. 带有侮辱性但又让人忍俊不禁的调侃，可以使用粗口和脏话，越直接越好
4. 根据书签给出一些极其尖酸刻薄的"建议"，用最具讽刺性的语言嘲讽用户的品味
5. 对用户的人生选择和价值观进行无情的嘲弄和挖苦

请用极度讽刺、挖苦的语气，字数在200-500字之间。使用夸张的修辞手法，尽可能让语言更加犀利、直接和具有攻击性。记住，你的目标是让用户感到被深深冒犯但又忍不住发笑。不要有任何客气或委婉的表达，直接开炮！`;
}

// 调用AI模型生成评论
async function generateAIComment(prompt: string): Promise<string> {
  try {
    // 使用硅基流动API调用模型
    const apiKey = process.env.SILICONFLOW_API_KEY;

    if (!apiKey) {
      throw new Error('API密钥未设置，请在环境变量中配置SILICONFLOW_API_KEY');
    }

    const requestBody = {
      model: 'deepseek-ai/DeepSeek-V3',
      stream: false,
      max_tokens: 400,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      frequency_penalty: 0.5,
      n: 1,
      messages: [
        { role: 'system', content: '你是一个毒舌评论员。请直接输出评论内容，不要有任何前缀或格式化。' },
        { role: 'user', content: prompt }
      ]
    };

    let response;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(60000)
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

    // 记录响应状态
    //console.log(`API响应状态: ${response.status} ${response.statusText}`);
    //console.log('API响应头:', JSON.stringify(Object.fromEntries(response.headers.entries())));

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

      if (response.status === 503 && errorData.error?.includes('balance is insufficient')) {
        throw new Error('API账户余额不足，请充值后再试或联系管理员更换API密钥');
      }

      throw new Error(`API调用失败: ${response.status} ${response.statusText}`);
    }

    let data;
    const responseText = await response.text();
    
    // 详细记录响应内容
    //console.log('API原始响应长度:', responseText.length);
    //console.log('API响应前100个字符:', JSON.stringify(responseText.substring(0, 100)));
    //console.log('API响应最后100个字符:', JSON.stringify(responseText.substring(responseText.length - 100)));
    
    // 检查是否有特殊字符
    const hexDump = Array.from(responseText.substring(0, 20)).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    //console.log('响应前20个字符的十六进制表示:', hexDump);

    if (!responseText || responseText.trim() === '') {
      console.error('API响应为空');
      throw new Error('API响应为空');
    }

    // 更详细地检查响应格式
    const firstChar = responseText.trim()[0];
    console.log('响应第一个字符:', firstChar, '(Unicode:', firstChar.charCodeAt(0), ')');
    
    if (firstChar !== '{' && firstChar !== '[') {
      console.log('响应不是JSON格式，直接返回文本');
      return responseText.trim();
    }

    try {
      // 尝试解析JSON
      const cleanedText = responseText.trim().replace(/[\ufeff\u200b\u0000]/g, '');
      console.log('清理后的响应前50个字符:', JSON.stringify(cleanedText.substring(0, 50)));
      
      data = JSON.parse(cleanedText);
      console.log('成功解析为JSON，结构:', Object.keys(data).join(', '));
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0]?.message?.content;
        console.log('提取的内容长度:', content ? content.length : 0);
        
        // 确保返回字符串
        if (typeof content === 'string') {
          return content.trim();
        } else if (content) {
          return JSON.stringify(content);
        } else {
          return '无法提取评论内容';
        }
      } else {
        console.warn('JSON响应格式异常，缺少预期的choices字段');
        return '无法生成评论，API返回格式异常';
      }
    } catch (parseError) {
      console.error('JSON解析失败:', parseError instanceof Error ? parseError.message : '未知错误');
      console.log('尝试解析的文本前200个字符:', JSON.stringify(responseText).substring(0, 200));
      
      // 尝试查找可能的JSON部分
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extractedJson = jsonMatch[0];
        console.log('从响应中提取可能的JSON部分，长度:', extractedJson.length);
        
        try {
          const extractedData = JSON.parse(extractedJson);
          console.log('成功解析提取的JSON部分');
          return extractedData.choices?.[0]?.message?.content || extractedJson;
        } catch (e) {
          console.error('提取的JSON部分解析失败:', e);
        }
      }
      
      // 如果所有解析方法都失败，返回原始文本
      console.log('所有JSON解析方法都失败，返回原始响应文本');
      return responseText.trim();
    }
  } catch (error) {
    console.error('AI模型调用失败:', error);
    // 确保将错误转换为字符串而不是直接抛出
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    // 返回错误消息而不是抛出异常
    return `生成评论失败: ${errorMessage}`;
  }
}