import { MetadataRoute } from 'next';
import { getNews } from '../lib/getNews';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.animenationindia.online';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // All public website pages (excluding private/auth pages)
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
    '/popular-characters',
    '/top-characters',
    '/people',
    '/popular-staff',
    '/top-staff',
    '/voice-actors',
    '/studios',
    '/rankings',
    '/top-rated',
    '/most-popular',
    '/seasons',
    '/season/summer-2024',
    '/season/spring-2024',
    '/season/winter-2024',
    '/season/fall-2023',
    '/themes',
    '/recommendations',
    '/community',
    '/forum',
    '/reviews',
    '/recent-reviews',
    '/user-reviews',
    '/privacy',
    '/terms',
    '/dmca',
    '/contact',
    '/about',
    '/faq'
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' || route === '/home' ? 1.0 : 0.8,
  }));

  // Dynamically fetch top 50 anime links for SEO
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
      next: { revalidate: 86400 } // Revalidate every 24 hours
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

  // Dynamically fetch top 50 manga links for SEO
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
      next: { revalidate: 86400 } // Revalidate every 24 hours
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

  // Dynamically fetch latest news article links for SEO
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
