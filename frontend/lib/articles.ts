import { BACKEND_URL } from './config';

export interface ArticleItem {
  _id: string;
  title: string;
  slug: string;
  snippet: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: string;
  authorAvatar?: string;
  views: number;
  featured: boolean;
  publishedAt: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ArticlesResponse {
  success: boolean;
  data: ArticleItem[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
}

export interface SingleArticleResponse {
  success: boolean;
  data?: ArticleItem;
  related?: ArticleItem[];
  message?: string;
}

export interface ArticleQuery {
  category?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Fetch list of custom articles from MongoDB Atlas
 */
export async function getArticles(query: ArticleQuery = {}): Promise<ArticleItem[]> {
  try {
    const params = new URLSearchParams();
    if (query.category && query.category !== 'All') params.set('category', query.category);
    if (query.search) params.set('search', query.search);
    if (query.featured) params.set('featured', 'true');
    if (query.page) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));

    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${BACKEND_URL}/api/articles${qs}`, {
      next: { revalidate: 120 }, // 2-minute cache for fast response
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      console.error(`[getArticles] HTTP ${res.status} from backend`);
      return [];
    }

    const data: ArticlesResponse = await res.json();
    return data.success && Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('[getArticles] Failed to fetch articles:', error);
    return [];
  }
}

/**
 * Fetch a single custom article by slug and automatically increment views
 */
export async function getArticleBySlug(slug: string): Promise<{ article: ArticleItem | null; related: ArticleItem[] }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/articles/${encodeURIComponent(slug.toLowerCase())}`, {
      next: { revalidate: 60 }, // 1-minute cache
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      return { article: null, related: [] };
    }

    const data: SingleArticleResponse = await res.json();
    return {
      article: data.data || null,
      related: data.related || [],
    };
  } catch (error) {
    console.error(`[getArticleBySlug] Failed to fetch slug "${slug}":`, error);
    return { article: null, related: [] };
  }
}

/**
 * Create a new custom article in MongoDB Atlas (Admin Passcode required)
 */
export async function createArticle(
  articleData: Partial<ArticleItem> & { adminPasscode: string }
): Promise<{ success: boolean; data?: ArticleItem; message?: string }> {
  try {
    const { adminPasscode, ...payload } = articleData;
    const res = await fetch(`${BACKEND_URL}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': adminPasscode,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error?.message || 'Network error while creating article' };
  }
}

/**
 * Delete an article by ID (Admin Passcode required)
 */
export async function deleteArticle(
  id: string,
  adminPasscode: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/articles/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-passcode': adminPasscode,
      },
    });

    const result = await res.json();
    return result;
  } catch (error: any) {
    return { success: false, message: error?.message || 'Network error while deleting article' };
  }
}
