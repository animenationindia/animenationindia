'use server';

import { db } from '@/lib/db';
import { user, watchlist, contactMessages, userReviews, reactions, notifications } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, desc, ilike, or, count, and } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { getAdminReplyEmailTemplate } from '@/lib/email-templates';

const ADMIN_EMAILS = [
  'shouvikdaswork@gmail.com',
  'animenationindia.global@gmail.com',
  'animenationindia.support@gmail.com',
];

export async function verifyIsAdmin(): Promise<{ isAdmin: boolean; user?: any }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { isAdmin: false };
    }

    const email = (session.user.email || '').toLowerCase();
    if (ADMIN_EMAILS.includes(email) || (session.user as any).role === 'admin') {
      return { isAdmin: true, user: session.user };
    }

    // Double check database user role
    const dbUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (dbUser.length > 0 && dbUser[0].role === 'admin') {
      return { isAdmin: true, user: session.user };
    }

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

    return {
      success: true,
      stats: {
        totalUsers: Number(userCountRes?.val || 0),
        totalWatchlists: Number(watchlistCountRes?.val || 0),
        totalMessages: Number(messagesCountRes?.val || 0),
        totalReviews: Number(reviewsCountRes?.val || 0),
        totalReactions: Number(reactionsCountRes?.val || 0),
        databaseStatus: 'Healthy (Neon PostgreSQL)',
        uptime: process.uptime(),
      },
    };
  } catch (err: any) {
    console.error('Error getting admin stats:', err);
    return { success: false, error: err.message };
  }
}

export async function getAdminUsersList({ search = '' }: { search?: string } = {}) {
  const { isAdmin } = await verifyIsAdmin();
  if (!isAdmin) return { success: false, error: 'Forbidden', users: [] };

  try {
    let query = db.select().from(user);

    if (search.trim()) {
      const s = `%${search.trim()}%`;
      query = query.where(or(ilike(user.name, s), ilike(user.email, s))) as any;
    }

    const rows = await query.orderBy(desc(user.createdAt)).limit(100);

    return { success: true, users: rows };
  } catch (err: any) {
    console.error('Error getting admin users:', err);
    return { success: false, error: err.message, users: [] };
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

    // Send email using our Google Apps Script Webhook
    await sendEmail({
      to: msg.email,
      subject: emailTmpl.subject,
      html: emailTmpl.html,
      fromName: 'Anime Nation India Support',
      replyTo: 'animenationindia.support@gmail.com',
    });

    // Mark as replied in database
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
