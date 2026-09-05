/* eslint-disable @next/next/no-img-element */
import { Metadata } from 'next';
import { getArticleBySlug, ArticleItem } from '../../../lib/articles';
import { getNews, getNewsById } from '../../../lib/getNews';
import ShareButtons from '../../../components/ShareButtons';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  User,
  Newspaper,
  Eye,
  Calendar,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 60; // 1-minute dynamic revalidation

function calculateReadingTime(text: string): string {
  const words = (text || '').replace(/<[^>]*>?/gm, '').trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = 'https://www.animenationindia.online';

  // 1. Try fetching from custom MongoDB articles
  const { article } = await getArticleBySlug(slug);
  if (article) {
    const title = `${article.title} | Anime Nation India News`;
    const description = article.snippet;
    const url = `${siteUrl}/news/${article.slug}`;
    const imageUrl = article.coverImage;

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title,
        description,
        url,
        siteName: 'Anime Nation India',
        type: 'article',
        publishedTime: article.publishedAt,
        modifiedTime: article.updatedAt || article.publishedAt,
        authors: [article.author],
        tags: [article.category, ...(article.tags || [])],
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 675,
            alt: article.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  }

  // 2. Fallback to RSS articles
  const allNews = await getNews();
  const rssArticle = getNewsById(allNews, slug);
  if (rssArticle) {
    return {
      title: `${rssArticle.title} | Anime Nation India`,
      description: rssArticle.snippet || '',
      openGraph: {
        title: rssArticle.title,
        description: rssArticle.snippet,
        images: [{ url: rssArticle.image }],
      },
    };
  }

  return {
    title: 'Article Not Found | Anime Nation India',
    description: 'The requested anime article could not be found.',
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const siteUrl = 'https://www.animenationindia.online';

  // 1. Check custom MongoDB articles first
  const { article, related } = await getArticleBySlug(slug);

  if (article) {
    const articleUrl = `${siteUrl}/news/${article.slug}`;
    const readingTime = calculateReadingTime(article.content);
    const pubDate = new Date(article.publishedAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    // Google NewsArticle JSON-LD structured data for Google Discover
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: article.snippet,
      image: [article.coverImage],
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      author: [
        {
          '@type': 'Person',
          name: article.author,
          url: siteUrl,
        },
      ],
      publisher: {
        '@type': 'Organization',
        name: 'Anime Nation India',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/ani-logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': articleUrl,
      },
    };

    return (
      <div className="bg-[#000000] min-h-screen pt-28 lg:pt-32 pb-20">
        {/* Google News Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1100px]">
          {/* Breadcrumbs Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-[#888] mb-6 flex-wrap"
          >
            <Link href="/" className="hover:text-[#ff4dd2] transition-colors">
              Home
            </Link>
            <ChevronRight size={12} className="text-[#444]" />
            <Link href="/news" className="hover:text-[#ff4dd2] transition-colors">
              News
            </Link>
            <ChevronRight size={12} className="text-[#444]" />
            <span className="text-[#c0c0c0] font-medium">{article.category}</span>
          </nav>

          <article>
            {/* Category & Verified Badge */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#ff4dd2] to-[#c822a0] text-white px-3 py-1 rounded-md shadow-[0_0_12px_rgba(255,77,210,0.35)]">
                {article.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#121326] text-[#ff4dd2] border border-[#ff4dd2]/30 px-2.5 py-0.5 rounded-md">
                <Sparkles size={11} /> Original Editorial
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight mb-5">
              {article.title}
            </h1>

            {/* Sub-headline / Snippet */}
            {article.snippet && (
              <p className="text-base sm:text-lg text-[#b8b8b8] leading-relaxed mb-6 font-normal">
                {article.snippet}
              </p>
            )}

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[#2A2B30]/50 mb-8">
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-[#888]">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff4dd2] to-[#7928ca] flex items-center justify-center text-white font-bold text-xs">
                    {article.author ? article.author.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <span className="font-semibold text-white block">{article.author}</span>
                    <span className="text-[10px] text-[#666]">Editorial Staff</span>
                  </div>
                </div>

                <span className="hidden sm:inline">•</span>

                {/* Published Date */}
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#ff4dd2]" />
                  {pubDate}
                </span>

                <span className="hidden sm:inline">•</span>

                {/* Reading Time */}
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#ff4dd2]" />
                  {readingTime}
                </span>

                <span className="hidden sm:inline">•</span>

                {/* View Counter */}
                <span className="flex items-center gap-1.5 text-[#ff4dd2] font-semibold">
                  <Eye size={14} />
                  {article.views.toLocaleString()} views
                </span>
              </div>

              {/* Social Share Buttons */}
              <ShareButtons url={articleUrl} title={article.title} />
            </div>

            {/* High-Resolution 16:9 Cover Image (1200px Google Discover target) */}
            <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-10 border border-[#2A2B30]/60 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
              <img
                src={article.coverImage}
                alt={article.title}
                loading="eager"
                fetchPriority="high"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Full Article Content */}
            <div className="max-w-[860px] mx-auto">
              <div
                className="prose prose-invert prose-lg max-w-none
                  prose-p:text-[#d4d4d4] prose-p:leading-[1.85] prose-p:mb-6 prose-p:text-[17px]
                  prose-a:text-[#ff4dd2] prose-a:font-semibold prose-a:underline hover:prose-a:text-[#ff77de]
                  prose-strong:text-white prose-strong:font-bold
                  prose-h2:text-white prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4 prose-h2:tracking-tight
                  prose-h3:text-[#ff4dd2] prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                  prose-img:rounded-xl prose-img:border prose-img:border-[#2A2B30]/60 prose-img:my-8
                  prose-blockquote:border-l-4 prose-blockquote:border-l-[#ff4dd2] prose-blockquote:bg-[#121326]/60 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:italic prose-blockquote:text-[#e0e0e0]
                  prose-ul:text-[#c0c0c0] prose-ol:text-[#c0c0c0] prose-li:my-1.5
                  prose-hr:border-[#2A2B30]/60 prose-hr:my-10
                "
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {/* Tags Section */}
              {article.tags && article.tags.length > 0 && (
                <div className="mt-12 pt-6 border-t border-[#2A2B30]/50 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[#888] uppercase tracking-wider font-semibold">Tags:</span>
                  {article.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-[#121326] border border-[#2A2B30] text-[#a0a0a0] hover:text-[#ff4dd2] hover:border-[#ff4dd2]/40 px-2.5 py-1 rounded-md transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author Info Box */}
              <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-[#121326] to-[#0d0e1c] border border-[#2A2B30]/60 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff4dd2] to-[#7928ca] flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-[0_0_15px_rgba(255,77,210,0.4)]">
                  {article.author ? article.author.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <h4 className="text-white font-bold text-base flex items-center gap-2">
                    {article.author}
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#ff4dd2]/15 text-[#ff4dd2] px-2 py-0.5 rounded">
                      Editor
                    </span>
                  </h4>
                  <p className="text-xs text-[#999] mt-1 leading-relaxed">
                    Official reporting and in-depth anime coverage for Anime Nation India. Covering the latest seasonal releases, manga chapters, studio announcements, and Japanese pop culture.
                  </p>
                </div>
              </div>

              {/* Secondary Share Bar */}
              <div className="mt-8 flex items-center justify-between gap-4 p-4 rounded-xl bg-[#121326]/30 border border-[#2A2B30]/30 flex-wrap">
                <span className="text-sm font-semibold text-white">Enjoyed this article? Share it with friends:</span>
                <ShareButtons url={articleUrl} title={article.title} />
              </div>
            </div>
          </article>

          {/* ═══ Related Articles Section ═══ */}
          {related && related.length > 0 && (
            <section className="mt-16 pt-12 border-t border-[#2A2B30]/50">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <BookOpen size={20} className="text-[#ff4dd2]" />
                Related Coverage
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {related.map((rel, i) => (
                  <Link
                    key={`related-${i}`}
                    href={`/news/${rel.slug}`}
                    className="group block rounded-xl overflow-hidden border border-[#2A2B30]/40 hover:border-[#ff4dd2]/60 transition-all bg-[#121326]/40 hover:shadow-[0_0_20px_rgba(255,77,210,0.15)]"
                  >
                    <div className="relative w-full aspect-[16/9] overflow-hidden">
                      <img
                        src={rel.coverImage}
                        alt={rel.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-[#ff4dd2] text-white px-2 py-0.5 rounded-sm">
                        {rel.category}
                      </span>
                      <h3 className="text-sm font-semibold text-white line-clamp-2 mt-2 group-hover:text-[#ff4dd2] transition-colors">
                        {rel.title}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-[#777] mt-2">
                        <span className="flex items-center gap-1">
                          <Eye size={11} className="text-[#ff4dd2]" />
                          {(rel.views || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  // 2. Fallback to RSS/External Articles
  const allNews = await getNews();
  const rssArticle = getNewsById(allNews, slug);

  if (!rssArticle) {
    notFound();
  }

  const relatedRss = allNews
    .filter((item) => item.id !== rssArticle.id)
    .filter(
      (item) =>
        item.source === rssArticle.source ||
        item.categories.some((c) => rssArticle.categories.includes(c))
    )
    .slice(0, 6);

  return (
    <div className="bg-[#000000] min-h-screen pt-32 lg:pt-36 pb-16">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1200px]">
        {/* Back Button */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-[#a0a0a0] hover:text-[#ff4dd2] transition-colors mb-6 mt-4"
        >
          <ArrowLeft size={16} />
          Back to News
        </Link>

        {/* Article Header */}
        <article>
          <div className="flex flex-wrap gap-2 mb-4">
            {rssArticle.categories.map((cat, i) => (
              <span
                key={i}
                className="text-[10px] font-bold uppercase tracking-widest bg-[#ff4dd2] text-white px-3 py-1 rounded-sm"
              >
                {cat}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-white leading-tight mb-5">
            {rssArticle.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#888] mb-8 pb-6 border-b border-[#2A2B30]/50">
            <span className="font-bold text-[#ff4dd2]">{rssArticle.source}</span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              {rssArticle.dateFormatted}
            </span>
            {rssArticle.author && (
              <span className="flex items-center gap-1.5">
                <User size={13} />
                {rssArticle.author}
              </span>
            )}
            <a
              href={rssArticle.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#ff4dd2] hover:text-[#ff77de] transition-colors ml-auto"
            >
              <ExternalLink size={13} />
              Original Source
            </a>
          </div>

          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-8 border border-[#2A2B30]/30">
            <img
              src={rssArticle.image}
              alt={rssArticle.title}
              loading="eager"
              fetchPriority="high"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="max-w-[800px] mx-auto">
            {rssArticle.fullContent ? (
              <div
                className="prose prose-invert prose-lg max-w-none
                  prose-p:text-[#d0d0d0] prose-p:leading-relaxed prose-p:mb-5
                  prose-a:text-[#ff4dd2] prose-a:no-underline hover:prose-a:text-[#ff77de]
                  prose-strong:text-white
                  prose-h2:text-white prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-white prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-img:rounded-xl prose-img:border prose-img:border-[#2A2B30]/30
                  prose-blockquote:border-l-[#ff4dd2] prose-blockquote:bg-[#121326]/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                  prose-li:text-[#c0c0c0]
                  prose-figure:my-8
                "
                dangerouslySetInnerHTML={{ __html: rssArticle.fullContent }}
              />
            ) : (
              <div className="space-y-6">
                <p className="text-[#d0d0d0] text-lg leading-relaxed">{rssArticle.snippet}</p>
                <div className="bg-[#121326]/60 border border-[#2A2B30]/40 rounded-xl p-6 text-center">
                  <Newspaper size={32} className="text-[#ff4dd2] mx-auto mb-3" />
                  <p className="text-[#a0a0a0] mb-4">Read the full article on the original source</p>
                  <a
                    href={rssArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#ff4dd2] hover:bg-[#ff66da] text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} />
                    Read Full Article
                  </a>
                </div>
              </div>
            )}
          </div>
        </article>

        {relatedRss.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[#2A2B30]/40">
            <h2 className="text-2xl font-bold text-white mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedRss.map((item, i) => (
                <Link
                  key={`related-${i}`}
                  href={`/news/${item.id}`}
                  className="group block rounded-xl overflow-hidden border border-[#2A2B30]/30 hover:border-[#ff4dd2]/50 transition-all bg-[#121326]/30"
                >
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.categories.slice(0, 2).map((cat, ci) => (
                        <span
                          key={ci}
                          className="text-[9px] font-bold uppercase tracking-widest bg-[#ff4dd2] text-white px-2 py-0.5 rounded-sm"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-[#ff4dd2] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#666] mt-1.5">{item.dateFormatted}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
