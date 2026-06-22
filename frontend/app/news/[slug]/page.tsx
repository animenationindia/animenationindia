import { getNews, getNewsById } from '../../../lib/getNews';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock, ExternalLink, User, Newspaper } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 1800;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const allNews = await getNews();
  const article = getNewsById(allNews, slug);
  return {
    title: article ? `${article.title} | Anime Nation India` : 'Article Not Found',
    description: article?.snippet || '',
  };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const allNews = await getNews();
  const article = getNewsById(allNews, slug);

  if (!article) {
    notFound();
  }

  // Related articles: same source or similar categories
  const related = allNews
    .filter(item => item.id !== article.id)
    .filter(item =>
      item.source === article.source ||
      item.categories.some(c => article.categories.includes(c))
    )
    .slice(0, 6);

  return (
    <div className="bg-[#000000] min-h-screen pt-32 lg:pt-36 lg:pt-36 pb-16">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1200px]">

        {/* Back Button */}
        <Link
          href="/news"
          className="inline-flex items-center gap-2 text-sm text-[#a0a0a0] hover:text-[#ff4dd2] transition-colors mb-6 mt-4"
        >
          <ArrowLeft size={16} />
          Back to News
        </Link>

        {/* ═══ Article Header ═══ */}
        <article>
          {/* Category Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {article.categories.map((cat, i) => (
              <span
                key={i}
                className="text-[10px] font-bold uppercase tracking-widest bg-[#ff4dd2] text-white px-3 py-1 rounded-sm"
              >
                {cat}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-white leading-tight mb-5">
            {article.title}
          </h1>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#888] mb-8 pb-6 border-b border-[#2A2B30]/50">
            <span className="font-bold text-[#ff4dd2]">{article.source}</span>
            <span className="flex items-center gap-1.5"><Clock size={13} />{article.dateFormatted}</span>
            {article.author && (
              <span className="flex items-center gap-1.5"><User size={13} />{article.author}</span>
            )}
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[#ffd54a] hover:text-[#ff4dd2] transition-colors ml-auto"
            >
              <ExternalLink size={13} />
              Original Source
            </a>
          </div>

          {/* Hero Image */}
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-8 border border-[#2A2B30]/30">
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              className="object-cover"
              priority
              unoptimized
            />
          </div>

          {/* Article Body */}
          <div className="max-w-[800px] mx-auto">
            {article.fullContent ? (
              <div
                className="prose prose-invert prose-lg max-w-none
                  prose-p:text-[#d0d0d0] prose-p:leading-relaxed prose-p:mb-5
                  prose-a:text-[#ffd54a] prose-a:no-underline hover:prose-a:text-[#ff4dd2]
                  prose-strong:text-white
                  prose-h2:text-white prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-white prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                  prose-img:rounded-xl prose-img:border prose-img:border-[#2A2B30]/30
                  prose-blockquote:border-l-[#ff4dd2] prose-blockquote:bg-[#121326]/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                  prose-li:text-[#c0c0c0]
                  prose-figure:my-8
                "
                dangerouslySetInnerHTML={{ __html: article.fullContent }}
              />
            ) : (
              <div className="space-y-6">
                <p className="text-[#d0d0d0] text-lg leading-relaxed">{article.snippet}</p>
                <div className="bg-[#121326]/60 border border-[#2A2B30]/40 rounded-xl p-6 text-center">
                  <Newspaper size={32} className="text-[#ff4dd2] mx-auto mb-3" />
                  <p className="text-[#a0a0a0] mb-4">Read the full article on the original source</p>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#ff4dd2] hover:bg-[#ff4dd2] text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} />
                    Read Full Article
                  </a>
                </div>
              </div>
            )}
          </div>
        </article>

        {/* ═══ Related Articles ═══ */}
        {related.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[#2A2B30]/40">
            <h2 className="text-2xl font-bold text-white mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((item, i) => (
                <Link
                  key={`related-${i}`}
                  href={`/news/${item.id}`}
                  className="group block rounded-xl overflow-hidden border border-[#2A2B30]/30 hover:border-[#ff4dd2]/50 transition-all bg-[#121326]/30"
                >
                  <div className="relative w-full aspect-[16/9] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {item.categories.slice(0, 2).map((cat, ci) => (
                        <span key={ci} className="text-[9px] font-bold uppercase tracking-widest bg-[#ff4dd2] text-white px-2 py-0.5 rounded-sm">{cat}</span>
                      ))}
                    </div>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-[#ffd54a] transition-colors">{item.title}</h3>
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
