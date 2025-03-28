/**
 * 书签解析模块
 * 用于解析浏览器导出的HTML格式书签文件
 */

export interface Bookmark {
  title: string;
  url: string;
  icon?: string;
  category?: string;
  addDate?: number; // Unix时间戳
  addDateFormatted?: string; // 格式化后的日期
}

export interface BookmarkFolder {
  title: string;
  items: (Bookmark | BookmarkFolder)[];
}

/**
 * 解析书签HTML文件
 * @param html 书签HTML内容
 * @returns 解析后的书签树结构
 */
export function parseBookmarks(html: string): BookmarkFolder {
  // 创建一个临时的DOM元素来解析HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // 获取所有的DL元素（书签文件夹）
  const rootDL = doc.querySelector('DL');
  
  if (!rootDL) {
    return { title: 'Bookmarks', items: [] };
  }
  
  return parseFolder(rootDL, 'Bookmarks');
}

/**
 * 解析书签文件夹
 * @param dlElement DL元素（书签文件夹）
 * @param folderTitle 文件夹标题
 * @returns 解析后的书签文件夹
 */
function parseFolder(dlElement: Element, folderTitle: string): BookmarkFolder {
  const items: (Bookmark | BookmarkFolder)[] = [];
  let currentElement = dlElement.firstElementChild;
  
  while (currentElement) {
    // 如果是DT元素
    if (currentElement.tagName === 'DT') {
      // 检查是否包含A元素（书签）
      const aElement = currentElement.querySelector('A');
      if (aElement) {
        // 提取书签信息
        const addDateStr = aElement.getAttribute('ADD_DATE');
        const addDate = addDateStr ? parseInt(addDateStr, 10) : undefined;
        
        // 转换时间戳为可读日期格式
        let addDateFormatted;
        if (addDate) {
          const date = new Date(addDate * 1000); // 转换为毫秒
          addDateFormatted = date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
        
        const bookmark: Bookmark = {
          title: aElement.textContent || '',
          url: aElement.getAttribute('HREF') || '',
          icon: aElement.getAttribute('ICON') || undefined,
          addDate,
          addDateFormatted
        };
        items.push(bookmark);
      }
      
      // 检查是否包含H3元素（文件夹标题）和DL元素（子文件夹）
      const h3Element = currentElement.querySelector('H3');
      const subDLElement = currentElement.querySelector('DL');
      
      if (h3Element && subDLElement) {
        const subFolder = parseFolder(subDLElement, h3Element.textContent || 'Unnamed Folder');
        items.push(subFolder);
      }
    }
    
    currentElement = currentElement.nextElementSibling;
  }
  
  return {
    title: folderTitle,
    items,
  };
}

/**
 * 提取所有书签（扁平化处理）
 * @param bookmarkTree 书签树结构
 * @returns 扁平化的书签数组
 */
export function extractAllBookmarks(bookmarkTree: BookmarkFolder): Bookmark[] {
  const bookmarks: Bookmark[] = [];
  
  function traverse(folder: BookmarkFolder, category: string = '') {
    for (const item of folder.items) {
      if ('url' in item) {
        // 是书签
        bookmarks.push({
          ...item,
          category: category || folder.title,
        });
      } else {
        // 是文件夹
        const newCategory = category ? `${category} > ${item.title}` : item.title;
        traverse(item, newCategory);
      }
    }
  }
  
  traverse(bookmarkTree);
  return bookmarks;
}

/**
 * 检测重复URL
 * @param bookmarks 书签数组
 * @returns 重复URL的书签数组
 */
export function findDuplicateUrls(bookmarks: Bookmark[]): Bookmark[][] {
  const urlMap = new Map<string, Bookmark[]>();
  
  // 按URL分组
  bookmarks.forEach(bookmark => {
    const url = bookmark.url;
    if (!urlMap.has(url)) {
      urlMap.set(url, []);
    }
    urlMap.get(url)!.push(bookmark);
  });
  
  // 过滤出重复的URL
  return Array.from(urlMap.values()).filter(group => group.length > 1);
}

/**
 * 查找最早收藏的书签
 * @param bookmarks 书签数组
 * @returns 最早收藏的书签信息
 */
export function findEarliestBookmark(bookmarks: Bookmark[]): { bookmark: Bookmark | null, daysAgo: number | null } {
  if (!bookmarks || bookmarks.length === 0) {
    return { bookmark: null, daysAgo: null };
  }
  
  // 过滤出有添加日期的书签
  const bookmarksWithDate = bookmarks.filter(b => b.addDate !== undefined);
  
  if (bookmarksWithDate.length === 0) {
    return { bookmark: null, daysAgo: null };
  }
  
  // 找出最早的书签
  const earliestBookmark = bookmarksWithDate.reduce((earliest, current) => {
    if (!earliest.addDate) return current;
    if (!current.addDate) return earliest;
    return current.addDate < earliest.addDate ? current : earliest;
  }, bookmarksWithDate[0]);
  
  // 计算距今天数
  const now = new Date();
  const bookmarkDate = new Date(earliestBookmark.addDate! * 1000);
  const diffTime = Math.abs(now.getTime() - bookmarkDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return { bookmark: earliestBookmark, daysAgo: diffDays };
}