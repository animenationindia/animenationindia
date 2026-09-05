/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PenSquare,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ExternalLink,
  ArrowLeft,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Send,
  Loader2,
} from 'lucide-react';
import { createArticle, deleteArticle, ArticleItem } from '../../../lib/articles';
import { BACKEND_URL } from '../../../lib/config';

const CATEGORIES = ['Anime', 'Manga', 'Movies', 'Reviews', 'Industry', 'News'];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function AdminPublishPage() {
  // Passcode state
  const [adminPasscode, setAdminPasscode] = useState('ani2026admin');

  // Article form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugCustom, setIsSlugCustom] = useState(false);
  const [category, setCategory] = useState('Anime');
  const [author, setAuthor] = useState('Anime Nation India Editorial');
  const [coverImage, setCoverImage] = useState('');
  const [snippet, setSnippet] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [featured, setFeatured] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Recent articles list
  const [recentArticles, setRecentArticles] = useState<ArticleItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // Load saved passcode from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ani_admin_passcode');
      if (saved) setAdminPasscode(saved);
    }
  }, []);

  // Update slug when title changes unless user manually edited slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isSlugCustom) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlug(slugify(e.target.value));
    setIsSlugCustom(true);
  };

  // Fetch recent articles
  const fetchRecentArticles = async () => {
    setLoadingArticles(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/articles?limit=20`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRecentArticles(data.data);
      }
    } catch (err) {
      console.error('Failed to load recent articles', err);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    fetchRecentArticles();
  }, []);

  // Submit new article
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setPublishedSlug(null);

    if (!title.trim()) {
      setErrorMsg('Please enter an article title.');
      return;
    }
    if (!coverImage.trim()) {
      setErrorMsg('Please enter a cover image URL (1200px+ recommended for Google Discover).');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Please write the article content.');
      return;
    }

    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('ani_admin_passcode', adminPasscode);
      }

      const cleanTags = tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await createArticle({
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        category,
        author: author.trim() || 'Anime Nation India Editorial',
        coverImage: coverImage.trim(),
        snippet: snippet.trim() || undefined,
        content: content.trim(),
        tags: cleanTags,
        featured,
        adminPasscode,
      });

      if (res.success && res.data) {
        setSuccessMsg('Article published successfully! It is now live in Google News RSS & website.');
        setPublishedSlug(res.data.slug);
        // Clear form
        setTitle('');
        setSlug('');
        setIsSlugCustom(false);
        setCoverImage('');
        setSnippet('');
        setContent('');
        setTags('');
        setFeatured(false);
        // Refresh articles list
        fetchRecentArticles();
      } else {
        setErrorMsg(res.message || 'Failed to publish article. Please check your admin passcode.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected network error.');
    } finally {
      setLoading(false);
    }
  };

  // Delete article
  const handleDelete = async (id: string, artTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${artTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await deleteArticle(id, adminPasscode);
      if (res.success) {
        setRecentArticles((prev) => prev.filter((a) => a._id !== id));
      } else {
        alert(res.message || 'Failed to delete article.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error deleting article');
    }
  };

  return (
    <div className="bg-[#000000] min-h-screen pt-28 lg:pt-32 pb-24 text-white">
      <div className="container mx-auto px-4 lg:px-12 w-full max-w-[1200px]">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#2A2B30]/50">
          <div>
            <Link
              href="/news"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#a0a0a0] hover:text-[#ff4dd2] transition-colors mb-3"
            >
              <ArrowLeft size={14} /> Back to News Magazine
            </Link>
            <h1 className="text-3xl md:text-4xl font-bebas text-white uppercase tracking-wide flex items-center gap-3">
              <PenSquare className="text-[#ff4dd2]" size={32} />
              News Publisher &amp; Editorial Desk
            </h1>
            <p className="text-[#888] text-xs sm:text-sm mt-1">
              Publish rich anime articles with automatic Google Discover optimization, JSON-LD schema, and live RSS 2.0 feed sync.
            </p>
          </div>

          <div className="hidden sm:block text-right">
            <span className="inline-flex items-center gap-1.5 text-xs bg-[#121326] border border-[#ff4dd2]/30 text-[#ff4dd2] px-3 py-1.5 rounded-full font-semibold">
              <Sparkles size={12} /> Google News Ready
            </span>
          </div>
        </div>

        {/* Feedback Alert Banners */}
        {successMsg && (
          <div className="mb-8 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="text-green-300 font-semibold">{successMsg}</p>
              {publishedSlug && (
                <div className="mt-2">
                  <Link
                    href={`/news/${publishedSlug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-md transition-colors"
                  >
                    View Live Article <ExternalLink size={12} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300 font-semibold">{errorMsg}</p>
          </div>
        )}

        {/* Two-Column Editor Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form (8 Cols) */}
          <form onSubmit={handlePublish} className="lg:col-span-8 space-y-6">
            {/* Passcode Security */}
            <div className="p-4 rounded-xl bg-[#121326]/60 border border-[#2A2B30]/60">
              <label className="text-xs font-bold text-[#b0b0b0] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <KeyRound size={13} className="text-[#ff4dd2]" /> Admin Passcode
              </label>
              <input
                type="password"
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full bg-[#050716] border border-[#2A2B30] focus:border-[#ff4dd2] text-sm text-white px-3.5 py-2.5 rounded-lg outline-none transition-colors"
                required
              />
              <span className="text-[11px] text-[#666] mt-1 block">
                Default: <code className="text-[#ff4dd2]">ani2026admin</code> (Saved securely in your browser session)
              </span>
            </div>

            {/* Title & Slug */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#b0b0b0] uppercase tracking-wider block mb-2">
                  Article Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="e.g. Solo Leveling Season 3 Officially Confirmed with Teaser Visual"
                  className="w-full bg-[#121326]/60 border border-[#2A2B30] focus:border-[#ff4dd2] text-base text-white px-4 py-3 rounded-xl outline-none transition-colors font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#888] flex items-center justify-between mb-1.5">
                  <span>URL Slug (Search-Engine Friendly):</span>
                  <span className="text-[10px] text-[#555]">auto-generated</span>
                </label>
                <div className="flex items-center gap-2 bg-[#050716] border border-[#2A2B30] rounded-lg px-3 py-2 text-xs text-[#888]">
                  <span className="text-[#555]">animenationindia.online/news/</span>
                  <input
                    type="text"
                    value={slug}
                    onChange={handleSlugChange}
                    placeholder="article-slug-url"
                    className="flex-1 bg-transparent text-[#ff4dd2] outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Category & Author & Featured */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#b0b0b0] uppercase tracking-wider block mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#121326]/60 border border-[#2A2B30] focus:border-[#ff4dd2] text-sm text-white px-3.5 py-2.5 rounded-lg outline-none transition-colors"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#121326] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-[#b0b0b0] uppercase tracking-wider block mb-2">
                  Author Byline
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Anime Nation India Editorial"
                  className="w-full bg-[#121326]/60 border border-[#2A2B30] focus:border-[#ff4dd2] text-sm text-white px-3.5 py-2.5 rounded-lg outline-none transition-colors"
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-[#ff4dd2] focus:ring-0 bg-[#050716] border-[#2A2B30]"
                  />
                  <span className="text-xs font-semibold text-white flex items-center gap-1">
                    <Sparkles size={12} className="text-[#ff4dd2]" /> Pin to Featured Hero
                  </span>
                </label>
              </div>
            </div>

            {/* Cover Image URL */}
            <div>
              <label className="text-xs font-bold text-[#b0b0b0] uppercase tracking-wider flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-[#ff4dd2]" /> Cover Image URL (1200px+ High-Res) *
                </span>
                <span className="text-[10px] text-[#ff4dd2]">Required for Google Discover</span>
              </label>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/... or official visual image URL"
                className="w-full bg-[#121326]/60 border border-[#2A2B30] focus:border-[#ff4dd2] text-sm text-white px-4 py-2.5 rounded-lg outline-none transition-colors"
                required
              />
            </div>

            {/* Short Snippet */}
            <div>
              <label className="text-xs font-bold text-[#b0b0b0] uppercase tracking-wider block mb-2">
                Short Summary / Lead Excerpt (Google Meta Description)
              </label>
              <textarea
                rows={2}
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                placeholder="Brief 1-2 sentence hook describing the key announcement..."
                className="w-full bg-[#121326]/60 border border-[#2A2B30] focus:border-[#ff4dd2] text-sm text-white px-4 py-2.5 rounded-lg outline-none transition-colors leading-relaxed"
              />
            </div>

            {/* Rich Content Body */}
            <div>
              <label className="text-xs font-bold text-[#b0b0b0] uppercase tracking-wider flex items-center justify-between mb-2">
                <span>Article Body (HTML / Markdown paragraphs) *</span>
                <span className="text-[10px] text-[#888]">Supports &lt;p&gt;, &lt;h2&gt;, &lt;blockquote&gt;, &lt;strong&gt;, &lt;ul&gt;</span>
              </label>
              <textarea
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`<p>Write the full anime story here. You can write simple text or format with HTML tags:</p>

<h2>Official Announcement Details</h2>
<p>Aniplex has officially announced the upcoming season will premiere worldwide...</p>

<blockquote>"We are thrilled to bring the next chapter of the journey to anime fans everywhere."</blockquote>

<p>Stay tuned for more updates!</p>`}
                className="w-full bg-[#121326]/60 border border-[#2A2B30] focus:border-[#ff4dd2] text-sm text-white p-4 rounded-xl outline-none transition-colors font-mono leading-relaxed"
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs font-bold text-[#b0b0b0] uppercase tracking-wider block mb-2">
                Tags (Comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="solo-leveling, anime, season-3, crunchyroll, studio-a1"
                className="w-full bg-[#121326]/60 border border-[#2A2B30] focus:border-[#ff4dd2] text-sm text-white px-4 py-2.5 rounded-lg outline-none transition-colors"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-[#ff4dd2] to-[#c822a0] hover:from-[#ff66da] hover:to-[#e028b5] shadow-[0_0_25px_rgba(255,77,210,0.4)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Publishing to Google &amp; Website...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Publish Article Live
                </>
              )}
            </button>
          </form>

          {/* Right Column: Live Image Preview & Guidelines (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Cover Preview */}
            <div className="bg-[#121326]/50 border border-[#2A2B30]/60 rounded-xl p-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                <Eye size={14} className="text-[#ff4dd2]" /> Cover Image Preview
              </h3>
              {coverImage ? (
                <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-[#2A2B30] bg-[#050716]">
                  <img
                    src={coverImage}
                    alt="Preview"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[16/9] rounded-lg border border-dashed border-[#2A2B30] flex flex-col items-center justify-center text-[#666] text-xs text-center p-4">
                  <ImageIcon size={24} className="mb-2 text-[#444]" />
                  Enter a cover image URL on the left to see live 16:9 preview
                </div>
              )}
            </div>

            {/* Google Discover Checklist */}
            <div className="bg-[#121326]/50 border border-[#2A2B30]/60 rounded-xl p-5 text-xs space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-[#ff4dd2]">
                <Sparkles size={14} /> Google Discover Secrets
              </h3>
              <ul className="space-y-2 text-[#a0a0a0]">
                <li className="flex items-start gap-2">
                  <span className="text-[#ff4dd2] font-bold">✓</span>
                  <span>Use high-resolution 16:9 images (minimum 1200px width).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff4dd2] font-bold">✓</span>
                  <span>Write catchy, non-clickbait titles that explain the anime news clearly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff4dd2] font-bold">✓</span>
                  <span>Articles are automatically tagged with official Google <code className="text-[#ff4dd2]">NewsArticle</code> structured data.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff4dd2] font-bold">✓</span>
                  <span>Syncs automatically to your Google News RSS feed at <code className="text-white">/api/news/feed.xml</code>.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ═══ Published Articles Manager ═══ */}
        <section className="mt-20 pt-10 border-t border-[#2A2B30]/60">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers size={22} className="text-[#ff4dd2]" />
              Manage Published Articles ({recentArticles.length})
            </h2>
            <button
              onClick={fetchRecentArticles}
              disabled={loadingArticles}
              className="text-xs text-[#a0a0a0] hover:text-white border border-[#2A2B30] hover:border-[#444] px-3 py-1.5 rounded-lg transition-colors"
            >
              {loadingArticles ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>

          {recentArticles.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#2A2B30] rounded-xl text-[#777] text-sm">
              No articles published yet. Publish your first article above!
            </div>
          ) : (
            <div className="space-y-3">
              {recentArticles.map((art) => (
                <div
                  key={art._id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#121326]/40 border border-[#2A2B30]/40 hover:border-[#ff4dd2]/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={art.coverImage}
                      alt={art.title}
                      className="w-16 h-12 rounded-lg object-cover border border-[#2A2B30] flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-[#ff4dd2] text-white px-2 py-0.5 rounded-sm">
                          {art.category}
                        </span>
                        {art.featured && (
                          <span className="text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                            Featured
                          </span>
                        )}
                        <span className="text-[10px] text-[#666]">
                          {new Date(art.publishedAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-[#ff4dd2] font-semibold">
                          👁 {(art.views || 0).toLocaleString()} views
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white truncate max-w-lg">{art.title}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link
                      href={`/news/${art.slug}`}
                      target="_blank"
                      className="flex items-center gap-1 text-xs font-semibold text-[#a0a0a0] hover:text-white bg-[#050716] border border-[#2A2B30] px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <ExternalLink size={12} /> View
                    </Link>
                    <button
                      onClick={() => handleDelete(art._id, art.title)}
                      className="flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                      title="Delete Article"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
