

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  date: string;
  dateFormatted: string;
  snippet: string;
  fullContent: string;
  image: string;
  source: string;
  categories: string[];
  author: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80';

const RSS_FEEDS = [
  { url: 'https://myanimelist.net/rss/news.xml', source: 'MyAnimeList' },
  { url: 'https://animecorner.me/feed/', source: 'Anime Corner' },
];

// ── Helpers ──────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function getTagContent(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const plainRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const plainMatch = xml.match(plainRegex);
  if (plainMatch) return plainMatch[1].trim();

  return '';
}

function getAllTagContents(xml: string, tag: string): string[] {
  const results: string[] = [];
  const regex = new RegExp(`<${tag}[^>]*>\\s*(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))\\s*</${tag}>`, 'gi');
  let m;
  while ((m = regex.exec(xml)) !== null) {
    const val = (m[1] || m[2] || '').trim();
    if (val) results.push(val);
  }
  return results;
}

function extractImage(itemXml: string): string {
  // 1. <enclosure url="...">
  const enclosure = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/i);
  if (enclosure?.[1] && isImageUrl(enclosure[1])) return enclosure[1];

  // 2. <media:content url="..."> or <media:thumbnail url="...">
  const mediaAttr = itemXml.match(/<media:(?:content|thumbnail)[^>]+url=["']([^"']+)["']/i);
  if (mediaAttr?.[1]) return mediaAttr[1];

  // 2.5. MAL <media:thumbnail>URL</media:thumbnail>
  const mediaTag = itemXml.match(/<media:thumbnail[^>]*>\s*(https?:\/\/[^\s<]+)\s*<\/media:thumbnail>/i);
  if (mediaTag?.[1]) return mediaTag[1];

  // 3. <img src="..."> from content:encoded, content, or description
  const contentHtml = getTagContent(itemXml, 'content:encoded') || getTagContent(itemXml, 'content') || getTagContent(itemXml, 'description') || '';
  const imgs = [...contentHtml.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)];
  for (const img of imgs) {
    if (img[1] && isImageUrl(img[1]) && !img[1].includes('feeds.feedburner') && !img[1].includes('pixel') && !img[1].includes('1x1')) {
      return img[1];
    }
  }

  // 4. og:image or similar meta from content
  const ogMatch = contentHtml.match(/(?:og:image|twitter:image)[^"']*["']([^"']+)["']/i);
  if (ogMatch?.[1]) return ogMatch[1];

  return FALLBACK_IMAGE;
}

function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes('.jpg') || lower.includes('.jpeg') || lower.includes('.png') || lower.includes('.webp') || lower.includes('.gif') || lower.includes('image') || lower.includes('img') || lower.includes('cdn');
}

function cleanSnippet(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 350);
}

function cleanFullContent(html: string): string {
  if (!html) return '';
  // Keep paragraph structure but clean up
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .trim();
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function extractAuthor(itemXml: string): string {
  const dcCreator = getTagContent(itemXml, 'dc:creator');
  if (dcCreator) return dcCreator;
  const author = getTagContent(itemXml, 'author');
  if (author) return author;
  return '';
}

function extractCategories(itemXml: string): string[] {
  const cats = getAllTagContents(itemXml, 'category');
  // Filter out very long categories or URLs
  return cats.filter(c => c.length < 40 && !c.startsWith('http')).slice(0, 3);
}

// ── Main Parser ──────────────────────────────────────────

function parseRssXml(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemBlocks = xml.split(/<item>/i).slice(1);

  for (const block of itemBlocks) {
    const itemXml = block.split(/<\/item>/i)[0];
    if (!itemXml) continue;

    const title = getTagContent(itemXml, 'title');
    const link = getTagContent(itemXml, 'link') || getTagContent(itemXml, 'guid');
    const pubDate = getTagContent(itemXml, 'pubDate') || getTagContent(itemXml, 'dc:date');
    const description = getTagContent(itemXml, 'description');
    const contentEncoded = getTagContent(itemXml, 'content:encoded');

    if (!title) continue;

    const categories = extractCategories(itemXml);
    // Assign fallback categories based on content analysis
    if (categories.length === 0) {
      if (/trailer|preview|pv/i.test(title)) categories.push('Trailers');
      else if (/season|episode|recap/i.test(title)) categories.push('Latest News');
      else if (/cast|staff|announce/i.test(title)) categories.push('Announcements');
      else if (/review|feature|column/i.test(title)) categories.push('Features');
      else categories.push('Latest News');
    }

    items.push({
      id: slugify(title),
      title,
      link: link || '#',
      date: pubDate || new Date().toISOString(),
      dateFormatted: formatDate(pubDate || new Date().toISOString()),
      snippet: cleanSnippet(description || contentEncoded),
      fullContent: cleanFullContent(contentEncoded || description || ''),
      image: extractImage(itemXml),
      source,
      categories,
      author: extractAuthor(itemXml),
    });
  }

  return items;
}

// ── Public API ───────────────────────────────────────────

async function scrapeOgImage(url: string): Promise<string | null> {
  if (!url || url === '#' || !url.startsWith('http')) return null;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 1800); // 1.8s timeout
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      next: { revalidate: 86400 } // Cache this specific page's og:image for 24 hours
    });
    
    clearTimeout(id);
    if (!res.ok) return null;
    
    const html = await res.text();
    const ogRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i;
    let match = html.match(ogRegex);
    if (!match) {
      const ogRegex2 = /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i;
      match = html.match(ogRegex2);
    }
    
    return match?.[1] || null;
  } catch (error) {
    console.error(`[scrapeOgImage] Failed for ${url}:`, error);
    return null;
  }
}

export async function getNews(): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const res = await fetch(feed.url, {
        next: { revalidate: 1800 },
        headers: {
          'User-Agent': 'Anime Nation India/1.0 (News Aggregator)',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        },
      });
      if (!res.ok) {
        console.error(`[getNews] HTTP ${res.status} from ${feed.source}`);
        continue;
      }
      const xml = await res.text();
      allItems.push(...parseRssXml(xml, feed.source));
    } catch (error) {
      console.error(`[getNews] Failed to fetch ${feed.source}:`, error);
    }
  }

  // De-duplicate by title similarity
  const seen = new Set<string>();
  const unique = allItems.filter(item => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort newest first
  unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Scrape images concurrently for items that have the fallback image
  // We limit to the top 50 items to prevent overload
  const itemsToScrape = unique.slice(0, 50);
  await Promise.all(
    itemsToScrape.map(async (item) => {
      if (item.image === FALLBACK_IMAGE) {
        const scrapedImage = await scrapeOgImage(item.link);
        if (scrapedImage) {
          item.image = scrapedImage;
        }
      }
    })
  );

  return unique;
}

export function getNewsById(items: NewsItem[], id: string): NewsItem | undefined {
  return items.find(item => item.id === id);
}

export function getNewsByCategory(items: NewsItem[], category: string): NewsItem[] {
  return items.filter(item =>
    item.categories.some(c => c.toLowerCase() === category.toLowerCase())
  );
}
