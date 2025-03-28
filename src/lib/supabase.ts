/**
 * Supabase客户端配置
 */
import { createClient } from '@supabase/supabase-js';

// 数据库表结构定义 - 简化版
export type Tables = {
  bookmarks: {
    Row: {
      id: string;
      title: string;
      url: string;
      icon: string | null;
      category: string | null;
      created_at: string;
    };
    Insert: Omit<Tables['bookmarks']['Row'], 'id' | 'created_at'>;
    Update: Partial<Omit<Tables['bookmarks']['Row'], 'id' | 'created_at'>>;
  };
};

// 环境变量类型检查
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('缺少NEXT_PUBLIC_SUPABASE_URL环境变量');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('缺少NEXT_PUBLIC_SUPABASE_ANON_KEY环境变量');
}

// 创建Supabase客户端
export const supabase = createClient<Tables>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

/**
 * 保存书签到数据库
 */
export async function saveBookmark(bookmark: Tables['bookmarks']['Insert']) {
  return supabase.from('bookmarks').insert(bookmark);
}

/**
 * 获取所有书签
 */
export async function getAllBookmarks() {
  return supabase
    .from('bookmarks')
    .select('*')
    .order('created_at', { ascending: false });
}

/**
 * 按分类获取书签
 */
export async function getBookmarksByCategory(category: string) {
  return supabase
    .from('bookmarks')
    .select('*')
    .eq('category', category)
    .order('created_at', { ascending: false });
}

/**
 * 获取所有分类
 */
export async function getAllCategories() {
  return supabase
    .from('bookmarks')
    .select('category')
    .not('category', 'is', null)
    .order('category')
    .then(({ data }) => {
      // 提取唯一的分类
      const categories = new Set<string>();
      data?.forEach(bookmark => {
        if (bookmark.category) categories.add(bookmark.category);
      });
      return Array.from(categories);
    });
}