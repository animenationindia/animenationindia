'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
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
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/lib/auth-client';
import {
  verifyIsAdmin,
  getAdminStats,
  getAdminUsersList,
  deleteAdminUser,
  getAdminContactMessages,
  replyToContactMessage,
  deleteContactMessage,
  getAdminRecentReviews,
  deleteAdminReview,
  sendSystemBroadcast,
} from '@/app/actions/admin';

const ADMIN_EMAILS = [
  'shouvikdaswork@gmail.com',
  'animenationindia.global@gmail.com',
  'animenationindia.support@gmail.com',
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  const [isPending, startTransition] = useTransition();

  // Auth & Admin Verification State
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'inbox' | 'reviews' | 'broadcast'>('overview');

  // Stats Data
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users Data
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Contact Messages Data
  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyModalMessage, setReplyModalMessage] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySuccessMsg, setReplySuccessMsg] = useState('');

  // Reviews Moderation Data
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Broadcast Notification Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'system' | 'info' | 'release' | 'social'>('system');
  const [broadcastLink, setBroadcastLink] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Action feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initial Admin Verification (Server-Side Session Check)
  useEffect(() => {
    async function checkAuth() {
      const res = await verifyIsAdmin();
      if (!res.isAdmin) {
        // Also check fallback email on session
        const email = (session?.user?.email || '').toLowerCase();
        if (ADMIN_EMAILS.includes(email) || (session?.user as any)?.role === 'admin') {
          setIsAdmin(true);
          setCurrentUser(session?.user);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(true);
        setCurrentUser(res.user || session?.user);
      }
    }
    if (!isSessionLoading) {
      checkAuth();
    }
  }, [isSessionLoading, session?.user]);

  // 2. Load Stats when Tab is Overview
  const loadStats = async () => {
    setStatsLoading(true);
    const res = await getAdminStats();
    if (res.success && res.stats) {
      setStats(res.stats);
    }
    setStatsLoading(false);
  };

  // 3. Load Users
  const loadUsers = async (search = '') => {
    setUsersLoading(true);
    const res = await getAdminUsersList({ search });
    if (res.success && res.users) {
      setUsers(res.users);
    }
    setUsersLoading(false);
  };

  // 4. Load Contact Messages
  const loadMessages = async () => {
    setMessagesLoading(true);
    const res = await getAdminContactMessages();
    if (res.success && res.messages) {
      setMessages(res.messages);
    }
    setMessagesLoading(false);
  };

  // 5. Load Reviews
  const loadReviews = async () => {
    setReviewsLoading(true);
    const res = await getAdminRecentReviews(50);
    if (res.success && res.reviews) {
      setReviews(res.reviews);
    }
    setReviewsLoading(false);
  };

  // Tab change trigger
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'overview') loadStats();
      if (activeTab === 'users') loadUsers(userSearch);
      if (activeTab === 'inbox') loadMessages();
      if (activeTab === 'reviews') loadReviews();
    }
  }, [activeTab, isAdmin]);

  // Handler: Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"? This cannot be undone.`)) {
      return;
    }
    const res = await deleteAdminUser(userId);
    if (res.success) {
      showToast(`User ${userName} purged successfully.`);
      loadUsers(userSearch);
      loadStats();
    } else {
      alert(res.error || 'Failed to delete user.');
    }
  };

  // Handler: Reply to Contact Desk message via Google Apps Script Webhook
  const handleSendReply = async () => {
    if (!replyModalMessage || !replyText.trim()) return;
    setSendingReply(true);
    const res = await replyToContactMessage({
      messageId: replyModalMessage.id,
      replyText: replyText.trim(),
    });
    setSendingReply(false);

    if (res.success) {
      setReplySuccessMsg('Reply dispatched successfully via Google Webhook!');
      showToast(`Reply sent to ${replyModalMessage.email}`);
      setTimeout(() => {
        setReplyModalMessage(null);
        setReplyText('');
        setReplySuccessMsg('');
        loadMessages();
      }, 1500);
    } else {
      alert(res.error || 'Failed to dispatch email reply.');
    }
  };

  // Handler: Delete Contact Message
  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Delete this message from inbox?')) return;
    const res = await deleteContactMessage(msgId);
    if (res.success) {
      showToast('Message deleted.');
      loadMessages();
    }
  };

  // Handler: Delete Review
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this user review?')) return;
    const res = await deleteAdminReview(reviewId);
    if (res.success) {
      showToast('Review removed.');
      loadReviews();
    }
  };

  // Handler: Send Global Broadcast
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
      setBroadcastSent(true);
      showToast('Global notification broadcasted to all users!');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastLink('');
      setTimeout(() => setBroadcastSent(false), 3000);
    } else {
      alert(res.error || 'Failed to send broadcast.');
    }
  };

  // 🛡️ Unauthorized State
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
        <Link
          href="/"
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff4dd2] to-indigo-600 font-extrabold text-sm shadow-[0_0_20px_rgba(255,77,210,0.4)] hover:scale-105 transition-all"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Loading Admin Auth check
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

  return (
    <div className="min-h-screen bg-[#050716] text-white pt-24 pb-20 px-4 md:px-8 xl:px-12">
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

      <div className="max-w-[1400px] mx-auto">
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
              Real-time Neon Serverless PostgreSQL & System Engine • Master Node: <strong className="text-amber-400">Shouvik Das</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#121327] border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Neon DB: Singapore (Live)</span>
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
            <span>Otaku Users Management</span>
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
            <span>Contact Desk Inbox & Dispatcher</span>
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
            <span>Global Broadcast Notification</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & SYSTEM HEALTH */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Total Otaku Users</span>
                  <Users size={18} className="text-[#ff4dd2]" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalUsers ?? '...'}</p>
                <span className="text-[10px] text-emerald-400 font-bold mt-1 block">✓ Neon Relational DB</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Watchlist Entries</span>
                  <Sparkles size={18} className="text-indigo-400" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalWatchlists ?? '...'}</p>
                <span className="text-[10px] text-indigo-400 font-bold mt-1 block">Custom Folders Synced</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Support Inquiries</span>
                  <Mail size={18} className="text-cyan-400" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalMessages ?? '...'}</p>
                <span className="text-[10px] text-cyan-400 font-bold mt-1 block">Google Webhook Armed</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Community Reviews</span>
                  <Star size={18} className="text-amber-400" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalReviews ?? '...'}</p>
                <span className="text-[10px] text-amber-400 font-bold mt-1 block">1-10 Star Ratings</span>
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121327] to-[#0a0b18] border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400">Smart Reactions</span>
                  <Activity size={18} className="text-rose-400" />
                </div>
                <p className="text-2xl font-black text-white font-orbitron">{stats?.totalReactions ?? '...'}</p>
                <span className="text-[10px] text-rose-400 font-bold mt-1 block">Watched / Likes / Dislikes</span>
              </div>
            </div>

            {/* Infrastructure Health Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-[#0b0c1e] border border-white/10">
                <h3 className="text-sm font-black font-orbitron text-amber-300 mb-4 flex items-center gap-2">
                  <Database size={18} className="text-amber-400" />
                  DATABASE & SERVERS ARCHITECTURE
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white">Neon PostgreSQL (Singapore ap-southeast-1)</p>
                      <p className="text-[11px] text-gray-400">Primary Relational Storage for Users, Catalogs & OTPs</p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-[11px] border border-emerald-500/30">
                      OPERATIONAL
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white">Anime Nation Official Email Engine</p>
                      <p className="text-[11px] text-gray-400">Automated 6-Digit OTP &amp; Support Reply Delivery</p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-black text-[11px] border border-cyan-500/30">
                      ARMED &amp; READY
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5">
                    <div>
                      <p className="text-xs font-bold text-white">Next.js 14 App Router + Node.js API</p>
                      <p className="text-[11px] text-gray-400">Hybrid Frontend Server & Scraper Proxy</p>
                    </div>
                    <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 font-black text-[11px] border border-indigo-500/30">
                      HEALTHY
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-[#0b0c1e] border border-white/10 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black font-orbitron text-[#ff4dd2] mb-3 flex items-center gap-2">
                    <Sparkles size={18} className="text-[#ff4dd2]" />
                    QUICK ADMIN ACTIONS
                  </h3>
                  <p className="text-xs text-gray-400 mb-5">
                    Manage users, reply to incoming contact messages with branded templates, or send emergency announcements.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('inbox')}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600/20 to-indigo-900/30 border border-indigo-500/40 text-left hover:border-indigo-400 transition-all cursor-pointer"
                  >
                    <Mail size={18} className="text-indigo-400 mb-1" />
                    <p className="text-xs font-bold text-white">Support Inbox</p>
                    <span className="text-[10px] text-gray-400">Send email replies</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('broadcast')}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-600/20 to-cyan-900/30 border border-cyan-500/40 text-left hover:border-cyan-400 transition-all cursor-pointer"
                  >
                    <Radio size={18} className="text-cyan-400 mb-1" />
                    <p className="text-xs font-bold text-white">Broadcast</p>
                    <span className="text-[10px] text-gray-400">Global notifications</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: OTAKU USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-96">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    loadUsers(e.target.value);
                  }}
                  className="w-full bg-[#121327] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]"
                />
              </div>

              <button
                onClick={() => loadUsers(userSearch)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 transition-all cursor-pointer"
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
                      <th className="px-6 py-4">Role</th>
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-900 to-[#ff4dd2]/30 border border-white/10 flex items-center justify-center font-bold text-white text-xs">
                              {u.name ? u.name[0].toUpperCase() : 'U'}
                            </div>
                            <span className="font-bold text-white">{u.name || 'Anonymous Otaku'}</span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">{u.email}</td>
                          <td className="px-6 py-4">
                            {isMasterAdmin ? (
                              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 font-extrabold text-[10px] border border-amber-500/40">
                                MASTER ADMIN
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-md bg-white/5 text-gray-300 font-bold text-[10px]">
                                MEMBER
                              </span>
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
                                <Trash2 size={15} />
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

        {/* TAB 3: CONTACT DESK INBOX & DISPATCHER */}
        {activeTab === 'inbox' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black font-orbitron text-white">Support &amp; Contact Inquiries</h2>
                <p className="text-xs text-gray-400">
                  Messages received through the Contact desk. Replying sends a direct official Anime Nation India branded email.
                </p>
              </div>
              <button
                onClick={loadMessages}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 transition-all cursor-pointer"
              >
                <RefreshCw size={14} className={messagesLoading ? 'animate-spin' : ''} />
                <span>Refresh Inbox</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-5 rounded-3xl bg-[#0b0c1e] border border-white/10 flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-bold text-white text-sm">{msg.name}</span>
                      <span className="text-xs text-gray-400">({msg.email})</span>
                      {msg.status === 'replied' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 size={12} /> Replied
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-[10px] border border-amber-500/30">
                          Pending Review
                        </span>
                      )}
                      <span className="text-[11px] text-gray-500 ml-auto">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#ff4dd2] mb-1">
                      Topic: {msg.topic || 'General Inquiry'}
                    </p>
                    <p className="text-xs text-gray-300 bg-white/5 p-3.5 rounded-2xl border border-white/5 mb-3 leading-relaxed whitespace-pre-wrap">
                      {msg.message}
                    </p>

                    {msg.replyText && (
                      <div className="bg-indigo-950/30 border border-indigo-500/30 p-3 rounded-2xl text-xs text-indigo-200">
                        <p className="font-extrabold text-[11px] text-indigo-400 mb-1">Previous Sent Reply:</p>
                        <p className="whitespace-pre-wrap">{msg.replyText}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setReplyModalMessage(msg);
                        setReplyText('');
                        setReplySuccessMsg('');
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all cursor-pointer"
                    >
                      <Reply size={15} />
                      <span>{msg.status === 'replied' ? 'Reply Again' : 'Send Reply'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                      title="Delete message"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {messages.length === 0 && !messagesLoading && (
                <div className="text-center py-16 bg-[#0b0c1e] rounded-3xl border border-white/5 text-gray-500">
                  <Inbox size={32} className="mx-auto mb-2 text-gray-600" />
                  <p className="text-sm font-bold">No Contact Messages in Inbox</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REVIEWS MODERATION */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black font-orbitron text-white">Community Anime Reviews</h2>
                <p className="text-xs text-gray-400">
                  Live stream of reviews and ratings published on anime cards.
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
              {reviews.map(({ review, user: reviewer }) => (
                <div
                  key={review.id}
                  className="p-5 rounded-3xl bg-[#0b0c1e] border border-white/10 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">
                          {reviewer?.name || 'Otaku Reviewer'}
                        </span>
                        <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md text-amber-300 font-black text-[11px]">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span>{review.rating}/10</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-[#ff4dd2] mb-1">
                      Anime ID: #{review.animeId}
                    </p>
                    <p className="text-xs text-gray-300 bg-white/5 p-3 rounded-2xl border border-white/5 leading-relaxed">
                      {review.reviewText || 'No review comment provided.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold border border-rose-500/30 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Delete Review</span>
                    </button>
                  </div>
                </div>
              ))}

              {reviews.length === 0 && !reviewsLoading && (
                <div className="col-span-2 text-center py-16 bg-[#0b0c1e] rounded-3xl border border-white/5 text-gray-500">
                  <Star size={32} className="mx-auto mb-2 text-gray-600" />
                  <p className="text-sm font-bold">No Reviews Moderation Data Available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: GLOBAL BROADCAST NOTIFICATION */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#0b0c1e] border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Radio size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black font-orbitron text-white">Send Global Broadcast</h2>
                <p className="text-xs text-gray-400">Push instant notification to all active Anime Nation India users</p>
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">Notification Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Solo Leveling Season 2 Dub Announced!"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-[#121327] border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff4dd2]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">Message Body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter the broadcast announcement description..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-[#121327] border border-white/10 rounded-xl p-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff4dd2] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-2">Category Type</label>
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as any)}
                    className="w-full bg-[#121327] border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-[#ff4dd2]"
                  >
                    <option value="system">System Notice</option>
                    <option value="release">New Anime Release</option>
                    <option value="info">Community Info</option>
                    <option value="social">Social / Watch Party</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-2">Target Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. /home or /anime/1234"
                    value={broadcastLink}
                    onChange={(e) => setBroadcastLink(e.target.value)}
                    className="w-full bg-[#121327] border border-white/10 rounded-xl py-3 px-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-[#ff4dd2]"
                  />
                </div>
              </div>

              {broadcastSent && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Broadcast transmitted across Neon database successfully!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={sendingBroadcast}
                className="mt-2 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-[#ff4dd2] text-white font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {sendingBroadcast ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Broadcasting...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Broadcast Notification Now</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 🌟 Reply Email Modal (Google Apps Script Webhook) */}
      <AnimatePresence>
        {replyModalMessage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0c0d1e] border border-indigo-500/40 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.95),0_0_30px_rgba(99,102,241,0.25)] flex flex-col gap-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Reply size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Official Support Email Reply</h3>
                    <p className="text-[11px] text-gray-400">To: {replyModalMessage.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setReplyModalMessage(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 text-xs text-gray-300">
                <p className="font-bold text-[#ff4dd2] mb-1">User Inquiry:</p>
                <p className="text-gray-400 line-clamp-3 italic">"{replyModalMessage.message}"</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">Admin Response</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Type your official support response here. It will be packaged in a branded Cyber HTML template..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full bg-[#121327] border border-white/10 rounded-2xl p-4 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-400 resize-none leading-relaxed"
                />
              </div>

              {replySuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>{replySuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setReplyModalMessage(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {sendingReply ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Dispatching Email...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send Official Reply</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
