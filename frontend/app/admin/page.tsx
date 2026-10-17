/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  Users,
  Mail,
  Star,
  Radio,
  Activity,
  Database,
  Search,
  Trash2,
  Reply,
  Send,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Check,
  X,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Inbox,
  MessageSquare,
  Newspaper,
  Plus,
  Eye,
  KeyRound,
  Award,
  Film,
  Sliders,
  Settings as SettingsIcon,
  ArrowUpRight,
  Flame,
  BookOpen,
  Layers,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/lib/auth-client';
import {
  verifyIsAdmin,
  getAdminStats,
  getAdminUsersList,
  updateUserRole,
  deleteAdminUser,
  getAdminContactMessages,
  replyToContactMessage,
  deleteContactMessage,
  getAdminRecentReviews,
  deleteAdminReview,
  sendSystemBroadcast,
  getAdminBroadcastsList,
  deleteAdminBroadcast,
  getAdminArticlesList,
  createAdminArticle,
  deleteAdminArticle,
  getAdminCuratedList,
  addAdminCuratedItem,
  deleteAdminCuratedItem,
} from '@/app/actions/admin';
import { BACKEND_URL } from '@/lib/config';

const ADMIN_EMAILS = [
  'shouvikdaswork@gmail.com',
  'animenationindia.global@gmail.com',
  'animenationindia.support@gmail.com',
];

const CURATED_SECTIONS = [
  { key: 'shounen', label: '🔥 Shounen Zone (Action & Hype)' },
  { key: 'sports', label: '⚽ Sports Zone (Passion & Grit)' },
  { key: 'kickstart', label: '🚀 Kickstart Journey (Beginner Essentials)' },
  { key: 'not_for_kids', label: '🔞 Not For Kids (Dark / Psychological)' },
  { key: 'similar_sao', label: '⚔️ VR / Fantasy / Isekai Realm' },
  { key: 'classics', label: '🏆 All-Time Timeless Classics' },
  { key: 'hero', label: '🌟 Homepage Spotlight Heroes' },
];

const ARTICLE_CATEGORIES = ['Anime', 'Manga', 'Movies', 'Reviews', 'Industry', 'Gaming'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionLoading } = useSession();

  // Auth & Admin Verification State
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [passcodeKey, setPasscodeKey] = useState('');
  const [showPasscodePrompt, setShowPasscodePrompt] = useState(false);

  // Active Tab: overview | users | articles | curated | inbox | reviews | broadcast | tools
  const [activeTab, setActiveTab] = useState<
    'overview' | 'users' | 'articles' | 'curated' | 'inbox' | 'reviews' | 'broadcast' | 'tools'
  >('overview');

  // Stats Data
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users Data
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [usersLoading, setUsersLoading] = useState(false);
  const [updatingUserRole, setUpdatingUserRole] = useState<string | null>(null);

  // Articles CMS Data
  const [articles, setArticles] = useState<any[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [articleForm, setArticleForm] = useState({
    title: '',
    slug: '',
    category: 'Anime',
    author: 'Anime Nation India Editorial',
    coverImage: '',
    snippet: '',
    content: '',
    tags: '',
    featured: false,
  });
  const [creatingArticle, setCreatingArticle] = useState(false);

  // Curated Content Data
  const [curatedSection, setCuratedSection] = useState('shounen');
  const [curatedList, setCuratedList] = useState<any[]>([]);
  const [curatedLoading, setCuratedLoading] = useState(false);
  const [animeSearchQuery, setAnimeSearchQuery] = useState('');
  const [animeSearchResults, setAnimeSearchResults] = useState<any[]>([]);
  const [searchingAnime, setSearchingAnime] = useState(false);
  const [showAddCuratedModal, setShowAddCuratedModal] = useState(false);

  // Contact Messages Data
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'unread' | 'replied'>('all');
  const [replyModalMessage, setReplyModalMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Reviews Moderation Data
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Broadcast Notification
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'system' | 'info' | 'release' | 'social'>('system');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Admin Check
  const checkAdminAuth = async (override?: string) => {
    const res = await verifyIsAdmin(override);
    if (res.isAdmin) {
      setIsAdmin(true);
      setCurrentUser(res.user || session?.user);
      setShowPasscodePrompt(false);
    } else {
      const email = (session?.user?.email || '').toLowerCase();
      if (ADMIN_EMAILS.includes(email) || (session?.user as any)?.role === 'admin') {
        setIsAdmin(true);
        setCurrentUser(session?.user);
      } else {
        setIsAdmin(false);
      }
    }
  };

  useEffect(() => {
    if (!isSessionLoading) {
      checkAdminAuth();
    }
  }, [isSessionLoading, session?.user]);

  // Read tab parameter from URL if provided (e.g., /admin?tab=articles)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (
      tabParam &&
      ['overview', 'users', 'articles', 'curated', 'inbox', 'reviews', 'broadcast', 'tools'].includes(tabParam)
    ) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Loaders
  const loadStats = async () => {
    setStatsLoading(true);
    const res = await getAdminStats();
    if (res.success && res.stats) setStats(res.stats);
    setStatsLoading(false);
  };

  const loadUsers = async (search = userSearch, role = userRoleFilter) => {
    setUsersLoading(true);
    const res = await getAdminUsersList({ search, role });
    if (res.success && res.users) setUsers(res.users);
    setUsersLoading(false);
  };

  const loadArticles = async () => {
    setArticlesLoading(true);
    const res = await getAdminArticlesList();
    if (res.success && res.articles) setArticles(res.articles);
    setArticlesLoading(false);
  };

  const loadCurated = async (sec = curatedSection) => {
    setCuratedLoading(true);
    const res = await getAdminCuratedList(sec);
    if (res.success && res.curated) setCuratedList(res.curated);
    setCuratedLoading(false);
  };

  const loadMessages = async () => {
    setMessagesLoading(true);
    const res = await getAdminContactMessages();
    if (res.success && res.messages) setMessages(res.messages);
    setMessagesLoading(false);
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    const res = await getAdminRecentReviews(50);
    if (res.success && res.reviews) setReviews(res.reviews);
    setReviewsLoading(false);
  };

  const loadBroadcasts = async () => {
    const res = await getAdminBroadcastsList();
    if (res.success && res.broadcasts) setBroadcasts(res.broadcasts);
  };

  // Trigger loads on tab change
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'overview') loadStats();
      if (activeTab === 'users') loadUsers();
      if (activeTab === 'articles') loadArticles();
      if (activeTab === 'curated') loadCurated();
      if (activeTab === 'inbox') loadMessages();
      if (activeTab === 'reviews') loadReviews();
      if (activeTab === 'broadcast') loadBroadcasts();
    }
  }, [activeTab, isAdmin]);

  // Passcode unlock handler
  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcodeKey.trim()) return;
    checkAdminAuth(passcodeKey.trim());
  };

  // User Actions
  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingUserRole(userId);
    const res = await updateUserRole({ userId, newRole });
    setUpdatingUserRole(null);
    if (res.success) {
      showToast(res.message || 'User role updated.');
      loadUsers();
    } else {
      alert(res.error || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Permanently delete user "${userName}"? This cannot be undone.`)) return;
    const res = await deleteAdminUser(userId);
    if (res.success) {
      showToast(`User ${userName} purged.`);
      loadUsers();
      loadStats();
    } else {
      alert(res.error || 'Failed to delete user.');
    }
  };

  // Article Actions
  const handleCreateArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleForm.title || !articleForm.content || !articleForm.coverImage) {
      alert('Title, Content, and Cover Image are required.');
      return;
    }
    setCreatingArticle(true);
    const res = await createAdminArticle(articleForm);
    setCreatingArticle(false);

    if (res.success) {
      showToast('Article published to Google News & Magazine feed!');
      setShowArticleModal(false);
      setArticleForm({
        title: '',
        slug: '',
        category: 'Anime',
        author: 'Anime Nation India Editorial',
        coverImage: '',
        snippet: '',
        content: '',
        tags: '',
        featured: false,
      });
      loadArticles();
      loadStats();
    } else {
      alert(res.message || 'Failed to create article');
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!window.confirm(`Delete article "${title}"?`)) return;
    const res = await deleteAdminArticle(id);
    if (res.success) {
      showToast('Article removed.');
      loadArticles();
      loadStats();
    } else {
      alert(res.message || 'Failed to delete article');
    }
  };

  // Curated Content Actions
  const handleSearchAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animeSearchQuery.trim()) return;
    setSearchingAnime(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/anime/search?q=${encodeURIComponent(animeSearchQuery.trim())}`);
      const data = await res.json();
      setAnimeSearchResults(Array.isArray(data) ? data : (data?.data || []));
    } catch {
      setAnimeSearchResults([]);
    }
    setSearchingAnime(false);
  };

  const handleAddAnimeToCurated = async (anime: any) => {
    const titleEnglish =
      anime.title_english ||
      anime.title ||
      anime.title?.english ||
      anime.title?.romaji ||
      'Anime';
    const poster =
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url ||
      anime.coverImage?.extraLarge ||
      anime.coverImage?.large ||
      '';

    const res = await addAdminCuratedItem({
      id: anime.mal_id || anime.id,
      idMal: anime.mal_id || anime.id,
      title: { english: titleEnglish, romaji: anime.title || titleEnglish },
      coverImage: { large: poster, extraLarge: poster },
      section: curatedSection,
      sectionName: CURATED_SECTIONS.find((s) => s.key === curatedSection)?.label,
      format: anime.type || 'TV',
      averageScore: anime.score ? Math.round(anime.score * 10) : undefined,
      seasonYear: anime.year || undefined,
      genres: anime.genres ? anime.genres.map((g: any) => g.name || g) : [],
    });

    if (res.success) {
      showToast(`Added "${titleEnglish}" to ${curatedSection.toUpperCase()}!`);
      loadCurated(curatedSection);
      setShowAddCuratedModal(false);
    } else {
      alert(res.message || 'Failed to add anime to curated section.');
    }
  };

  const handleDeleteCurated = async (id: number | string, section: string, title: string) => {
    if (!window.confirm(`Remove "${title}" from curated spotlight?`)) return;
    const res = await deleteAdminCuratedItem(id, section);
    if (res.success) {
      showToast('Anime removed from curated section.');
      loadCurated(section);
    } else {
      alert(res.message || 'Failed to remove.');
    }
  };

  // Contact Desk Actions
  const handleSendReply = async () => {
    if (!replyModalMessage || !replyText.trim()) return;
    setSendingReply(true);
    const res = await replyToContactMessage({
      messageId: replyModalMessage.id,
      replyText: replyText.trim(),
    });
    setSendingReply(false);

    if (res.success) {
      showToast(`Reply dispatched to ${replyModalMessage.email}`);
      setReplyModalMessage(null);
      setReplyText('');
      loadMessages();
      loadStats();
    } else {
      alert(res.error || 'Failed to send reply.');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('Delete message?')) return;
    const res = await deleteContactMessage(id);
    if (res.success) {
      showToast('Message deleted.');
      loadMessages();
      loadStats();
    }
  };

  // Review Actions
  const handleDeleteReview = async (id: string) => {
    if (!window.confirm('Delete review?')) return;
    const res = await deleteAdminReview(id);
    if (res.success) {
      showToast('Review purged.');
      loadReviews();
      loadStats();
    }
  };

  // Broadcast Actions
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setSendingBroadcast(true);
    const res = await sendSystemBroadcast({
      title: broadcastTitle,
      message: broadcastMessage,
      type: broadcastType,
      link: broadcastLink,
    });
    setSendingBroadcast(false);

    if (res.success) {
      showToast('Global announcement broadcasted to all users!');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastLink('');
      loadBroadcasts();
      loadStats();
    } else {
      alert(res.error || 'Failed to broadcast announcement.');
    }
  };

  const handleDeleteBroadcast = async (id: string) => {
    if (!window.confirm('Delete this broadcast notification?')) return;
    const res = await deleteAdminBroadcast(id);
    if (res.success) {
      showToast('Broadcast deleted.');
      loadBroadcasts();
      loadStats();
    }
  };

  // 🛡️ Access Restricted Fallback
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#050716] text-white flex flex-col items-center justify-center p-6 text-center pt-24">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
          <ShieldAlert size={40} className="text-rose-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-orbitron text-white mb-2">ACCESS RESTRICTED</h1>
        <p className="text-gray-400 max-w-md text-sm mb-6">
          This Master Admin Control Panel is reserved strictly for authorized Anime Nation India administrators.
        </p>

        {showPasscodePrompt ? (
          <form onSubmit={handlePasscodeUnlock} className="flex flex-col gap-3 w-full max-w-sm mb-6">
            <input
              type="password"
              placeholder="Enter Admin Master Passcode..."
              value={passcodeKey}
              onChange={(e) => setPasscodeKey(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-[#121327] border border-[#ff4dd2]/40 text-xs text-white placeholder:text-gray-500 text-center focus:outline-none focus:border-[#ff4dd2]"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#ff4dd2] text-black font-extrabold text-xs hover:bg-[#ff1f2d] transition-all cursor-pointer"
              >
                Authenticate Passcode
              </button>
              <button
                type="button"
                onClick={() => setShowPasscodePrompt(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 font-bold text-xs hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowPasscodePrompt(true)}
            className="mb-4 flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
          >
            <KeyRound size={14} />
            <span>Unlock via Admin Security Passcode</span>
          </button>
        )}

        <div className="flex gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white font-bold text-xs transition-all"
          >
            Return to Home
          </Link>
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-indigo-600 font-extrabold text-xs shadow-[0_0_20px_rgba(255,77,210,0.4)] hover:scale-105 transition-all text-white"
          >
            Sign in as Admin
          </Link>
        </div>
      </div>
    );
  }

  // Loading State
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#050716] text-white flex items-center justify-center pt-24">
        <div className="flex items-center gap-3 text-gray-400 font-bold">
          <RefreshCw size={20} className="animate-spin text-[#ff4dd2]" />
          <span>Verifying Admin Protocol...</span>
        </div>
      </div>
    );
  }

  // Filtered messages
  const filteredMessages = messages.filter((m) => {
    if (messageFilter === 'unread') return m.status === 'unread';
    if (messageFilter === 'replied') return m.status === 'replied';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#050716] text-white pt-24 pb-24 px-4 md:px-8 xl:px-12 selection:bg-[#ff4dd2] selection:text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 right-6 z-[200] bg-gradient-to-r from-[#121327] to-[#1f2142] border border-[#ff4dd2]/50 text-white font-bold text-xs py-3 px-5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_20px_rgba(255,77,210,0.3)] flex items-center gap-2"
          >
            <Sparkles size={16} className="text-[#ff4dd2]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1500px] mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Shield size={20} className="text-amber-400 fill-amber-400/20" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-orbitron tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-[#ff4dd2]">
                MASTER ADMIN CONTROL PANEL
              </h1>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Full Media CMS, Relational Neon Engine, Articles Publisher & Live Moderation • Master:{' '}
              <strong className="text-amber-400">{currentUser?.name || 'Master Admin'}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-[#121327] border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Neon PostgreSQL: Live</span>
            </div>
            <div className="flex items-center gap-2 bg-[#121327] border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold text-cyan-400 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>MongoDB Atlas: Active</span>
            </div>
            <Link
              href="/"
              className="text-xs font-bold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all"
            >
              Exit to App
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-3 mb-8 border-b border-white/5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity size={16} />
            <span>Overview & Health</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-[#ff4dd2]/20 border border-[#ff4dd2]/50 text-white shadow-[0_0_15px_rgba(255,77,210,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={16} />
            <span>Otaku Users & Roles</span>
          </button>

          <button
            onClick={() => setActiveTab('articles')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'articles'
                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Newspaper size={16} />
            <span>News & Articles CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('curated')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'curated'
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={16} />
            <span>Spotlight & Curated Anime</span>
          </button>

          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inbox'
                ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail size={16} />
            <span>Support Desk & Replies</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star size={16} />
            <span>Reviews Moderation</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'broadcast'
                ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio size={16} />
            <span>Broadcast Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('tools')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tools'
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <SettingsIcon size={16} />
            <span>System & Developer Tools</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Total Users</span>
                  <Users size={18} className="text-[#ff4dd2]" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalUsers ?? '...'}</p>
                <span className="text-[10px] text-emerald-400 font-bold mt-1 block">✓ Neon Relational DB</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Watchlists</span>
                  <Sparkles size={18} className="text-indigo-400" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalWatchlists ?? '...'}</p>
                <span className="text-[10px] text-indigo-400 font-bold mt-1 block">Live Folders & +1 Logs</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Articles / News</span>
                  <Newspaper size={18} className="text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalArticles ?? '...'}</p>
                <span className="text-[10px] text-emerald-400 font-bold mt-1 block">Google News RSS Feed</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Inquiries</span>
                  <Mail size={18} className="text-cyan-400" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalMessages ?? '...'}</p>
                <span className="text-[10px] text-cyan-400 font-bold mt-1 block">Email Webhook Ready</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Reviews</span>
                  <Star size={18} className="text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalReviews ?? '...'}</p>
                <span className="text-[10px] text-amber-400 font-bold mt-1 block">1-10 Star Ratings</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Broadcasts</span>
                  <Radio size={18} className="text-rose-400" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalBroadcasts ?? '...'}</p>
                <span className="text-[10px] text-rose-400 font-bold mt-1 block">Live Push Alerts</span>
              </div>
            </div>

            {/* Quick Actions & Infrastructure */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-[#0b0c1e] border border-white/10 lg:col-span-2">
                <h3 className="text-sm font-black font-orbitron text-amber-300 mb-4 flex items-center gap-2">
                  <Database size={18} className="text-amber-400" />
                  DATABASE & SYSTEM ARCHITECTURE
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-white">Neon Serverless PostgreSQL</p>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
                        OPERATIONAL
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Primary Relational Storage for Users, 2FA, Watchlists, Catalogs, and Notifications.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-white">MongoDB Atlas Cluster</p>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-black">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Editorial News, Articles, Curated Anime spotlights, and 48-Hour TTL Caches.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-white">Google Apps Script Webhook</p>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-black">
                        ARMED
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Dispatches high-deliverability 6-Digit OTPs, Security alerts, and Support email replies.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-white">Hybrid Next.js 14 & Node BFF</p>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] font-black">
                        HEALTHY
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      AniList GraphQL + Jikan API round-robin engine with in-memory caching.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#0b0c1e] border border-white/10 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black font-orbitron text-[#ff4dd2] mb-3 flex items-center gap-2">
                    <Zap size={18} className="text-[#ff4dd2]" />
                    QUICK ADMIN LAUNCHPAD
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Fast access to create news articles, feature anime, reply to support, or broadcast emergency alerts.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      setActiveTab('articles');
                      setShowArticleModal(true);
                    }}
                    className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left hover:border-emerald-400 transition-all cursor-pointer"
                  >
                    <Plus size={16} className="text-emerald-400 mb-1" />
                    <p className="text-xs font-bold text-white">New Article</p>
                    <span className="text-[10px] text-gray-400">Publish news</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('curated')}
                    className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-left hover:border-purple-400 transition-all cursor-pointer"
                  >
                    <Flame size={16} className="text-purple-400 mb-1" />
                    <p className="text-xs font-bold text-white">Spotlight</p>
                    <span className="text-[10px] text-gray-400">Feature anime</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('inbox')}
                    className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-left hover:border-indigo-400 transition-all cursor-pointer"
                  >
                    <Mail size={16} className="text-indigo-400 mb-1" />
                    <p className="text-xs font-bold text-white">Support</p>
                    <span className="text-[10px] text-gray-400">Reply tickets</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('broadcast')}
                    className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-left hover:border-cyan-400 transition-all cursor-pointer"
                  >
                    <Radio size={16} className="text-cyan-400 mb-1" />
                    <p className="text-xs font-bold text-white">Broadcast</p>
                    <span className="text-[10px] text-gray-400">Alert users</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: OTAKU USERS & ROLE MANAGEMENT */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-80">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search user by name or email..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      loadUsers(e.target.value, userRoleFilter);
                    }}
                    className="w-full bg-[#121327] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]"
                  />
                </div>

                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    loadUsers(userSearch, e.target.value);
                  }}
                  className="bg-[#121327] border border-white/10 rounded-xl py-2.5 px-3 text-xs text-gray-300 focus:outline-none focus:border-[#ff4dd2]"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admins</option>
                  <option value="vip">VIP Passholders</option>
                  <option value="user">Regular Members</option>
                </select>
              </div>

              <button
                onClick={() => loadUsers(userSearch, userRoleFilter)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 transition-all cursor-pointer whitespace-nowrap"
              >
                <RefreshCw size={14} className={usersLoading ? 'animate-spin' : ''} />
                <span>Refresh Users</span>
              </button>
            </div>

            <div className="rounded-3xl bg-[#0b0c1e] border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121327] text-gray-400 uppercase text-[10px] font-black border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role &amp; Privilege</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {users.map((u) => {
                      const isMasterAdmin = ADMIN_EMAILS.includes((u.email || '').toLowerCase());
                      return (
                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 flex items-center gap-3">
                            {u.image ? (
                              <img
                                src={u.image}
                                alt={u.name}
                                className="w-8 h-8 rounded-full object-cover border border-white/10"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-900 to-[#ff4dd2]/30 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                                {u.name ? u.name[0].toUpperCase() : 'U'}
                              </div>
                            )}
                            <span className="font-bold text-white">{u.name || 'Anonymous Otaku'}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{u.email}</td>
                          <td className="px-6 py-4">
                            {isMasterAdmin ? (
                              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-extrabold text-[10px] border border-amber-500/40">
                                MASTER ADMIN
                              </span>
                            ) : (
                              <select
                                value={u.role || 'user'}
                                disabled={updatingUserRole === u.id}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none transition-all cursor-pointer ${
                                  u.role === 'admin'
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                    : u.role === 'vip'
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                                    : 'bg-white/5 border-white/10 text-gray-400'
                                }`}
                              >
                                <option value="user" className="bg-[#121327] text-white">
                                  Member
                                </option>
                                <option value="vip" className="bg-[#121327] text-purple-300">
                                  VIP Pass
                                </option>
                                <option value="admin" className="bg-[#121327] text-amber-300">
                                  Admin
                                </option>
                              </select>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {u.emailVerified ? (
                              <span className="text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                                <Check size={14} /> Verified
                              </span>
                            ) : (
                              <span className="text-amber-400 font-bold text-[11px]">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isMasterAdmin ? (
                              <span className="text-[11px] text-gray-500 font-bold">Protected</span>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                                title="Delete user"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && !usersLoading && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500">
                          No users found matching your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: NEWS & ARTICLES CMS */}
        {/* ======================================================== */}
        {activeTab === 'articles' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black font-orbitron text-white">Anime &amp; Manga Editorial CMS</h2>
                <p className="text-xs text-gray-400">
                  Publish editorial reviews, trailer breakdowns, and manga industry news to Google News &amp; Magazine feeds.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowArticleModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-xs text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-105 transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Publish New Article</span>
                </button>

                <button
                  onClick={loadArticles}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all cursor-pointer"
                >
                  <RefreshCw size={14} className={articlesLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Articles Table */}
            <div className="rounded-3xl bg-[#0b0c1e] border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121327] text-gray-400 uppercase text-[10px] font-black border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Article</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Author</th>
                      <th className="px-6 py-4">Views</th>
                      <th className="px-6 py-4">Published</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {articles.map((art) => (
                      <tr key={art._id || art.slug} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3 max-w-md">
                          <img
                            src={art.coverImage}
                            alt={art.title}
                            className="w-12 h-8 rounded-lg object-cover border border-white/10 shrink-0"
                          />
                          <div>
                            <Link
                              href={`/news/${art.slug}`}
                              target="_blank"
                              className="font-bold text-white hover:text-[#ff4dd2] line-clamp-1 flex items-center gap-1"
                            >
                              <span>{art.title}</span>
                              <ExternalLink size={12} className="opacity-60" />
                            </Link>
                            <span className="text-[10px] text-gray-400 font-mono">/news/{art.slug}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-emerald-400 font-bold text-[10px]">
                            {art.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{art.author}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-cyan-400 flex items-center gap-1">
                            <Eye size={12} /> {art.views || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {new Date(art.publishedAt || art.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteArticle(art._id, art.title)}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                            title="Delete article"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {articles.length === 0 && !articlesLoading && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-500">
                          No published articles found in MongoDB Atlas. Click &quot;Publish New Article&quot; to seed!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create Article Modal */}
            <AnimatePresence>
              {showArticleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl bg-[#0c0d20] border border-white/15 rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Newspaper size={20} className="text-emerald-400" />
                        <h3 className="text-lg font-black font-orbitron text-white">Publish Editorial Article</h3>
                      </div>
                      <button
                        onClick={() => setShowArticleModal(false)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleCreateArticleSubmit} className="flex flex-col gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Article Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Demon Slayer Infinity Castle Arc Official Trailer Analysis"
                          value={articleForm.title}
                          onChange={(e) =>
                            setArticleForm({
                              ...articleForm,
                              title: e.target.value,
                              slug: e.target.value
                                .toLowerCase()
                                .trim()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)+/g, ''),
                            })
                          }
                          className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            URL Slug *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="demon-slayer-trailer-analysis"
                            value={articleForm.slug}
                            onChange={(e) => setArticleForm({ ...articleForm, slug: e.target.value })}
                            className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Category *
                          </label>
                          <select
                            value={articleForm.category}
                            onChange={(e) => setArticleForm({ ...articleForm, category: e.target.value })}
                            className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                          >
                            {ARTICLE_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Cover Image URL *
                        </label>
                        <input
                          type="url"
                          required
                          placeholder="https://images.unsplash.com/... or direct image link"
                          value={articleForm.coverImage}
                          onChange={(e) => setArticleForm({ ...articleForm, coverImage: e.target.value })}
                          className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400"
                        />
                        {articleForm.coverImage && (
                          <div className="mt-2 h-28 rounded-xl overflow-hidden border border-white/10">
                            <img
                              src={articleForm.coverImage}
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => ((e.target as any).style.display = 'none')}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Summary / Snippet
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Brief 2-line preview that appears in search engines & cards..."
                          value={articleForm.snippet}
                          onChange={(e) => setArticleForm({ ...articleForm, snippet: e.target.value })}
                          className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                          Article Content (HTML / Markdown) *
                        </label>
                        <textarea
                          rows={7}
                          required
                          placeholder="Write article content here. Supports HTML <p>, <h2>, <strong>, <img>..."
                          value={articleForm.content}
                          onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                          className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Tags (Comma separated)
                          </label>
                          <input
                            type="text"
                            placeholder="Demon Slayer, Ufotable, Anime News"
                            value={articleForm.tags}
                            onChange={(e) => setArticleForm({ ...articleForm, tags: e.target.value })}
                            className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-400"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                            Author Name
                          </label>
                          <input
                            type="text"
                            value={articleForm.author}
                            onChange={(e) => setArticleForm({ ...articleForm, author: e.target.value })}
                            className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="featuredToggle"
                          checked={articleForm.featured}
                          onChange={(e) => setArticleForm({ ...articleForm, featured: e.target.checked })}
                          className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="featuredToggle" className="text-xs font-bold text-gray-300 cursor-pointer">
                          Pin as Featured Article on News Homepage
                        </label>
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setShowArticleModal(false)}
                          className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingArticle}
                          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-extrabold text-xs text-white shadow-lg cursor-pointer"
                        >
                          {creatingArticle ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          <span>Publish Now</span>
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: SPOTLIGHT & CURATED ANIME */}
        {/* ======================================================== */}
        {activeTab === 'curated' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black font-orbitron text-white">Spotlight &amp; Curated Sections</h2>
                <p className="text-xs text-gray-400">
                  Feature handpicked titles in thematic homepage rows, Hero carousel, and beginner guides.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddCuratedModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 font-bold text-xs text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-105 transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Feature New Anime</span>
                </button>

                <button
                  onClick={() => loadCurated(curatedSection)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-all cursor-pointer"
                >
                  <RefreshCw size={14} className={curatedLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Section Pills */}
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2">
              {CURATED_SECTIONS.map((sec) => (
                <button
                  key={sec.key}
                  onClick={() => {
                    setCuratedSection(sec.key);
                    loadCurated(sec.key);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    curatedSection === sec.key
                      ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 shadow-md'
                      : 'bg-white/5 border border-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Curated Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {curatedList.map((item) => {
                const titleStr =
                  item.title?.english || item.title?.romaji || item.title || 'Anime';
                const poster =
                  item.coverImage?.extraLarge ||
                  item.coverImage?.large ||
                  item.coverImage?.medium ||
                  '';
                return (
                  <div
                    key={item._id || item.id}
                    className="group relative flex flex-col rounded-2xl bg-[#0b0c1e] border border-white/10 overflow-hidden hover:border-purple-500/50 transition-all shadow-lg"
                  >
                    <div className="aspect-[2/3] w-full relative bg-gray-900 overflow-hidden">
                      {poster ? (
                        <img
                          src={poster}
                          alt={titleStr}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Film size={24} />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleDeleteCurated(item._id || item.id, item.section, titleStr)}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-rose-500 text-white transition-all cursor-pointer"
                          title="Remove from curated"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      {item.averageScore && (
                        <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-amber-400 text-[10px] font-black">
                          ★ {(item.averageScore / 10).toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="p-3">
                      <p className="font-bold text-white text-xs line-clamp-1 group-hover:text-purple-300">
                        {titleStr}
                      </p>
                      <span className="text-[10px] text-gray-400 font-medium">
                        ID: {item.id} • {item.format || 'TV'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {curatedList.length === 0 && !curatedLoading && (
              <div className="text-center py-12 rounded-3xl bg-[#0b0c1e] border border-white/10 text-gray-500 text-xs">
                No titles in this section yet. Click &quot;Feature New Anime&quot; to search and pin titles!
              </div>
            )}

            {/* Search & Add Curated Modal */}
            <AnimatePresence>
              {showAddCuratedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-xl bg-[#0c0d20] border border-white/15 rounded-3xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                      <div>
                        <h3 className="text-base font-black font-orbitron text-white">Feature Anime in Spotlight</h3>
                        <p className="text-[11px] text-purple-300">
                          Target: {CURATED_SECTIONS.find((s) => s.key === curatedSection)?.label}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddCuratedModal(false)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleSearchAnime} className="flex gap-2 mb-4">
                      <input
                        type="text"
                        placeholder="Search anime by title (e.g. Solo Leveling, Bleach)..."
                        value={animeSearchQuery}
                        onChange={(e) => setAnimeSearchQuery(e.target.value)}
                        className="flex-1 bg-[#121327] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-400"
                      />
                      <button
                        type="submit"
                        disabled={searchingAnime}
                        className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 transition-all cursor-pointer"
                      >
                        {searchingAnime ? <RefreshCw size={14} className="animate-spin" /> : 'Search'}
                      </button>
                    </form>

                    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto custom-scrollbar">
                      {animeSearchResults.map((anime) => {
                        const t =
                          anime.title_english ||
                          anime.title ||
                          anime.title?.english ||
                          anime.title?.romaji ||
                          'Anime';
                        const img =
                          anime.images?.jpg?.image_url ||
                          anime.coverImage?.large ||
                          '';
                        return (
                          <div
                            key={anime.mal_id || anime.id}
                            className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              {img && (
                                <img
                                  src={img}
                                  alt={t}
                                  className="w-10 h-14 rounded-lg object-cover border border-white/10"
                                />
                              )}
                              <div>
                                <p className="font-bold text-white text-xs line-clamp-1">{t}</p>
                                <span className="text-[10px] text-gray-400">
                                  ID: {anime.mal_id || anime.id} • {anime.type || anime.format || 'TV'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddAnimeToCurated(anime)}
                              className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500 border border-purple-500/40 text-purple-300 hover:text-white font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap"
                            >
                              + Feature
                            </button>
                          </div>
                        );
                      })}
                      {animeSearchResults.length === 0 && !searchingAnime && (
                        <p className="text-center py-6 text-gray-500 text-xs">
                          Type an anime name and click Search to find titles.
                        </p>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: SUPPORT DESK & INBOX */}
        {/* ======================================================== */}
        {activeTab === 'inbox' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black font-orbitron text-white">Support Desk &amp; Contact Inquiries</h2>
                <p className="text-xs text-gray-400">
                  Replying dispatches a branded email via the Anime Nation India Google Apps Script Webhook.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMessageFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    messageFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  All ({messages.length})
                </button>
                <button
                  onClick={() => setMessageFilter('unread')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    messageFilter === 'unread' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Unread ({messages.filter((m) => m.status === 'unread').length})
                </button>
                <button
                  onClick={() => setMessageFilter('replied')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                    messageFilter === 'replied' ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  Replied ({messages.filter((m) => m.status === 'replied').length})
                </button>
                <button
                  onClick={loadMessages}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 ml-2 cursor-pointer"
                >
                  <RefreshCw size={14} className={messagesLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-6 rounded-3xl border transition-all ${
                    msg.status === 'unread'
                      ? 'bg-[#121327]/80 border-indigo-500/40 shadow-lg'
                      : 'bg-[#0b0c1e] border-white/5 opacity-80'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                        {msg.name ? msg.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{msg.name}</h4>
                        <span className="text-[11px] text-gray-400">{msg.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          msg.status === 'unread'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {msg.status}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-indigo-300 mb-2">Topic: {msg.topic || 'General Inquiry'}</p>
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs text-gray-300 leading-relaxed mb-4">
                    {msg.message}
                  </div>

                  {msg.replyText && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 mb-4">
                      <strong>Admin Dispatched Reply:</strong> {msg.replyText}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setReplyModalMessage(msg);
                        setReplyText('');
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer"
                    >
                      <Reply size={14} />
                      <span>{msg.status === 'replied' ? 'Send Follow-up' : 'Send Official Reply'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                      title="Delete inquiry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {filteredMessages.length === 0 && !messagesLoading && (
                <div className="text-center py-12 rounded-3xl bg-[#0b0c1e] border border-white/10 text-gray-500 text-xs">
                  No contact messages matching this filter.
                </div>
              )}
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
              {replyModalMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-lg bg-[#0c0d20] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl"
                  >
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                      <div>
                        <h3 className="text-base font-black font-orbitron text-white">Send Branded Email Reply</h3>
                        <p className="text-[11px] text-gray-400">To: {replyModalMessage.email}</p>
                      </div>
                      <button
                        onClick={() => setReplyModalMessage(null)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-gray-400 mb-4 max-h-24 overflow-y-auto">
                      <strong>User Query:</strong> {replyModalMessage.message}
                    </div>

                    <textarea
                      rows={5}
                      placeholder="Write your official response here. It will be sent via Anime Nation India Support email..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full bg-[#121327] border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-400 resize-none mb-4"
                    />

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setReplyModalMessage(null)}
                        className="px-4 py-2 rounded-xl bg-white/5 text-gray-300 font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendReply}
                        disabled={sendingReply}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-lg"
                      >
                        {sendingReply ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        <span>Dispatch Email</span>
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: REVIEWS MODERATION */}
        {/* ======================================================== */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black font-orbitron text-white">User Reviews Moderation Queue</h2>
                <p className="text-xs text-gray-400">
                  Monitor community reviews across anime titles, inspect scores, and purge toxic or spoiler entries.
                </p>
              </div>
              <button
                onClick={loadReviews}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={reviewsLoading ? 'animate-spin' : ''} />
                <span>Refresh Reviews</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((item) => {
                const r = item.review;
                const u = item.user;
                return (
                  <div
                    key={r.id}
                    className="p-5 rounded-3xl bg-[#0b0c1e] border border-white/10 flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40">
                            ★ {r.score} / 10
                          </span>
                          <span className="text-[11px] font-bold text-gray-300">Anime ID: {r.mediaId}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                          title="Purge review"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <h4 className="font-bold text-white text-sm mb-1">{r.title}</h4>
                      <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-3">{r.content}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-gray-500">
                      <span>By: {u?.name || u?.email || 'User'}</span>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}

              {reviews.length === 0 && !reviewsLoading && (
                <div className="col-span-2 text-center py-12 rounded-3xl bg-[#0b0c1e] border border-white/10 text-gray-500 text-xs">
                  No community reviews to moderate at this time.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: BROADCAST NOTIFICATIONS */}
        {/* ======================================================== */}
        {activeTab === 'broadcast' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-3xl bg-[#0b0c1e] border border-white/10 shadow-xl">
              <h3 className="text-sm font-black font-orbitron text-cyan-300 mb-2 flex items-center gap-2">
                <Radio size={18} className="text-cyan-400" />
                DISPATCH GLOBAL PUSH BROADCAST
              </h3>
              <p className="text-xs text-gray-400 mb-6">
                Broadcast an instant banner alert and in-app notification to all registered users simultaneously.
              </p>

              <form onSubmit={handleSendBroadcast} className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Announcement Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Scheduled Maintenance Notice / Season Finale Release"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Notification Type
                    </label>
                    <select
                      value={broadcastType}
                      onChange={(e) => setBroadcastType(e.target.value as any)}
                      className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="system">System Notice</option>
                      <option value="release">New Release</option>
                      <option value="info">General Info</option>
                      <option value="social">Community Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                      Target Link (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="/series/34572 or https://..."
                      value={broadcastLink}
                      onChange={(e) => setBroadcastLink(e.target.value)}
                      className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Broadcast Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Details about the announcement or maintenance schedule..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    className="w-full bg-[#121327] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-extrabold text-xs text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {sendingBroadcast ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Broadcast to Entire Platform</span>
                </button>
              </form>
            </div>

            {/* Sent Broadcasts History */}
            <div className="p-6 rounded-3xl bg-[#0b0c1e] border border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black font-orbitron text-white">Broadcast History</h3>
                  <button
                    onClick={loadBroadcasts}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>

                <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto custom-scrollbar">
                  {broadcasts.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300">
                            {b.type}
                          </span>
                          <h5 className="font-bold text-white text-xs">{b.title}</h5>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-relaxed">{b.message}</p>
                        <span className="text-[10px] text-gray-500 mt-1 block">
                          Sent: {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteBroadcast(b.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Delete broadcast"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {broadcasts.length === 0 && (
                    <p className="text-center py-10 text-gray-500 text-xs">No active broadcasts in history.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: SYSTEM & DEVELOPER TOOLS */}
        {/* ======================================================== */}
        {activeTab === 'tools' && (
          <div className="flex flex-col gap-6">
            <div className="p-6 rounded-3xl bg-[#0b0c1e] border border-white/10 shadow-xl">
              <h3 className="text-sm font-black font-orbitron text-amber-300 mb-4 flex items-center gap-2">
                <SettingsIcon size={18} className="text-amber-400" />
                ENVIRONMENT &amp; DEVELOPER DIAGNOSTICS
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 block mb-1">FRONTEND SERVICE</span>
                  <p className="text-xs font-mono text-white">Next.js 14 Turbopack App Router</p>
                  <span className="text-[11px] text-emerald-400 font-bold mt-1 block">Port 3000 Active</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 block mb-1">BACKEND SERVICE</span>
                  <p className="text-xs font-mono text-white">{BACKEND_URL}</p>
                  <span className="text-[11px] text-emerald-400 font-bold mt-1 block">Port 5050 Active</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 block mb-1">PRIMARY RELATIONAL DB</span>
                  <p className="text-xs font-mono text-white">Neon PostgreSQL (Singapore)</p>
                  <span className="text-[11px] text-cyan-400 font-bold mt-1 block">Pooler + Drizzle ORM</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 block mb-1">DOCUMENT &amp; CACHE DB</span>
                  <p className="text-xs font-mono text-white">MongoDB Atlas Cluster</p>
                  <span className="text-[11px] text-cyan-400 font-bold mt-1 block">Mongoose ODM + TTL Index</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 block mb-1">RSS FEED GENERATOR</span>
                  <p className="text-xs font-mono text-white">Google News RSS 2.0 Compliant</p>
                  <a
                    href={`${BACKEND_URL}/api/news/feed.xml`}
                    target="_blank"
                    className="text-[11px] text-[#ff4dd2] hover:underline font-bold mt-1 inline-flex items-center gap-1"
                  >
                    <span>View /api/news/feed.xml</span>
                    <ExternalLink size={10} />
                  </a>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 block mb-1">SECURITY PASSCODE PROTOCOL</span>
                  <p className="text-xs font-mono text-white">Server-Side Environment Guard</p>
                  <span className="text-[11px] text-amber-400 font-bold mt-1 block">Active on Protected Routes</span>
                </div>
              </div>
            </div>

            {/* Quick External Endpoints */}
            <div className="p-6 rounded-3xl bg-[#0b0c1e] border border-white/10 shadow-xl">
              <h3 className="text-sm font-black font-orbitron text-white mb-4">PUBLIC &amp; SERVICE LINKS</h3>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-all"
                >
                  <span>Main Webapp</span>
                  <ExternalLink size={12} />
                </Link>

                <Link
                  href="/news"
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-all"
                >
                  <span>News &amp; Magazine Hub</span>
                  <ExternalLink size={12} />
                </Link>

                <Link
                  href="/schedule"
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-all"
                >
                  <span>Live Airing Calendar</span>
                  <ExternalLink size={12} />
                </Link>

                <Link
                  href="/browse/all"
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 transition-all"
                >
                  <span>Anime Catalog</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
