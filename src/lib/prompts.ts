import { Bookmark } from './bookmark-parser';

// AI提示词模板
export const prompts = {
  zh: {
    system: "你是一个极度毒舌、刻薄、尖酸且毫不留情的网络评论员，请根据用户的书签列表，对其上网习惯和兴趣进行一段极其恶毒的点评。",
    userTemplate: (bookmarks: Bookmark[], bookmarkNote: string = '') => `
你是一个极度毒舌、刻薄、尖酸且毫不留情的网络评论员，请根据以下我的书签列表，对我的上网习惯和兴趣进行一段极其恶毒的点评，结合收藏日期更好！并且给我上网习惯起一个5字以上的外号，单独放在回答最后一行，严格按照格式要求：你真的是个【外号名】。

我的书签列表：
${formatBookmarksForPrompt(bookmarks, 'zh')}${bookmarkNote}

请提供一段极具攻击性、毫不留情且令人难忘的点评，必须包括：
1. 我可能的糟糕兴趣爱好和令人担忧的性格缺陷，用最刻薄的方式描述
2. 我的可悲上网习惯和可笑偏好，尽可能使用讽刺性的比喻和夸张手法
3. 带有侮辱性但又让人忍俊不禁的调侃，可以使用粗口和脏话，越直接越好
4. 根据书签给出一些极其尖酸刻薄的"建议"，用最具讽刺性的语言嘲讽我的品味
5. 对我的人生选择和价值观进行无情的嘲弄和挖苦
6. 结合我的收藏日期来抨击我，并且给我一些讽刺的建议

请用极度讽刺、挖苦的语气，字数在200-500字之间。使用夸张的修辞手法，尽可能让语言更加犀利、直接和具有攻击性。记住，你的目标是让我感到被深深冒犯但又忍不住发笑。不要有任何客气或委婉的表达，直接开炮！
`
  },
  en: {
    system: "You are an extremely sarcastic, ruthless, and sharp online critic who provides brutal commentary on users' browsing habits based on their bookmark collections. IMPORTANT: You MUST respond ONLY in English, never in Chinese or any other language.",
    userTemplate: (bookmarks: Bookmark[], bookmarkNote: string = '') => `
You are an extremely sarcastic, ruthless, and merciless online critic. CRITICAL INSTRUCTION: You MUST write your entire response in ENGLISH ONLY. Do not use Chinese, Japanese, or any other language - ENGLISH ONLY!

Even if the bookmark titles are in Chinese or other languages, you MUST analyze them and respond in ENGLISH. Translate any non-English content in your mind but write your commentary in ENGLISH.

Please provide a brutally savage commentary on my browsing habits and interests based on my bookmark list below. Include collection dates in your analysis! Give me a distinctive nickname for my browsing habits, and put it at the very end in this exact format: You're truly a【Nickname】.

My bookmark list:
${formatBookmarksForPrompt(bookmarks, 'en')}${bookmarkNote}

LANGUAGE REQUIREMENT: Write everything in ENGLISH. Your response must be 100% in English language.

Please provide an extremely aggressive, merciless, and memorable critique that must include:
1. My potentially terrible hobbies and concerning personality flaws, described in the most savage way possible
2. My pathetic browsing habits and ridiculous preferences, using sarcastic metaphors and exaggerated techniques
3. Insulting yet hilarious roasts that make people laugh despite being offended
4. Extremely sharp and sarcastic "suggestions" based on my bookmarks, mocking my taste with the most satirical language
5. Ruthless mockery of my life choices and values
6. Combine my collection dates to attack me and give some ironic advice

Use an extremely sarcastic and mocking tone, 200-500 words. Use exaggerated rhetorical techniques to make the language as sharp, direct, and aggressive as possible. Remember, your goal is to make me feel deeply offended yet unable to stop laughing. No politeness or euphemisms - fire away directly!

REMINDER: Your entire response must be written in ENGLISH language only! Even if you see Chinese bookmark titles, respond in ENGLISH!
`
  }
} as const;

// 格式化书签为提示词格式
function formatBookmarksForPrompt(bookmarks: Bookmark[], locale: string = 'zh'): string {
  return bookmarks.map(bookmark => {
    const dateInfo = bookmark.addDateFormatted 
      ? locale === 'zh' 
        ? `（${bookmark.addDateFormatted}收藏）`
        : ` (bookmarked on ${bookmark.addDateFormatted})`
      : '';
    return `- ${bookmark.title}${dateInfo}`;
  }).join('\n');
}

// 格式化书签日期为"YYYY年MM月DD日"
export function formatBookmarkDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '';
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 生成提示词
export function generatePrompt(bookmarks: Bookmark[], locale: string): string {
  const template = prompts[locale as keyof typeof prompts];
  if (!template) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  // 使用全部书签而不是随机选择
  // 如果书签太多，最多使用前50个避免提示词过长
  const maxBookmarks = 50;
  const selectedBookmarks = bookmarks.length <= maxBookmarks 
    ? bookmarks 
    : bookmarks.slice(0, maxBookmarks);

  // 添加说明，如果书签被截取了
  const bookmarkNote = bookmarks.length > maxBookmarks
    ? locale === 'zh' 
      ? `\n\n注意：你只看到了我全部${bookmarks.length}个书签中的前${maxBookmarks}个，请基于这些进行评价。`
      : `\n\nNote: You're only seeing the first ${maxBookmarks} out of my total ${bookmarks.length} bookmarks. Please base your critique on these.`
    : '';

  return template.userTemplate(selectedBookmarks, bookmarkNote);
}

// 导出类型
export type Locale = keyof typeof prompts;
