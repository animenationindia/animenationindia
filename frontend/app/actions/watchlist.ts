'use server';

import { db } from '@/lib/db';
import { watchlist, catalogs } from '@/lib/db/schema';
import { resolveAuthUser } from '@/app/actions/auth';
import { eq, and, desc } from 'drizzle-orm';

export interface WatchlistItem {
  id?: number;
  mediaId: string;
  mediaType: string;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  rating?: string | null;
  year?: string | null;
  status?: string;
  progress?: number;
  createdAt?: string;
}

export async function getCurrentAuthUser() {
  try {
    return await resolveAuthUser();
  } catch {
    return null;
  }
}

export async function getWatchlist(): Promise<{ items: WatchlistItem[]; success: boolean }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { items: [], success: false };
    }

    const rows = await db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, authUser.id))
      .orderBy(desc(watchlist.createdAt));

    const items: WatchlistItem[] = rows.map((r) => ({
      id: r.id,
      mediaId: r.mediaId,
      mediaType: r.mediaType,
      title: r.title,
      posterPath: r.posterPath,
      backdropPath: r.backdropPath,
      rating: r.rating,
      year: r.year,
      status: r.status,
      progress: r.progress || 0,
      createdAt: r.createdAt.toISOString(),
    }));

    return { items, success: true };
  } catch (err) {
    console.error('Error fetching watchlist:', err);
    return { items: [], success: false };
  }
}

export async function addToWatchlist(item: {
  mediaId: string | number;
  mediaType: string;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  rating?: string | null;
  year?: string | null;
  status?: string;
  progress?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const strId = String(item.mediaId);
    const normalizedStatus = (item.status || 'plan_to_watch').toLowerCase().replace(/\s+/g, '_');

    const existing = await db
      .select()
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, authUser.id),
          eq(watchlist.mediaId, strId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(watchlist).values({
        userId: authUser.id,
        mediaId: strId,
        mediaType: item.mediaType,
        title: item.title,
        posterPath: item.posterPath || null,
        backdropPath: item.backdropPath || null,
        rating: item.rating || null,
        year: item.year || null,
        status: normalizedStatus,
        progress: item.progress !== undefined ? item.progress : 0,
      });
    } else {
      // Update existing item status and metadata if provided
      const updateData: any = { updatedAt: new Date() };
      if (item.mediaType) updateData.mediaType = item.mediaType;
      if (item.status) updateData.status = normalizedStatus;
      if (item.progress !== undefined) updateData.progress = item.progress;
      if (item.posterPath) updateData.posterPath = item.posterPath;
      if (item.rating) updateData.rating = item.rating;

      await db
        .update(watchlist)
        .set(updateData)
        .where(
          and(
            eq(watchlist.userId, authUser.id),
            eq(watchlist.mediaId, strId)
          )
        );
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error adding to watchlist:', err);
    return { success: false, error: err.message };
  }
}

export async function updateWatchlistStatus(
  mediaId: string | number,
  mediaType: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const strId = String(mediaId);
    const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');

    await db
      .update(watchlist)
      .set({
        status: normalizedStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(watchlist.userId, authUser.id),
          eq(watchlist.mediaId, strId)
        )
      );

    return { success: true };
  } catch (err: any) {
    console.error('Error updating watchlist status:', err);
    return { success: false, error: err.message };
  }
}

export async function updateWatchlistProgress(
  mediaId: string | number,
  mediaType: string,
  progress: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const strId = String(mediaId);
    const validProgress = Math.max(0, Math.floor(progress));

    await db
      .update(watchlist)
      .set({
        progress: validProgress,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(watchlist.userId, authUser.id),
          eq(watchlist.mediaId, strId)
        )
      );

    return { success: true };
  } catch (err: any) {
    console.error('Error updating watchlist progress:', err);
    return { success: false, error: err.message };
  }
}

export async function removeFromWatchlist(
  mediaId: string | number,
  mediaType?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const strId = String(mediaId);

    // Unconditionally delete by userId and mediaId to prevent silent failures caused by mediaType mismatches
    await db
      .delete(watchlist)
      .where(
        and(
          eq(watchlist.userId, authUser.id),
          eq(watchlist.mediaId, strId)
        )
      );

    return { success: true };
  } catch (err: any) {
    console.error('Error removing from watchlist:', err);
    return { success: false, error: err.message };
  }
}

export async function isInWatchlist(mediaId: string | number, mediaType?: string): Promise<boolean> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) return false;

    const rows = await db
      .select({ id: watchlist.id })
      .from(watchlist)
      .where(
        and(
          eq(watchlist.userId, authUser.id),
          eq(watchlist.mediaId, String(mediaId))
        )
      )
      .limit(1);

    return rows.length > 0;
  } catch {
    return false;
  }
}

export async function syncGuestWatchlist(guestItems: any[]) {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id || !Array.isArray(guestItems)) return { success: false };

    for (const item of guestItems) {
      const mediaId = String(item.mediaId || item.tmdbId || item.id);
      const mediaType = item.mediaType || item.type || 'anime';
      if (!mediaId || !item.title) continue;

      const existing = await db
        .select()
        .from(watchlist)
        .where(
          and(
            eq(watchlist.userId, authUser.id),
            eq(watchlist.mediaId, mediaId),
            eq(watchlist.mediaType, mediaType)
          )
        )
        .limit(1);

      if (existing.length === 0) {
        await db.insert(watchlist).values({
          userId: authUser.id,
          mediaId,
          mediaType,
          title: item.title,
          posterPath: item.posterPath || item.coverImage || null,
          backdropPath: item.backdropPath || null,
          rating: item.rating || (item.voteAverage ? item.voteAverage.toFixed(1) : null),
          year: item.year || null,
          status: 'plan_to_watch',
        });
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Error syncing guest watchlist:', err);
    return { success: false };
  }
}
