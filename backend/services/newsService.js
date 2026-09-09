// backend/services/newsService.js
// Aggregated RSS News Service (MyAnimeList + Anime Corner)

const Parser = require('rss-parser');
const parser = new Parser({ timeout: 5000 });

const memoryCache = { data: [], timestamp: 0 };
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getLatestNews(limit = 20) {
  if (memoryCache.data.length > 0 && (Date.now() - memoryCache.timestamp < CACHE_TTL)) {
    return memoryCache.data.slice(0, limit);
  }

  const feeds = [
    { url: 'https://myanimelist.net/rss/news.xml', source: 'MyAnimeList' },
    { url: 'https://animecorner.me/feed/', source: 'Anime Corner' }
  ];

  const articles = [];
  await Promise.all(
    feeds.map(async feed => {
      try {
        const parsed = await parser.parseURL(feed.url);
        (parsed.items || []).forEach(item => {
          let thumbnail = null;
          if (item.enclosure?.url) thumbnail = item.enclosure.url;
          else if (item['media:content']?.$.url) thumbnail = item['media:content'].$.url;
          else if (item.content) {
            const imgMatch = item.content.match(/<img[^>]+src=['"]([^'"]+)['"]/i);
            if (imgMatch) thumbnail = imgMatch[1];
          }

          articles.push({
            id: item.guid || item.link,
            title: item.title,
            link: item.link,
            pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            contentSnippet: item.contentSnippet || item.summary || '',
            thumbnail: thumbnail || '/placeholder-poster.png',
            source: feed.source
          });
        });
      } catch {}
    })
  );

  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  
  if (articles.length > 0) {
    memoryCache.data = articles;
    memoryCache.timestamp = Date.now();
  }

  return memoryCache.data.slice(0, limit);
}

module.exports = {
  getLatestNews
};
