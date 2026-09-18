'use server';

import { db } from '@/lib/db';
import { songPlaylists } from '@/lib/db/schema';
import { resolveAuthUser } from '@/app/actions/auth';
import { eq, and } from 'drizzle-orm';

export interface SongItem {
  songId: string;
  type?: string;
  sequence?: number;
  slug?: string;
  songTitle: string;
  artists?: string[];
  videoUrl?: string;
  audioUrl?: string;
  animeId?: number;
  animeTitle?: string;
  animeImage?: string;
  addedAt?: string;
}

/**
 * Fetch favorite song IDs for current logged-in user directly from Neon PostgreSQL
 */
export async function getUserFavoriteSongIds(): Promise<{ songIds: string[]; authenticated: boolean }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { songIds: [], authenticated: false };
    }

    const rows = await db
      .select()
      .from(songPlaylists)
      .where(and(eq(songPlaylists.userId, authUser.id), eq(songPlaylists.isFavorites, true)))
      .limit(1);

    if (rows.length === 0) {
      return { songIds: [], authenticated: true };
    }

    const songs: SongItem[] = JSON.parse(rows[0].songs || '[]');
    const songIds = songs.map((s) => String(s.songId));

    return { songIds, authenticated: true };
  } catch (err) {
    console.error('Error fetching favorite songs from Neon DB:', err);
    return { songIds: [], authenticated: false };
  }
}

/**
 * Toggle favorite song (add/remove) in Neon PostgreSQL
 */
export async function toggleUserFavoriteSong(song: SongItem): Promise<{
  success: boolean;
  isFavorite: boolean;
  error?: string;
}> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, isFavorite: false, error: 'Please sign in to favorite songs' };
    }

    const rows = await db
      .select()
      .from(songPlaylists)
      .where(and(eq(songPlaylists.userId, authUser.id), eq(songPlaylists.isFavorites, true)))
      .limit(1);

    const strSongId = String(song.songId);

    if (rows.length === 0) {
      // Create Favorites playlist and add song
      const initialSongs: SongItem[] = [{ ...song, songId: strSongId, addedAt: new Date().toISOString() }];
      await db.insert(songPlaylists).values({
        userId: authUser.id,
        name: 'Favorite Themes',
        description: 'Your favorite anime opening and ending theme songs.',
        isFavorites: true,
        songs: JSON.stringify(initialSongs),
      });

      return { success: true, isFavorite: true };
    }

    const currentRecord = rows[0];
    let songs: SongItem[] = [];
    try {
      songs = JSON.parse(currentRecord.songs || '[]');
    } catch {}

    const exists = songs.some((s) => String(s.songId) === strSongId);
    let updatedSongs: SongItem[] = [];
    let isNowFavorite = false;

    if (exists) {
      // Remove song
      updatedSongs = songs.filter((s) => String(s.songId) !== strSongId);
      isNowFavorite = false;
    } else {
      // Add song
      updatedSongs = [...songs, { ...song, songId: strSongId, addedAt: new Date().toISOString() }];
      isNowFavorite = true;
    }

    await db
      .update(songPlaylists)
      .set({
        songs: JSON.stringify(updatedSongs),
        updatedAt: new Date(),
      })
      .where(eq(songPlaylists.id, currentRecord.id));

    return { success: true, isFavorite: isNowFavorite };
  } catch (err: any) {
    console.error('Error toggling favorite song in Neon DB:', err);
    return { success: false, isFavorite: false, error: err.message };
  }
}

/**
 * Fetch all song playlists for user from Neon PostgreSQL
 */
export async function getUserSongPlaylists(): Promise<{
  playlists: Array<{ id: number; name: string; description: string; isFavorites: boolean; songs: SongItem[] }>;
  authenticated: boolean;
}> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { playlists: [], authenticated: false };
    }

    const rows = await db
      .select()
      .from(songPlaylists)
      .where(eq(songPlaylists.userId, authUser.id));

    const parsed = rows.map((r) => {
      let songs: SongItem[] = [];
      try {
        songs = JSON.parse(r.songs || '[]');
      } catch {}
      return {
        id: r.id,
        name: r.name,
        description: r.description || '',
        isFavorites: r.isFavorites,
        songs,
      };
    });

    return { playlists: parsed, authenticated: true };
  } catch (err) {
    console.error('Error fetching song playlists from Neon DB:', err);
    return { playlists: [], authenticated: false };
  }
}
