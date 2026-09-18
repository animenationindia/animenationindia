'use server';

import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { eq, or, isNull, desc } from 'drizzle-orm';

export async function getUserNotifications() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    let query = db.select().from(notifications);

    if (userId) {
      query = query.where(or(isNull(notifications.userId), eq(notifications.userId, userId))) as any;
    } else {
      query = query.where(isNull(notifications.userId)) as any;
    }

    const rows = await query.orderBy(desc(notifications.createdAt)).limit(30);

    return {
      success: true,
      notifications: rows.map((r) => ({
        id: r.id,
        title: r.title,
        message: r.message,
        type: r.type,
        link: r.link,
        isRead: r.isRead,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  } catch (err: any) {
    console.error('Error fetching notifications:', err);
    return { success: false, notifications: [], error: err.message };
  }
}

export async function markNotificationAsRead(notifId: string) {
  try {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notifId));
    return { success: true };
  } catch (err: any) {
    console.error('Error marking notification as read:', err);
    return { success: false, error: err.message };
  }
}
