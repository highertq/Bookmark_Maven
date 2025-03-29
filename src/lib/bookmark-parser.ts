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

interface BookmarkNode {
  type: 'folder' | 'bookmark';
  title?: string;
  url?: string;
  icon?: string;
  addDate?: number;
  lastModified?: number;
  children?: BookmarkNode[];
}

/**
 * 解析书签HTML文件
 * @param html 书签HTML内容
 * @returns 解析后的书签树
 */
export function parseBookmarks(html: string): BookmarkNode {
  console.log("开始解析书签HTML...");
  
  // 创建一个根节点
  const root: BookmarkNode = {
    type: 'folder',
    title: 'Root',
    children: []
  };

  try {
    // 创建一个DOM解析器
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 调试信息，查看解析到的HTML结构
    // console.log("HTML解析结果:", {
    //   title: doc.title,
    //   hasDL: !!doc.querySelector('dl'),
    //   hasH3: !!doc.querySelector('h3'),
    //   hasA: !!doc.querySelector('a')
    // });

    // 查找所有DL元素（不同浏览器可能有不同的结构）
    const dlElements = doc.querySelectorAll('dl');
    if (dlElements.length === 0) {
      console.warn("未找到DL元素，尝试其他解析方法");
      // 如果没有DL元素，尝试直接查找所有A元素
      const links = doc.querySelectorAll('a');
      parseLinksDirectly(links, root);
    } else {
      // 解析第一个DL元素
      parseDL(dlElements[0], root);
    }

    return root;
  } catch (error) {
    console.error("解析书签时出错:", error);
    return root;
  }
}

/**
 * 解析DL元素
 * @param dl DL元素
 * @param parent 父节点
 */
function parseDL(dl: Element, parent: BookmarkNode) {
  let currentFolder: BookmarkNode | null = null;
  
  // 遍历DL的子元素
  for (let i = 0; i < dl.children.length; i++) {
    const child = dl.children[i];
    
    if (child.tagName === 'DT') {
      // DT可能包含H3（文件夹）或A（书签）
      const h3 = child.querySelector('h3');
      const a = child.querySelector('a');
      
      if (h3) {
        // 创建新文件夹
        currentFolder = {
          type: 'folder',
          title: h3.textContent || 'Unnamed Folder',
          addDate: parseInt(h3.getAttribute('add_date') || h3.getAttribute('ADDED') || '0'),
          lastModified: parseInt(h3.getAttribute('last_modified') || '0'),
          children: []
        };
        parent.children?.push(currentFolder);
      } else if (a) {
        // 创建书签
        const bookmark: BookmarkNode = {
          type: 'bookmark',
          title: a.textContent || 'Unnamed Bookmark',
          url: a.getAttribute('href') || '',
          icon: a.getAttribute('icon') || undefined
        };
        
        // 获取添加日期
        let addDate = a.getAttribute('add_date') || a.getAttribute('ADDED') || a.getAttribute('time_added') || null;
        if (addDate) {
          let addDateNum = parseInt(addDate);
          // 处理不同浏览器的时间戳格式
          if (addDateNum > 9999999999) {
            addDateNum = Math.floor(addDateNum / 1000); // 毫秒转秒
          }
          bookmark.addDate = addDateNum;
        }
        
        // 将书签添加到当前文件夹或父节点
        if (currentFolder) {
          currentFolder.children?.push(bookmark);
        } else {
          parent.children?.push(bookmark);
        }
      }
      
      // 查找DL子元素（子文件夹或书签）
      const nestedDL = child.querySelector('dl');
      if (nestedDL && currentFolder) {
        parseDL(nestedDL, currentFolder);
      }
    }
  }
}

/**
 * 直接解析链接元素（备选方法）
 * @param links A元素集合
 * @param parent 父节点
 */
function parseLinksDirectly(links: NodeListOf<Element>, parent: BookmarkNode) {
  for (const link of links) {
    if (link.tagName === 'A' && link.hasAttribute('href')) {
      const bookmark: BookmarkNode = {
        type: 'bookmark',
        title: link.textContent || 'Unnamed Bookmark',
        url: link.getAttribute('href') || '',
        icon: link.getAttribute('icon') || undefined
      };
      
      // 尝试获取添加日期的各种可能属性
      const dateAttrs = ['add_date', 'ADDED', 'time_added', 'ADD_DATE', 'dateAdded'];
      for (const attr of dateAttrs) {
        if (link.hasAttribute(attr)) {
          let addDateNum = parseInt(link.getAttribute(attr) || '0');
          if (addDateNum > 9999999999) {
            addDateNum = Math.floor(addDateNum / 1000); // 毫秒转秒
          }
          bookmark.addDate = addDateNum;
          break;
        }
      }
      
      parent.children?.push(bookmark);
    }
  }
}

/**
 * 提取所有书签
 */
export function extractAllBookmarks(bookmarkTree: BookmarkNode, category: string = ''): Bookmark[] {
  const bookmarks: Bookmark[] = [];
  
  // 处理当前节点
  if (bookmarkTree.type === 'bookmark' && bookmarkTree.url) {
    // 处理时间戳格式
    let addDate = bookmarkTree.addDate;
    let formattedDate = undefined;
    
    if (addDate) {
      // 确保时间戳在合理范围内
      if (addDate > 9999999999) {
        addDate = Math.floor(addDate / 1000);
      }
      
      // 格式化日期
      try {
        const date = new Date(addDate * 1000);
        formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
      } catch (e) {
        console.error("日期格式化失败:", e);
      }
    }
    
    const bookmark: Bookmark = {
      title: bookmarkTree.title || 'Untitled',
      url: bookmarkTree.url,
      icon: bookmarkTree.icon,
      category: category,
      addDate: addDate,
      addDateFormatted: formattedDate
    };
    
    bookmarks.push(bookmark);
  }
  
  // 递归处理子节点
  if (bookmarkTree.children && bookmarkTree.children.length > 0) {
    const newCategory = bookmarkTree.type === 'folder' && bookmarkTree.title 
      ? (category ? `${category} > ${bookmarkTree.title}` : bookmarkTree.title)
      : category;
      
    for (const child of bookmarkTree.children) {
      const childBookmarks = extractAllBookmarks(child, newCategory);
      bookmarks.push(...childBookmarks);
    }
  }
  
  return bookmarks;
}

/**
 * 查找最早收藏的书签
 */
export function findEarliestBookmark(bookmarks: Bookmark[]): { bookmark: Bookmark | null, daysAgo: number | null } {
  if (!bookmarks || bookmarks.length === 0) {
    return { bookmark: null, daysAgo: null };
  }
  
  // 调试信息
  // console.log("书签总数:", bookmarks.length);
  // console.log("有时间戳的书签数:", bookmarks.filter(b => b.addDate).length);
  
  // 过滤出有添加日期的书签
  const bookmarksWithDate = bookmarks.filter(b => 
    b.addDate !== undefined && 
    b.addDate !== null && 
    !isNaN(Number(b.addDate)) && 
    Number(b.addDate) > 0
  );
  
  if (bookmarksWithDate.length === 0) {
    console.warn("没有找到带有有效时间戳的书签");
    return { bookmark: null, daysAgo: null };
  }
  
  // 找出最早的书签
  const earliestBookmark = bookmarksWithDate.reduce((earliest, current) => {
    if (!earliest.addDate) return current;
    if (!current.addDate) return earliest;
    return current.addDate < earliest.addDate ? current : earliest;
  }, bookmarksWithDate[0]);
  
  // console.log("最早的书签:", {
  //   title: earliestBookmark.title,
  //   url: earliestBookmark.url,
  //   addDate: earliestBookmark.addDate,
  //   formattedDate: earliestBookmark.addDateFormatted
  // });
  
  // 计算距今天数
  const now = new Date();
  const bookmarkDate = new Date(Number(earliestBookmark.addDate) * 1000);
  const diffTime = Math.abs(now.getTime() - bookmarkDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return { bookmark: earliestBookmark, daysAgo: diffDays };
}

/**
 * 书签统计分析
 */
export function analyzeBookmarks(bookmarks: Bookmark[]) {
  // 分类统计
  const categories: { [key: string]: number } = {};
  bookmarks.forEach(bookmark => {
    const category = bookmark.category || '未分类';
    categories[category] = (categories[category] || 0) + 1;
  });
  
  // 域名统计
  const domains: { [key: string]: number } = {};
  bookmarks.forEach(bookmark => {
    try {
      const url = new URL(bookmark.url);
      const domain = url.hostname;
      domains[domain] = (domains[domain] || 0) + 1;
    } catch (e) {
      // 忽略无效URL
    }
  });
  
  // 时间分布统计
  const years: { [key: number]: number } = {};
  bookmarks.forEach(bookmark => {
    if (bookmark.addDate) {
      const date = new Date(bookmark.addDate * 1000);
      const year = date.getFullYear();
      if (year > 1990 && year < 2100) { // 过滤明显错误的年份
        years[year] = (years[year] || 0) + 1;
      }
    }
  });
  
  // 排序结果
  const topCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
    
  const topDomains = Object.entries(domains)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
    
  const yearDistribution = Object.entries(years)
    .sort((a, b) => Number(a[0]) - Number(b[0]));
    
  return {
    totalBookmarks: bookmarks.length,
    topCategories,
    topDomains,
    yearDistribution,
    categories,
    domains,
    years
  };
}

/**
 * 查找"最满"的分类
 */
export function findFullestCategory(bookmarks: Bookmark[]): { category: string, count: number, bookmarks: Bookmark[] } | null {
  if (!bookmarks || bookmarks.length === 0) {
    return null;
  }
  
  // 按分类分组
  const categoryMap: { [key: string]: Bookmark[] } = {};
  bookmarks.forEach(bookmark => {
    const category = bookmark.category || '未分类';
    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }
    categoryMap[category].push(bookmark);
  });
  
  // 找出书签最多的分类
  let fullestCategory = '';
  let maxCount = 0;
  
  for (const [category, bookmarkList] of Object.entries(categoryMap)) {
    if (bookmarkList.length > maxCount) {
      maxCount = bookmarkList.length;
      fullestCategory = category;
    }
  }
  
  if (!fullestCategory) {
    return null;
  }
  
  return {
    category: fullestCategory,
    count: maxCount,
    bookmarks: categoryMap[fullestCategory]
  };
}

/**
 * 查找重复的书签
 */
export function findDuplicateBookmarks(bookmarks: Bookmark[]): { [url: string]: Bookmark[] } {
  const urlMap: { [url: string]: Bookmark[] } = {};
  
  // 按URL分组
  bookmarks.forEach(bookmark => {
    // 标准化URL，忽略协议和末尾斜杠
    let normalizedUrl = bookmark.url
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
      
    if (!urlMap[normalizedUrl]) {
      urlMap[normalizedUrl] = [];
    }
    urlMap[normalizedUrl].push(bookmark);
  });
  
  // 过滤出重复的URL
  const duplicates: { [url: string]: Bookmark[] } = {};
  for (const [url, bookmarkList] of Object.entries(urlMap)) {
    if (bookmarkList.length > 1) {
      duplicates[url] = bookmarkList;
    }
  }
  
  return duplicates;
}