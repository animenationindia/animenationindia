import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://animenationindia.online';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ওয়েবসাইটের সমস্ত পাবলিক পেজ (প্রাইভেট/লগইন পেজ বাদে)
  const staticRoutes = [
    '',
    '/home',
    '/browse/all',
    '/search',
    '/schedule',
    '/genres',
    '/trailers',
    '/news',
    '/news/announcements',
    '/new/last-24-hours',
    '/new/past-week',
    '/new/past-month',
    '/upcoming',
    '/trending',
    '/dubbed',
    '/characters',
    '/staff',
    '/reviews',
    '/forums/general',
    '/forums/recommendations',
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
    '/auth/signin',
    '/auth/signup'
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' || route === '/home' ? 1 : 0.8,
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

  return [...staticRoutes, ...dynamicAnimeRoutes];
}
