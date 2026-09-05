import { getNews, getNewsByCategory } from '../lib/getNews';
import { getArticles, ArticleItem } from '../lib/articles';
import { SpotlightCard, SidebarCard, SectionHeroCard, SectionSmallCard, GridCard } from './NewsCards';
import { Newspaper, ArrowRight, Sparkles, PenSquare, Flame } from 'lucide-react';
import Link from 'next/link';

function SectionHeader({
  title,
  icon,
  filterHref,
  filterLabel,
}: {
  title: string;
  icon?: React.ReactNode;
  filterHref?: string;
  filterLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
      </div>
      {filterHref && (
        <Link
          href={filterHref}
          className="flex items-center gap-2 text-xs md:text-sm font-semibold text-white border border-[#2A2B30] hover:border-[#ff4dd2] px-4 py-2 rounded-full transition-colors hover:text-[#ff4dd2]"
        >
          <ArrowRight size={14} />
          {filterLabel || 'View All'}
        </Link>
      )}
    </div>
  );
}

function mapArticleToCardProps(art: ArticleItem) {
  const d = new Date(art.publishedAt);
  return {
    id: art.slug,
    title: art.title,
    date: art.publishedAt,
    dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    snippet: art.snippet,
    image: art.coverImage,
    source: 'Anime Nation India',
    categories: [art.category, ...(art.tags || []).slice(0, 2)],
    author: art.author,
    views: art.views,
    originalPost: true,
  };
}

export default async function NewsContent() {
  // Fetch custom original articles and RSS feed concurrently
  const [customArticles, rssNews] = await Promise.all([
    getArticles({ limit: 12 }).catch(() => [] as ArticleItem[]),
    getNews().catch(() => []),
  ]);

  const customCardItems = customArticles.map(mapArticleToCardProps);

  if (customCardItems.length === 0 && rssNews.length === 0) {
    return (
      <div className="text-center py-32 border border-dashed border-[#2A2B30] rounded-xl bg-[#121326]/30 w-full relative z-10">
        <h3 className="text-xl text-white mb-2">Unable to load news</h3>
        <p className="text-[#a0a0a0]">The news feeds are temporarily unavailable. Please try again later.</p>
      </div>
    );
  }

  // Spotlight: Prioritize custom original articles, fallback to RSS
  const spotlightSource = customCardItems.length > 0
    ? [...customCardItems, ...rssNews].slice(0, 2)
    : rssNews.slice(0, 2);

  // Top Stories / Trending
  const topStories = customCardItems.length > 2
    ? [...customCardItems.slice(2, 5), ...rssNews.slice(0, 3)]
    : rssNews.slice(2, 8);

  // Latest News
  const latestItems = [...customCardItems.slice(2), ...rssNews].slice(0, 20);
  const latestHero = latestItems[0] || rssNews[0];
  const latestSmall = latestItems.slice(1, 5);

  // Announcements & Features from RSS
  const announcements = getNewsByCategory(rssNews, 'Announcements');
  const announcementHero = announcements[0] || rssNews[8];
  const announcementSmall = announcements.length > 1 ? announcements.slice(1, 5) : rssNews.slice(9, 13);

  const features = getNewsByCategory(rssNews, 'Features');
  const featureHero = features[0] || rssNews[13];
  const featureSmall = features.length > 1 ? features.slice(1, 5) : rssNews.slice(14, 18);

  // More Stories (all remaining)
  const moreStories = [...customCardItems.slice(5), ...rssNews.slice(18)];

  // Persistent sidebar
  const sidebarItems = rssNews.slice(3, 12);

  return (
    <div className="w-full relative z-10">
      {/* ═══ Page Header with Discover Badge & Publish Button ═══ */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#2A2B30]/40 pb-8">
        <div className="flex items-center gap-3">
          <div className="bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 p-2.5 rounded-xl">
            <Newspaper size={26} className="text-[#ff4dd2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                Anime <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255,77,210,0.6)]">Magazine &amp; News</span>
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-[#ff4dd2]/10 text-[#ff4dd2] border border-[#ff4dd2]/30 px-2 py-0.5 rounded-full">
                <Sparkles size={11} /> Verified Publisher
              </span>
            </div>
            <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base mt-1">
              Original breaking coverage, official trailer breakdowns, seasonal rankings, and real-time updates from Japan and worldwide.
            </p>
          </div>
        </div>

        {/* Quick Links: RSS & Write News */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="https://animenationindia.onrender.com/api/news/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#888] hover:text-white border border-[#2A2B30] hover:border-[#444] px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5"
            title="Google News Compliant RSS 2.0 Feed"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            RSS Feed
          </a>
          <Link
            href="/admin/publish"
            className="text-xs font-bold text-white bg-gradient-to-r from-[#ff4dd2] to-[#c822a0] hover:from-[#ff66da] hover:to-[#e028b5] shadow-[0_0_15px_rgba(255,77,210,0.35)] px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
          >
            <PenSquare size={13} />
            Publish Article
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: SPOTLIGHT + TOP STORIES
      ═══════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Spotlight (Featured Articles) */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white italic flex items-center gap-2">
                <Sparkles size={18} className="text-[#ff4dd2]" />
                Spotlight &amp; Featured
              </h2>
              <span className="text-xs text-[#888]">Updated in real-time</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spotlightSource.map((item, i) => (
                <SpotlightCard key={`spotlight-${i}`} {...item} />
              ))}
            </div>
          </div>

          {/* Right: Top Stories */}
          <div className="lg:col-span-4">
            <div className="bg-[#121326]/50 backdrop-blur-xl border border-[#2A2B30]/40 rounded-xl p-4 md:p-5 h-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
                  <Flame size={17} className="text-[#ff4dd2]" />
                  Trending Headlines
                </h2>
              </div>
              <div className="flex flex-col">
                {topStories.map((item, i) => (
                  <SidebarCard key={`top-${i}`} {...item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT + PERSISTENT SIDEBAR
      ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Scrolling content sections */}
        <div className="lg:col-span-8 space-y-16">
          {/* ─── LATEST NEWS ─── */}
          <section>
            <SectionHeader title="Latest Releases &amp; Coverage" filterHref="/news/latest" filterLabel="All Latest" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Big hero card */}
              <div className="md:col-span-1 md:row-span-2">
                {latestHero && <SectionHeroCard {...latestHero} />}
              </div>
              {/* Smaller cards */}
              {latestSmall.map((item, i) => (
                <SectionSmallCard key={`latest-${i}`} {...item} />
              ))}
            </div>
          </section>

          {/* ─── ANNOUNCEMENTS ─── */}
          {announcementHero && (
            <section>
              <SectionHeader title="Industry Announcements" filterHref="/news/announcements" filterLabel="More Announcements" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-1 md:row-span-2">
                  <SectionHeroCard {...announcementHero} />
                </div>
                {announcementSmall.map((item, i) => (
                  <SectionSmallCard key={`announce-${i}`} {...item} />
                ))}
              </div>
            </section>
          )}

          {/* ─── FEATURES & EDITORIALS ─── */}
          {featureHero && (
            <section>
              <SectionHeader title="Features &amp; Reviews" filterHref="/news/features" filterLabel="All Features" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-1 md:row-span-2">
                  <SectionHeroCard {...featureHero} />
                </div>
                {featureSmall.map((item, i) => (
                  <SectionSmallCard key={`feature-${i}`} {...item} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: Persistent Sidebar */}
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <div className="bg-[#121326]/50 backdrop-blur-xl border border-[#2A2B30]/40 rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-[#ff4dd2] rounded-full inline-block shadow-[0_0_8px_rgba(255,77,210,0.6)]" />
                  Global Anime Wire
                </h3>
                <Link
                  href="/news/trending"
                  className="flex items-center gap-1.5 text-[10px] font-semibold text-[#ff4dd2] hover:text-white uppercase tracking-wider transition-colors"
                >
                  View All <ArrowRight size={10} />
                </Link>
              </div>
              <div className="flex flex-col">
                {sidebarItems.map((item, i) => (
                  <SidebarCard key={`sidebar-${i}`} {...item} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION: MORE STORIES GRID
      ═══════════════════════════════════════════════════════ */}
      {moreStories.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="More Stories &amp; Reports" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {moreStories.map((item, i) => (
              <GridCard key={`grid-${i}`} {...item} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

