import { getNews, getNewsByCategory } from '../lib/getNews';
import { SpotlightCard, SidebarCard, SectionHeroCard, SectionSmallCard, GridCard } from './NewsCards';
import { Newspaper, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function SectionHeader({ title, filterHref, filterLabel }: { title: string; filterHref?: string; filterLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h2>
      {filterHref && (
        <Link
          href={filterHref}
          className="flex items-center gap-2 text-sm font-semibold text-white border border-[#2A2B30] hover:border-[#ff4dd2] px-4 py-2 rounded-full transition-colors hover:text-[#ff4dd2]"
        >
          <ArrowRight size={14} />
          {filterLabel || 'View All'}
        </Link>
      )}
    </div>
  );
}

export default async function NewsContent() {
  const allNews = await getNews();

  if (allNews.length === 0) {
    return (
      <div className="text-center py-32 border border-dashed border-[#2A2B30] rounded-xl bg-[#121326]/30 w-full relative z-10">
        <h3 className="text-xl text-white mb-2">Unable to load news</h3>
        <p className="text-[#a0a0a0]">The news feeds are temporarily unavailable. Please try again later.</p>
      </div>
    );
  }

  // Slice data for sections
  const spotlight = allNews.slice(0, 2);
  const topStories = allNews.slice(2, 8);

  // Category-based sections
  const latestNewsItems = allNews.slice(0, 20);
  const latestHero = latestNewsItems[0];
  const latestSmall = latestNewsItems.slice(1, 5);
  
  const announcements = getNewsByCategory(allNews, 'Announcements');
  const announcementHero = announcements[0] || allNews[8];
  const announcementSmall = (announcements.length > 1 ? announcements.slice(1, 5) : allNews.slice(9, 13));

  const features = getNewsByCategory(allNews, 'Features');
  const featureHero = features[0] || allNews[13];
  const featureSmall = (features.length > 1 ? features.slice(1, 5) : allNews.slice(14, 18));

  // More Stories — everything else
  const moreStories = allNews.slice(18);

  // Right sidebar — persistent sticky list
  const sidebarItems = allNews.slice(3, 12);

  return (
    <div className="w-full relative z-10">
      {/* ═══ Page Header ═══ */}
      <div className="mb-10 flex items-center gap-3">
        <div className="bg-[#ff4dd2]/10 border border-[#ff4dd2]/30 p-2.5 rounded-xl">
          <Newspaper size={24} className="text-[#ff4dd2]" />
        </div>
        <div>
          <h1 className="text-4xl md:text-5xl font-bebas text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] mb-2">
            Anime <span className="text-[#ff4dd2] drop-shadow-[0_0_10px_rgba(255, 77, 210,0.6)]">News</span>
          </h1>
          <p className="text-[#a0a0a0] max-w-2xl text-sm md:text-base">
            Your daily dose of Otaku culture. Real-time headlines, announcements, and features from the global anime industry.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: SPOTLIGHT + TOP STORIES
      ═══════════════════════════════════════════════════════ */}
      <section className="mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Spotlight */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white italic">Spotlight</h2>
              <Link
                href="/news/spotlight"
                className="flex items-center gap-2 text-xs font-semibold text-white border border-[#2A2B30] hover:border-[#ff4dd2] px-3 py-1.5 rounded-full transition-colors hover:text-[#ff4dd2]"
              >
                <ArrowRight size={12} />
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {spotlight.map((item, i) => (
                <SpotlightCard key={`spotlight-${i}`} {...item} />
              ))}
            </div>
          </div>

          {/* Right: Top Stories */}
          <div className="lg:col-span-4">
            <div className="bg-[#121326]/50 backdrop-blur-xl border border-[#2A2B30]/40 rounded-xl p-4 md:p-5 h-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Top Stories</h2>
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
            <SectionHeader title="Latest News" filterHref="/news/latest" filterLabel="All Latest News" />
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
              <SectionHeader title="Announcements" filterHref="/news/announcements" filterLabel="More Announcements" />
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

          {/* ─── FEATURES ─── */}
          {featureHero && (
            <section>
              <SectionHeader title="Features" filterHref="/news/features" filterLabel="All Features" />
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
                  <span className="w-1.5 h-5 bg-[#ff4dd2] rounded-full inline-block shadow-[0_0_8px_rgba(255, 77, 210,0.6)]" />
                  Trending
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
          <SectionHeader title="More Stories" />
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
