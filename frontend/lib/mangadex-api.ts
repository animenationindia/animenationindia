/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/mangadex-api.ts
// Free & Open MangaDex API for Real Chapter Tracking & External Reading Links

export interface MangaChapter {
  id: string;
  chapter: string;
  title: string;
  publishAt: string | null;
  readableUrl: string;
  scanlationGroup?: string;
}

const mangadexCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Search MangaDex by title and return MangaDex UUID
 */
export async function searchMangaDexId(title: string): Promise<string | null> {
  if (!title || !title.trim()) return null;
  const cleanTitle = title
    .replace(/\s*\(Novel\)/gi, '')
    .replace(/\s*\(Manhwa\)/gi, '')
    .replace(/\s*\(Manga\)/gi, '')
    .replace(/\s*Season\s*\d+/gi, '')
    .trim();

  const cacheKey = `md_search:${cleanTitle.toLowerCase()}`;
  const cached = mangadexCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(cleanTitle)}&limit=1`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'AnimeNationIndia/1.0' },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        const mangaId = json.data[0].id;
        mangadexCache.set(cacheKey, { data: mangaId, timestamp: Date.now() });
        return mangaId;
      }
    }
  } catch (err: any) {
    console.warn(`[MangaDex Search Error] for ${cleanTitle}:`, err?.message);
  }

  return null;
}

/**
 * Fetch English translated chapters for a MangaDex manga
 */
export async function getMangaDexChapters(title: string, limit = 60): Promise<MangaChapter[]> {
  const mangaId = await searchMangaDexId(title);
  if (!mangaId) return [];

  const cacheKey = `md_chapters:${mangaId}:${limit}`;
  const cached = mangadexCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `https://api.mangadex.org/manga/${mangaId}/feed?translatedLanguage[]=en&order[chapter]=desc&limit=${limit}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'AnimeNationIndia/1.0' },
      signal: AbortSignal.timeout(4500),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        const chapters: MangaChapter[] = json.data
          .filter((item: any) => item.attributes?.chapter)
          .map((item: any) => {
            const attr = item.attributes;
            const chNum = attr.chapter || '1';
            return {
              id: item.id,
              chapter: chNum,
              title: attr.title || `Chapter ${chNum}`,
              publishAt: attr.publishAt ? new Date(attr.publishAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null,
              readableUrl: attr.externalUrl || `https://mangadex.org/chapter/${item.id}`,
            };
          });

        // Deduplicate by chapter number
        const uniqueMap = new Map<string, MangaChapter>();
        chapters.forEach((ch) => {
          if (!uniqueMap.has(ch.chapter)) {
            uniqueMap.set(ch.chapter, ch);
          }
        });

        const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
          return parseFloat(b.chapter) - parseFloat(a.chapter);
        });

        mangadexCache.set(cacheKey, { data: sorted, timestamp: Date.now() });
        return sorted;
      }
    }
  } catch (err: any) {
    console.warn(`[MangaDex Chapters Error] for ID ${mangaId}:`, err?.message);
  }

  return [];
}
