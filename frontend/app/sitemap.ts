import { MetadataRoute } from 'next';
import { getNews } from '../lib/getNews';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.animenationindia.online';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ওয়েবসাইটের সমস্ত পাবলিক পেজ (প্রাইভেট/লগইন পেজ বাদে)
  const staticRoutes = [
    '',
    '/home',
    '/browse/all',
    '/browse/manga',
    '/browse/calendar',
    '/browse/genres',
    '/browse/news',
    '/search',
    '/schedule',
    '/genres',
    '/genre',
    '/types',
    '/trailers',
    '/news',
    '/news/announcements',
    '/news/features',
    '/news/latest',
    '/news/spotlight',
    '/news/trending',
    '/announcements',
    '/new',
    '/new/last-24-hours',
    '/new/past-week',
    '/new/past-month',
    '/newest',
    '/ongoing',
    '/popular',
    '/upcoming',
    '/trending',
    '/dubbed',
    '/simulcast',
    '/characters',
    '/staff',
    '/reviews',
    '/forums',
    '/forums/general',
    '/forums/manga-novels',
    '/forums/recommendations',
    '/forums/trending',
    '/faq',
    '/help',
    '/contact',
    '/feedback',
    '/privacy',
    '/terms',
    '/guidelines',
    '/cookies',
    '/adchoices',
    '/disclaimer',
    '/do-not-sell',
    '/settings',
    '/watchlist',
    '/auth'
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' || route === '/home' ? 1.0 : 0.8,
  }));

  // এসইও-এর জন্য ডাইনামিকভাবে টপ ৫০টি অ্যানিমের লিংক
  let dynamicAnimeRoutes: MetadataRoute.Sitemap = [];
  try {
    const query = `
      query {
        Page(page: 1, perPage: 50) {
          media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) {
            id
            updatedAt
          }
        }
      }
    `;
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 86400 } // ২৪ ঘণ্টা পর পর আপডেট হবে
    });
    
    if (response.ok) {
      const data = await response.json();
      const animeList = data.data?.Page?.media || [];
      dynamicAnimeRoutes = animeList.map((anime: any) => ({
        url: `${SITE_URL}/series/${anime.id}`,
        lastModified: new Date(anime.updatedAt * 1000),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));
    }
  } catch (error) {
    console.error("Error fetching anime for sitemap:", error);
  }

  // এসইও-এর জন্য ডাইনামিকভাবে টপ ৫০টি ম্যাঙ্গার লিংক
  let dynamicMangaRoutes: MetadataRoute.Sitemap = [];
  try {
    const query = `
      query {
        Page(page: 1, perPage: 50) {
          media(sort: POPULARITY_DESC, type: MANGA, isAdult: false) {
            id
            updatedAt
          }
        }
      }
    `;
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      next: { revalidate: 86400 } // ২৪ ঘণ্টা পর পর আপডেট হবে
    });
    
    if (response.ok) {
      const data = await response.json();
      const mangaList = data.data?.Page?.media || [];
      dynamicMangaRoutes = mangaList.map((manga: any) => ({
        url: `${SITE_URL}/manga/${manga.id}`,
        lastModified: new Date(manga.updatedAt * 1000),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
      }));
    }
  } catch (error) {
    console.error("Error fetching manga for sitemap:", error);
  }

  // ডাইনামিকভাবে লেটেস্ট নিউজ আর্টিকেলগুলোর লিংক
  let dynamicNewsRoutes: MetadataRoute.Sitemap = [];
  try {
    const newsList = await getNews();
    if (newsList && newsList.length > 0) {
      dynamicNewsRoutes = newsList.slice(0, 50).map((article) => ({
        url: `${SITE_URL}/news/${article.id}`,
        lastModified: new Date(article.date),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error("Error fetching news for sitemap:", error);
  }

  return [...staticRoutes, ...dynamicAnimeRoutes, ...dynamicMangaRoutes, ...dynamicNewsRoutes];
}

