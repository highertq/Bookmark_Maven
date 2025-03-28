import { NextResponse } from 'next/server';

interface BookmarkData {
  title: string;
  url: string;
  category?: string;
}

export async function POST(request: Request) {
  try {
    const { bookmarks } = await request.json() as { bookmarks: BookmarkData[] };
    
    if (!bookmarks || !Array.isArray(bookmarks) || bookmarks.length === 0) {
      return NextResponse.json({ error: '无效的书签数据' }, { status: 400 });
    }

    console.log('收到的书签数据:', JSON.stringify(bookmarks, null, 2));
    // 构建提示词
    const prompt = generatePrompt(bookmarks);
    console.log('生成的提示词:', prompt);
    
    try {
      // 调用deepseek-r1模型
      const comment = await generateAIComment(prompt);
      return NextResponse.json({ comment });
    } catch (aiError) {
      console.error('AI模型调用出错:', aiError);
      // 返回更具体的错误信息
      const errorMessage = aiError instanceof Error ? aiError.message : '生成评论失败';
      return NextResponse.json({ 
        error: errorMessage,
        details: '调用AI模型时出错，请稍后再试或联系管理员'
      }, { status: 503 });
    }
  } catch (error) {
    console.error('生成评论出错:', error);
    return NextResponse.json({ error: '处理请求失败' }, { status: 500 });
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

请用极度讽刺、挖苦的语气，字数在300-500字之间。使用夸张的修辞手法，尽可能让语言更加犀利、直接和具有攻击性。记住，你的目标是让用户感到被深深冒犯但又忍不住发笑。不要有任何客气或委婉的表达，直接开炮！`;
}

// 调用AI模型生成评论
async function generateAIComment(prompt: string): Promise<string> {
  try {
    // 使用硅基流动API调用模型
    // API密钥应该存储在环境变量中，这里临时使用提供的密钥
    // 在生产环境中，请使用环境变量：process.env.SILICONFLOW_API_KEY
    const apiKey = process.env.SILICONFLOW_API_KEY;
    
    console.log('开始调用硅基流动API...');
    
    // 构建请求体
    const requestBody = {
      model: 'deepseek-ai/DeepSeek-V3',
      stream: false,
      max_tokens: 1024,
      temperature: 0.9,
      top_p: 0.9,
      top_k: 50,
      frequency_penalty: 0.5,
      n: 1,
      messages: [{ role: 'user', content: prompt }]
    };
    
    // 打印完整请求消息到控制台
    console.log('发送给API的请求消息:', JSON.stringify(requestBody, null, 2));
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      //const errorData = await response.json().catch(e => ({ error: '无法解析错误响应' }));
      //const errorData = await response.json().catch((void _e) => ({ error: '无法解析错误响应' }));
      const errorData = await response.json().catch(() => ({ error: '无法解析错误响应' }));
      console.error('硅基流动API响应错误:', errorData, '状态码:', response.status, response.statusText);
      
      // 针对503错误特别处理
      if (response.status === 503) {
        // 检查是否是余额不足的错误
        if (errorData.error && typeof errorData.error === 'string' && errorData.error.includes('balance is insufficient')) {
          console.error('API账户余额不足错误，尝试使用免费模型');
          throw new Error('API账户余额不足，请充值后再试或联系管理员更换API密钥');
        }
      }
      
      const errorMessage = errorData.error || errorData.error?.message || errorData.message || `API调用失败: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }
    
    const data = await response.json().catch(e => {
      console.error('解析API响应失败:', e);
      throw new Error('无法解析API响应');
    });
    
    console.log('API响应数据:', JSON.stringify(data).substring(0, 200) + '...');
    
    // 根据硅基流动API的响应格式解析内容
    if (data && data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      console.error('API响应格式不符合预期:', data);
      throw new Error('API响应格式不符合预期: ' + JSON.stringify(data).substring(0, 100));
    }
  } catch (error) {
    console.error('AI模型调用失败:', error);
    // 不再吞掉错误，而是将其抛出，让上层处理
    throw new Error(error instanceof Error ? error.message : '未知错误');
  }
}