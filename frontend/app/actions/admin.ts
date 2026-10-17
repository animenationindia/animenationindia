'use server';

import { db } from '@/lib/db';
import { user, watchlist, contactMessages, userReviews, reactions, notifications } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { resolveAuthUser } from '@/app/actions/auth';
import { headers } from 'next/headers';
import { eq, desc, ilike, or, count, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { getAdminReplyEmailTemplate } from '@/lib/email-templates';

const ADMIN_EMAILS = [
  'shouvikdaswork@gmail.com',
  'animenationindia.global@gmail.com',
  'animenationindia.support@gmail.com',
];

const SERVER_BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5050' : 'https://animenationindia.onrender.com');
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'ani2026admin';

export async function verifyIsAdmin(passcodeOverride?: string): Promise<{ isAdmin: boolean; user?: any }> {
  try {
    // 1. Passcode override check
    if (passcodeOverride && passcodeOverride === ADMIN_PASSCODE) {
      return {
        isAdmin: true,
        user: {
          id: 'admin_master_override',
          name: 'Master Admin (Passcode)',
          email: 'shouvikdaswork@gmail.com',
          role: 'admin',
        },
      };
    }

    // 2. Resolve Auth User (via Better Auth & Token cookies)
    const authUser = await resolveAuthUser();
    if (authUser?.id) {
      const email = (authUser.email || '').toLowerCase();
      if (ADMIN_EMAILS.includes(email) || ('role' in authUser && (authUser as any).role === 'admin')) {
        return { isAdmin: true, user: authUser };
      }

      // Check DB directly
      const dbUser = await db
        .select()
        .from(user)
        .where(eq(user.id, authUser.id))
        .limit(1);

      if (dbUser.length > 0) {
        const dbEmail = (dbUser[0].email || '').toLowerCase();
        if (dbUser[0].role === 'admin' || ADMIN_EMAILS.includes(dbEmail)) {
          return { isAdmin: true, user: dbUser[0] };
        }
      }
    }

    // 3. Fallback to native Better-Auth session API
    try {
      const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
      if (session?.user?.id) {
        const email = (session.user.email || '').toLowerCase();
        if (ADMIN_EMAILS.includes(email) || (session.user as any).role === 'admin') {
          return { isAdmin: true, user: session.user };
        }
      }
    } catch {}

    return { isAdmin: false };
  } catch (err) {
    console.error('Error verifying admin:', err);
    return { isAdmin: false };
  }
}

export async function getAdminStats() {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    const [userCountRes] = await db.select({ val: count() }).from(user);
    const [watchlistCountRes] = await db.select({ val: count() }).from(watchlist);
    const [messagesCountRes] = await db.select({ val: count() }).from(contactMessages);
    const [reviewsCountRes] = await db.select({ val: count() }).from(userReviews);
    const [reactionsCountRes] = await db.select({ val: count() }).from(reactions);
    const [broadcastsCountRes] = await db.select({ val: count() }).from(notifications);

    // Fetch Article count from backend
    let articleCount = 0;
    try {
      const artRes = await fetch(`${SERVER_BACKEND_URL}/api/articles?limit=1`, { cache: 'no-store' });
      if (artRes.ok) {
        const artData = await artRes.json();
        articleCount = artData?.pagination?.total || (Array.isArray(artData?.data) ? artData.data.length : 0);
      }
    } catch {}

    return {
      success: true,
      stats: {
        totalUsers: Number(userCountRes?.val || 0),
        totalWatchlists: Number(watchlistCountRes?.val || 0),
        totalMessages: Number(messagesCountRes?.val || 0),
        totalReviews: Number(reviewsCountRes?.val || 0),
        totalReactions: Number(reactionsCountRes?.val || 0),
        totalBroadcasts: Number(broadcastsCountRes?.val || 0),
        totalArticles: articleCount,
        databaseStatus: 'Healthy (Neon PostgreSQL)',
        uptime: process.uptime(),
      },
    };
  } catch (err: any) {
    console.error('Error getting admin stats:', err);
    return { success: false, error: err.message };
  }
}

export async function getAdminUsersList({
  search = '',
  role = 'all',
}: { search?: string; role?: string } = {}) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden', users: [] };

  try {
    let query = db.select().from(user);

    const conditions: any[] = [];

    if (search.trim()) {
      const s = `%${search.trim()}%`;
      conditions.push(or(ilike(user.name, s), ilike(user.email, s)));
    }

    if (role && role !== 'all') {
      conditions.push(eq(user.role, role));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const rows = await query.orderBy(desc(user.createdAt)).limit(100);

    return { success: true, users: rows };
  } catch (err: any) {
    console.error('Error getting admin users:', err);
    return { success: false, error: err.message, users: [] };
  }
}

export async function updateUserRole({
  userId,
  newRole,
}: {
  userId: string;
  newRole: string;
}) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  if (!['admin', 'vip', 'user'].includes(newRole)) {
    return { success: false, error: 'Invalid role. Must be admin, vip, or user.' };
  }

  try {
    const target = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (target.length === 0) return { success: false, error: 'User not found' };

    const email = (target[0].email || '').toLowerCase();
    if (ADMIN_EMAILS.includes(email) && newRole !== 'admin') {
      return { success: false, error: 'Cannot demote Master Admin account.' };
    }

    await db
      .update(user)
      .set({ role: newRole, updatedAt: new Date() })
      .where(eq(user.id, userId));

    return { success: true, message: `User role updated to ${newRole.toUpperCase()}` };
  } catch (err: any) {
    console.error('Error updating user role:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteAdminUser(userId: string) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    const target = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (target.length === 0) return { success: false, error: 'User not found' };

    const email = (target[0].email || '').toLowerCase();
    if (ADMIN_EMAILS.includes(email) || target[0].role === 'admin') {
      return { success: false, error: 'Master Admin accounts cannot be deleted.' };
    }

    await db.delete(user).where(eq(user.id, userId));
    return { success: true, message: 'User account purged successfully.' };
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return { success: false, error: err.message };
  }
}

export async function getAdminContactMessages() {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden', messages: [] };

  try {
    const rows = await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt))
      .limit(100);

    return { success: true, messages: rows };
  } catch (err: any) {
    console.error('Error fetching contact messages:', err);
    return { success: false, error: err.message, messages: [] };
  }
}

export async function replyToContactMessage({
  messageId,
  replyText,
}: {
  messageId: string;
  replyText: string;
}) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    const existing = await db
      .select()
      .from(contactMessages)
      .where(eq(contactMessages.id, messageId))
      .limit(1);

    if (existing.length === 0) return { success: false, error: 'Message not found' };

    const msg = existing[0];
    const emailTmpl = getAdminReplyEmailTemplate({
      userName: msg.name,
      subject: msg.topic || 'Inquiry',
      message: msg.message,
      replyText: replyText.trim(),
    });

    await sendEmail({
      to: msg.email,
      subject: emailTmpl.subject,
      html: emailTmpl.html,
      fromName: 'Anime Nation India Support',
      replyTo: 'animenationindia.support@gmail.com',
    });

    await db
      .update(contactMessages)
      .set({ status: 'replied', replyText: replyText.trim(), updatedAt: new Date() })
      .where(eq(contactMessages.id, messageId));

    return { success: true };
  } catch (err: any) {
    console.error('Error replying to contact message:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteContactMessage(messageId: string) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    await db.delete(contactMessages).where(eq(contactMessages.id, messageId));
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting contact message:', err);
    return { success: false, error: err.message };
  }
}

export async function sendSystemBroadcast({
  title,
  message,
  type = 'system',
  link = '',
}: {
  title: string;
  message: string;
  type?: 'info' | 'release' | 'system' | 'social';
  link?: string;
}) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    const notifId = `broadcast_${Date.now()}`;
    await db.insert(notifications).values({
      id: notifId,
      userId: null, // Null indicates global broadcast for all users
      title: title.trim(),
      message: message.trim(),
      type,
      link: link.trim() || null,
      isRead: false,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error sending system broadcast:', err);
    return { success: false, error: err.message };
  }
}

export async function getAdminBroadcastsList() {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden', broadcasts: [] };

  try {
    const rows = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    return { success: true, broadcasts: rows };
  } catch (err: any) {
    console.error('Error fetching broadcasts:', err);
    return { success: false, error: err.message, broadcasts: [] };
  }
}

export async function deleteAdminBroadcast(id: string) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    await db.delete(notifications).where(eq(notifications.id, id));
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting broadcast:', err);
    return { success: false, error: err.message };
  }
}

export async function getAdminRecentReviews(limitCount = 40) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden', reviews: [] };

  try {
    const rows = await db
      .select({
        review: userReviews,
        user: {
          name: user.name,
          email: user.email,
        },
      })
      .from(userReviews)
      .leftJoin(user, eq(userReviews.userId, user.id))
      .orderBy(desc(userReviews.createdAt))
      .limit(limitCount);

    return { success: true, reviews: rows };
  } catch (err: any) {
    console.error('Error fetching admin reviews:', err);
    return { success: false, error: err.message, reviews: [] };
  }
}

export async function deleteAdminReview(reviewId: string) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    await db.delete(userReviews).where(eq(userReviews.id, reviewId));
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting review:', err);
    return { success: false, error: err.message };
  }
}

// ==========================================
// 📰 ARTICLE & NEWS CMS ACTIONS
// ==========================================

export async function getAdminArticlesList() {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden', articles: [] };

  try {
    const res = await fetch(`${SERVER_BACKEND_URL}/api/articles?limit=50`, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) return { success: false, error: `Backend HTTP ${res.status}`, articles: [] };
    const data = await res.json();
    return { success: true, articles: data?.data || [] };
  } catch (err: any) {
    console.error('Error fetching admin articles:', err);
    return { success: false, error: err.message, articles: [] };
  }
}

export async function createAdminArticle(payload: {
  title: string;
  slug?: string;
  snippet?: string;
  content: string;
  coverImage: string;
  category?: string;
  tags?: string;
  author?: string;
  featured?: boolean;
}) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    const res = await fetch(`${SERVER_BACKEND_URL}/api/articles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': ADMIN_PASSCODE,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error creating admin article:', err);
    return { success: false, message: err.message };
  }
}

export async function deleteAdminArticle(articleId: string) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    const res = await fetch(`${SERVER_BACKEND_URL}/api/articles/${encodeURIComponent(articleId)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-passcode': ADMIN_PASSCODE,
      },
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error deleting article:', err);
    return { success: false, message: err.message };
  }
}

// ==========================================
// 🌟 CURATED SPOTLIGHT ANIME ACTIONS
// ==========================================

export async function getAdminCuratedList(sectionKey?: string) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden', curated: [] };

  try {
    const url = sectionKey
      ? `${SERVER_BACKEND_URL}/api/curated/${sectionKey}`
      : `${SERVER_BACKEND_URL}/api/curated`;

    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) return { success: false, error: `Backend HTTP ${res.status}`, curated: [] };
    const data = await res.json();
    return { success: true, curated: data?.data || [] };
  } catch (err: any) {
    console.error('Error fetching curated list:', err);
    return { success: false, error: err.message, curated: [] };
  }
}

export async function addAdminCuratedItem(item: {
  id: number;
  idMal?: number;
  title: { english: string; romaji?: string };
  coverImage: { large?: string; extraLarge?: string };
  section: string;
  sectionName?: string;
  format?: string;
  averageScore?: number;
  seasonYear?: number;
  genres?: string[];
  order?: number;
}) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    const res = await fetch(`${SERVER_BACKEND_URL}/api/curated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-passcode': ADMIN_PASSCODE,
      },
      body: JSON.stringify(item),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error adding curated anime:', err);
    return { success: false, message: err.message };
  }
}

export async function deleteAdminCuratedItem(id: number | string, section?: string) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden' };

  try {
    const query = section ? `?section=${encodeURIComponent(section)}` : '';
    const res = await fetch(`${SERVER_BACKEND_URL}/api/curated/${encodeURIComponent(id)}${query}`, {
      method: 'DELETE',
      headers: {
        'x-admin-passcode': ADMIN_PASSCODE,
      },
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Error deleting curated anime:', err);
    return { success: false, message: err.message };
  }
}
