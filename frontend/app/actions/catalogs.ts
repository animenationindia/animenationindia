'use server';

import { db } from '@/lib/db';
import { catalogs, reactions, userReviews, user, watchlist } from '@/lib/db/schema';
import { resolveAuthUser } from '@/app/actions/auth';
import { eq, and, desc } from 'drizzle-orm';
import { CatalogData } from '@/lib/catalogs-shared';

export async function getUserCatalogs(): Promise<{ catalogs: CatalogData[]; authenticated: boolean }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { catalogs: [], authenticated: false };
    }

    const rows = await db
      .select()
      .from(catalogs)
      .where(eq(catalogs.userId, authUser.id));

    const parsed: CatalogData[] = rows.map((r) => {
      let itemIds: (string | number)[] = [];
      try {
        itemIds = JSON.parse(r.itemIds);
      } catch {}
      return {
        id: r.catalogId,
        name: r.name,
        color: (r.color as any) || 'pink',
        thumbnail: (r.thumbnail as any) || 'Folder',
        itemIds,
        custom: true,
      };
    });

    return { catalogs: parsed, authenticated: true };
  } catch (err) {
    console.error('Error fetching user catalogs:', err);
    return { catalogs: [], authenticated: false };
  }
}

export async function saveUserCatalog(catalog: CatalogData): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const itemIdsStr = JSON.stringify(catalog.itemIds || []);

    const existing = await db
      .select()
      .from(catalogs)
      .where(and(eq(catalogs.userId, authUser.id), eq(catalogs.catalogId, catalog.id)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(catalogs)
        .set({
          name: catalog.name,
          color: catalog.color,
          thumbnail: catalog.thumbnail || 'Folder',
          itemIds: itemIdsStr,
          updatedAt: new Date(),
        })
        .where(and(eq(catalogs.userId, authUser.id), eq(catalogs.catalogId, catalog.id)));
    } else {
      await db.insert(catalogs).values({
        userId: authUser.id,
        catalogId: catalog.id,
        name: catalog.name,
        color: catalog.color,
        thumbnail: catalog.thumbnail || 'Folder',
        itemIds: itemIdsStr,
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saving user catalog:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteUserCatalog(catalogId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .delete(catalogs)
      .where(and(eq(catalogs.userId, authUser.id), eq(catalogs.catalogId, catalogId)));

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting user catalog:', err);
    return { success: false, error: err.message };
  }
}

export async function removeFromAllCatalogs(mediaId: string | number, mediaType: string = 'anime') {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) return { success: false };

    const userCats = await db
      .select()
      .from(catalogs)
      .where(eq(catalogs.userId, authUser.id));

    for (const cat of userCats) {
      try {
        const itemIds: (string | number)[] = JSON.parse(cat.itemIds || '[]');
        const filtered = itemIds.filter((id) => String(id) !== String(mediaId));
        if (filtered.length !== itemIds.length) {
          await db
            .update(catalogs)
            .set({ itemIds: JSON.stringify(filtered), updatedAt: new Date() })
            .where(eq(catalogs.id, cat.id));
        }
      } catch {}
    }

    return { success: true };
  } catch (err) {
    console.error('Error removing from all catalogs:', err);
    return { success: false };
  }
}

// ==========================================
// 👍 REACTIONS: WATCHED / LIKED / DISLIKED
// ==========================================

export async function getUserReactions(): Promise<{
  watchedIds: string[];
  likedIds: string[];
  dislikedIds: string[];
  authenticated: boolean;
}> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { watchedIds: [], likedIds: [], dislikedIds: [], authenticated: false };
    }

    const rows = await db
      .select()
      .from(reactions)
      .where(eq(reactions.userId, authUser.id));

    const watchedSet = new Set<string>();
    const likedSet = new Set<string>();
    const dislikedSet = new Set<string>();

    rows.forEach((r) => {
      if (r.isWatched) watchedSet.add(String(r.mediaId));
      if (r.isLiked) likedSet.add(String(r.mediaId));
      if (r.isDisliked) dislikedSet.add(String(r.mediaId));
    });

    return {
      watchedIds: Array.from(watchedSet),
      likedIds: Array.from(likedSet),
      dislikedIds: Array.from(dislikedSet),
      authenticated: true,
    };
  } catch (err) {
    console.error('Error fetching reactions:', err);
    return { watchedIds: [], likedIds: [], dislikedIds: [], authenticated: false };
  }
}

export async function removeUserReaction(
  mediaId: string | number,
  reactionType: 'watched' | 'liked' | 'disliked'
): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const strId = String(mediaId);
    const existing = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.userId, authUser.id),
          eq(reactions.mediaId, strId)
        )
      );

    for (const current of existing) {
      const updatePayload: any = { updatedAt: new Date() };
      if (reactionType === 'watched') updatePayload.isWatched = false;
      if (reactionType === 'liked') updatePayload.isLiked = false;
      if (reactionType === 'disliked') updatePayload.isDisliked = false;

      await db
        .update(reactions)
        .set(updatePayload)
        .where(eq(reactions.id, current.id));
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error removing user reaction:', err);
    return { success: false, error: err.message };
  }
}

export async function toggleUserReaction(
  mediaId: string | number,
  mediaType: string = 'anime',
  reactionType: 'watched' | 'liked' | 'disliked',
  meta?: { title?: string; posterPath?: string; rating?: string; year?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const strId = String(mediaId);
    const normalizedMediaType = mediaType.toLowerCase();
    const existing = await db
      .select()
      .from(reactions)
      .where(
        and(
          eq(reactions.userId, authUser.id),
          eq(reactions.mediaId, strId)
        )
      );

    if (existing.length > 0) {
      const current = existing[0];
      let updatePayload: any = { updatedAt: new Date(), mediaType: normalizedMediaType };

      if (reactionType === 'watched') {
        updatePayload.isWatched = !current.isWatched;
      } else if (reactionType === 'liked') {
        const next = !current.isLiked;
        updatePayload.isLiked = next;
        if (next) updatePayload.isDisliked = false;
      } else if (reactionType === 'disliked') {
        const next = !current.isDisliked;
        updatePayload.isDisliked = next;
        if (next) updatePayload.isLiked = false;
      }

      await db
        .update(reactions)
        .set(updatePayload)
        .where(eq(reactions.id, current.id));

      // Permanently remove duplicate rows for this user + mediaId if any existed
      if (existing.length > 1) {
        for (let i = 1; i < existing.length; i++) {
          await db.delete(reactions).where(eq(reactions.id, existing[i].id));
        }
      }
    } else {
      await db.insert(reactions).values({
        userId: authUser.id,
        mediaId: strId,
        mediaType: normalizedMediaType,
        isWatched: reactionType === 'watched',
        isLiked: reactionType === 'liked',
        isDisliked: reactionType === 'disliked',
      });
    }

    // Auto-register in watchlist ONLY for 'watched' reaction.
    // Like / Dislike only save to reactions table — NOT to Main Watchlist.
    if (reactionType === 'watched' && meta?.title) {
      try {
        const existingInWatchlist = await db
          .select({ id: watchlist.id })
          .from(watchlist)
          .where(
            and(
              eq(watchlist.userId, authUser.id),
              eq(watchlist.mediaId, strId),
              eq(watchlist.mediaType, mediaType)
            )
          )
          .limit(1);

        if (existingInWatchlist.length === 0) {
          // Not in watchlist yet — add as completed
          await db.insert(watchlist).values({
            userId: authUser.id,
            mediaId: strId,
            mediaType,
            title: meta.title,
            posterPath: meta.posterPath || null,
            rating: meta.rating || null,
            year: meta.year || null,
            status: 'completed',
            progress: 0,
          });
        } else {
          // Already in watchlist — just update status to completed
          await db
            .update(watchlist)
            .set({ status: 'completed', updatedAt: new Date() })
            .where(
              and(
                eq(watchlist.userId, authUser.id),
                eq(watchlist.mediaId, strId),
                eq(watchlist.mediaType, mediaType)
              )
            );
        }
      } catch (wErr) {
        console.warn('Failed to auto-register watchlist from watched reaction:', wErr);
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error toggling reaction:', err);
    return { success: false, error: err.message };
  }
}

// ==========================================
// ⭐ USER REVIEWS & RATINGS (1-10)
// ==========================================

export async function submitUserReview({
  mediaId,
  mediaType = 'anime',
  score,
  title,
  content,
  tags = [],
}: {
  mediaId: string | number;
  mediaType?: string;
  score: number;
  title: string;
  content: string;
  tags?: string[];
}): Promise<{ success: boolean; review?: any; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Please sign in to publish a review' };
    }

    const strMediaId = String(mediaId);
    const validScore = Math.min(Math.max(score, 1), 10);
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    const tagsStr = JSON.stringify(tags);

    // Check if user already reviewed this anime
    const existing = await db
      .select()
      .from(userReviews)
      .where(
        and(
          eq(userReviews.userId, authUser.id),
          eq(userReviews.mediaId, strMediaId),
          eq(userReviews.mediaType, mediaType)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userReviews)
        .set({
          score: validScore,
          title: cleanTitle,
          content: cleanContent,
          tags: tagsStr,
          updatedAt: new Date(),
        })
        .where(eq(userReviews.id, existing[0].id));

      return {
        success: true,
        review: {
          ...existing[0],
          score: validScore,
          title: cleanTitle,
          content: cleanContent,
          tags,
          userName: authUser.name || 'Otaku Reviewer',
          userAvatar: authUser.image || null,
          updatedAt: new Date().toISOString(),
        },
      };
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newRev = {
      id: reviewId,
      userId: authUser.id,
      mediaId: strMediaId,
      mediaType,
      score: validScore,
      title: cleanTitle,
      content: cleanContent,
      tags: tagsStr,
      helpfulCount: 1,
    };

    await db.insert(userReviews).values(newRev);

    return {
      success: true,
      review: {
        ...newRev,
        userName: authUser.name || 'Otaku Reviewer',
        userAvatar: authUser.image || null,
        tags,
        createdAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    console.error('Error submitting review:', err);
    return { success: false, error: err.message };
  }
}

export async function getUserMediaRating(
  mediaId: string | number,
  mediaType: string = 'anime'
): Promise<{ score: number | null }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) return { score: null };

    const rows = await db
      .select({ score: userReviews.score })
      .from(userReviews)
      .where(
        and(
          eq(userReviews.userId, authUser.id),
          eq(userReviews.mediaId, String(mediaId)),
          eq(userReviews.mediaType, mediaType)
        )
      )
      .limit(1);

    return { score: rows[0]?.score ?? null };
  } catch {
    return { score: null };
  }
}

export async function getMediaUserReviews(mediaId: string | number, mediaType: string = 'anime') {
  try {
    const rows = await db
      .select({
        review: userReviews,
        user: {
          name: user.name,
          image: user.image,
        },
      })
      .from(userReviews)
      .leftJoin(user, eq(userReviews.userId, user.id))
      .where(and(eq(userReviews.mediaId, String(mediaId)), eq(userReviews.mediaType, mediaType)))
      .orderBy(desc(userReviews.createdAt));

    const parsed = rows.map((r) => {
      let tags: string[] = [];
      try {
        tags = JSON.parse(r.review.tags);
      } catch {}
      return {
        id: r.review.id,
        userId: r.review.userId,
        userName: r.user?.name || 'Otaku Reviewer',
        userAvatar: r.user?.image || null,
        score: r.review.score,
        title: r.review.title,
        content: r.review.content,
        tags,
        helpfulCount: r.review.helpfulCount,
        createdAt: r.review.createdAt.toISOString(),
      };
    });

    return { success: true, reviews: parsed };
  } catch (err: any) {
    console.error('Error fetching media reviews:', err);
    return { success: false, reviews: [], error: err.message };
  }
}
