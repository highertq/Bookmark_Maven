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

    // 构建请求体 - 根据硅基流动API文档格式
    const requestBody = {
      model: 'deepseek-ai/DeepSeek-V3',
      stream: false,
      max_tokens: 512,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      frequency_penalty: 0.5,
      n: 1,
      messages: [
        { 
          role: 'system', 
          content: '你是一个毒舌评论员。请直接输出评论内容，不要有任何前缀或格式化。'
        },
        { 
          role: 'user', 
          content: prompt 
        }
      ]
    };

    // 打印完整请求消息到控制台
    console.log('发送给API的请求消息:', JSON.stringify(requestBody, null, 2));
    
    // 检查API密钥是否存在
    if (!apiKey) {
      console.error('API密钥未设置');
      throw new Error('API密钥未设置，请在环境变量中配置SILICONFLOW_API_KEY');
    }
    // 添加超时和重试机制
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
          // 添加超时设置
          signal: AbortSignal.timeout(15000) // 15秒超时
        });
        break; // 如果成功，跳出循环
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
        
        // 等待一段时间后重试
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
        console.error('完整的API错误响应:', JSON.stringify(errorData, null, 2));
      } catch (e) {
        console.error('解析错误响应失败:', e);
        errorData = { error: '无法解析错误响应' };
      }
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

    let data;
    const responseText = await response.text();
    console.log('原始API响应:', responseText);
    
    // 检查响应文本是否为空或只包含空白字符
    if (!responseText || responseText.trim() === '') {
      console.error('API响应为空');
      throw new Error('API响应为空');
    }
    
    // 增强的响应验证和处理
    const trimmedText = responseText.trim();
    console.log('处理前的响应文本长度:', trimmedText.length);
    console.log('响应文本前20个字符:', JSON.stringify(trimmedText.substring(0, 20)));
    
    // 检查是否有BOM或其他不可见字符
    const hexView = Array.from(trimmedText.substring(0, 10)).map(c => c.charCodeAt(0).toString(16).padStart(4, '0')).join(' ');
    console.log('响应文本前10个字符的十六进制表示:', hexView);
    
    // 更严格的JSON格式检查
    if (trimmedText[0] !== '{' && trimmedText[0] !== '[') {
      console.error('API响应不是有效的JSON格式 (首字符检查):', trimmedText.substring(0, 100));
      
      // 尝试在文本中查找JSON开始的位置
      const jsonStartIndex = trimmedText.indexOf('{');
      if (jsonStartIndex > 0) {
        console.log(`发现JSON开始于位置 ${jsonStartIndex}，尝试从此处解析`);
        const possibleJson = trimmedText.substring(jsonStartIndex);
        try {
          data = JSON.parse(possibleJson);
          console.log('从检测到的JSON开始位置解析成功');
        } catch (e) {
          console.error('从检测到的JSON开始位置解析失败:', e);
          throw new Error(`API响应格式异常，无法解析: ${trimmedText.substring(0, 100)}`);
        }
      } else {
        throw new Error(`API响应不是有效的JSON格式: ${trimmedText.substring(0, 100)}`);
      }
    } else {
      // 标准JSON解析流程
      try {
        data = JSON.parse(trimmedText);
      } catch (e) {
        console.error('解析API响应失败:', e, '原始响应前100个字符:', trimmedText.substring(0, 100));
        
        // 尝试多种清理方法
        try {
          // 方法1: 移除BOM和零宽字符
          const cleanedText1 = trimmedText.replace(/[\ufeff\u200b\u0000]/g, '');
          console.log('清理方法1后的文本前20个字符:', JSON.stringify(cleanedText1.substring(0, 20)));
          
          try {
            data = JSON.parse(cleanedText1);
            console.log('清理方法1解析成功');
            return data;
          } catch (e1) {
            console.log('清理方法1解析失败，尝试方法2');
            
            // 方法2: 查找可能的JSON部分
            const jsonMatch = trimmedText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const extractedJson = jsonMatch[0];
              console.log('提取的可能JSON:', extractedJson.substring(0, 50) + '...');
              
              try {
                data = JSON.parse(extractedJson);
                console.log('从提取的JSON解析成功');
                return data;
              } catch (e2) {
                console.error('从提取的JSON解析失败:', e2);
              }
            }
            
            // 所有方法都失败
            console.error('所有解析方法均失败');
            throw new Error(`无法解析API响应，请检查API服务: ${trimmedText.substring(0, 100)}`);
          }
        } catch (finalError) {
          console.error('所有清理方法均失败:', finalError);
          throw new Error(`无法解析API响应: ${trimmedText.substring(0, 100)}`);
        }
      }
    }

    //console.log('API响应数据:', JSON.stringify(data).substring(0, 200) + '...');

    // 根据硅基流动API的响应格式解析内容 - 参考官方API文档
    console.log('解析后的API响应数据结构:', JSON.stringify(data, null, 2));
    
    // 检查响应是否符合官方API文档中的格式
    if (data && data.choices && data.choices.length > 0) {
      // 检查message字段是否存在
      if (data.choices[0].message && data.choices[0].message.content) {
        const content = data.choices[0].message.content.trim();
        // 确保返回的内容不是 [1] 这样的格式
        return content === '[1]' ? '生成评论失败，请重试' : content;
      } 
      // 兼容可能的其他响应格式
      else if (data.choices[0].content) {
        const content = data.choices[0].content.trim();
        return content === '[1]' ? '生成评论失败，请重试' : content;
      }
      else {
        console.error('API响应中找不到content字段:', data.choices[0]);
        throw new Error('API响应格式不符合预期：找不到content字段');
      }
    } else {
      console.error('API响应格式不符合预期:', data);
      throw new Error('API响应格式不符合预期：缺少choices字段或为空');
    }
  } catch (error) {
    console.error('AI模型调用失败:', error);
    // 不再吞掉错误，而是将其抛出，让上层处理
    throw new Error(error instanceof Error ? error.message : '未知错误');
  }
}