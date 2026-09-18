'use server';

import { db } from '@/lib/db';
import { catalogs } from '@/lib/db/schema';
import { resolveAuthUser } from '@/app/actions/auth';
import { eq, and, like } from 'drizzle-orm';
import {
  MusicPlaylistData,
  DEFAULT_MUSIC_PLAYLISTS,
  SavedMusicTrack,
} from '@/lib/music-shared';

/**
 * Fetch all music playlists for authenticated user from Neon DB.
 * Merges with default playlists so Liked, OP, ED, OST are always present.
 */
export async function getUserMusicPlaylists(): Promise<{
  playlists: MusicPlaylistData[];
  authenticated: boolean;
}> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { playlists: DEFAULT_MUSIC_PLAYLISTS, authenticated: false };
    }

    const rows = await db
      .select()
      .from(catalogs)
      .where(
        and(
          eq(catalogs.userId, authUser.id),
          like(catalogs.catalogId, 'music_%')
        )
      );

    const dbMap = new Map<string, MusicPlaylistData>();
    rows.forEach((r) => {
      let tracks: SavedMusicTrack[] = [];
      try {
        tracks = JSON.parse(r.itemIds || '[]');
      } catch {}

      dbMap.set(r.catalogId, {
        id: r.catalogId,
        name: r.name,
        color: (r.color as any) || 'pink',
        icon: (r.thumbnail as any) || 'Music',
        isDefault: DEFAULT_MUSIC_PLAYLISTS.some((def) => def.id === r.catalogId),
        tracks: Array.isArray(tracks) ? tracks : [],
      });
    });

    // Merge with default playlists so they always exist
    const result: MusicPlaylistData[] = DEFAULT_MUSIC_PLAYLISTS.map((def) => {
      if (dbMap.has(def.id)) {
        return dbMap.get(def.id)!;
      }
      return { ...def, tracks: [] };
    });

    // Append custom playlists created by user
    dbMap.forEach((pl, id) => {
      if (!DEFAULT_MUSIC_PLAYLISTS.some((def) => def.id === id)) {
        result.push(pl);
      }
    });

    return { playlists: result, authenticated: true };
  } catch (err) {
    console.error('Error fetching user music playlists:', err);
    return { playlists: DEFAULT_MUSIC_PLAYLISTS, authenticated: false };
  }
}

/**
 * Save a music track into one or multiple playlists in Neon DB.
 */
export async function saveTrackToMusicPlaylists({
  playlistIds,
  track,
}: {
  playlistIds: string[];
  track: SavedMusicTrack;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized: Please log in to save music' };
    }

    if (!playlistIds || playlistIds.length === 0) {
      return { success: false, error: 'No playlists selected' };
    }

    for (const playlistId of playlistIds) {
      const existing = await db
        .select()
        .from(catalogs)
        .where(
          and(
            eq(catalogs.userId, authUser.id),
            eq(catalogs.catalogId, playlistId)
          )
        )
        .limit(1);

      let currentTracks: SavedMusicTrack[] = [];
      if (existing.length > 0) {
        try {
          currentTracks = JSON.parse(existing[0].itemIds || '[]');
        } catch {}
      }

      // Check if already in playlist; if so, replace/update it, else prepend
      const filtered = currentTracks.filter((t) => String(t.id) !== String(track.id));
      const updatedTracks = [track, ...filtered];
      const jsonTracks = JSON.stringify(updatedTracks);

      const defaultDef = DEFAULT_MUSIC_PLAYLISTS.find((p) => p.id === playlistId);
      const name = existing[0]?.name || defaultDef?.name || 'Custom Playlist';
      const color = existing[0]?.color || defaultDef?.color || 'pink';
      const icon = existing[0]?.thumbnail || defaultDef?.icon || 'Music';

      if (existing.length > 0) {
        await db
          .update(catalogs)
          .set({
            itemIds: jsonTracks,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(catalogs.userId, authUser.id),
              eq(catalogs.catalogId, playlistId)
            )
          );
      } else {
        await db.insert(catalogs).values({
          userId: authUser.id,
          catalogId: playlistId,
          name,
          color,
          thumbnail: icon,
          itemIds: jsonTracks,
        });
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saving track to music playlists:', err);
    return { success: false, error: err?.message || 'Failed to save track' };
  }
}

/**
 * Remove a track from a specific music playlist in Neon DB.
 */
export async function removeTrackFromMusicPlaylist({
  playlistId,
  trackId,
}: {
  playlistId: string;
  trackId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const existing = await db
      .select()
      .from(catalogs)
      .where(
        and(
          eq(catalogs.userId, authUser.id),
          eq(catalogs.catalogId, playlistId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return { success: true };
    }

    let currentTracks: SavedMusicTrack[] = [];
    try {
      currentTracks = JSON.parse(existing[0].itemIds || '[]');
    } catch {}

    const updatedTracks = currentTracks.filter((t) => String(t.id) !== String(trackId));

    await db
      .update(catalogs)
      .set({
        itemIds: JSON.stringify(updatedTracks),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(catalogs.userId, authUser.id),
          eq(catalogs.catalogId, playlistId)
        )
      );

    return { success: true };
  } catch (err: any) {
    console.error('Error removing track from playlist:', err);
    return { success: false, error: err?.message || 'Failed to remove track' };
  }
}

/**
 * Create a new custom music playlist in Neon DB.
 */
export async function createCustomMusicPlaylist({
  name,
  color = 'purple',
  icon = 'Music',
}: {
  name: string;
  color?: 'pink' | 'emerald' | 'purple' | 'rose' | 'amber' | 'cyan';
  icon?: 'Heart' | 'Flame' | 'Moon' | 'Music' | 'Sparkles' | 'Radio' | 'Disc';
}): Promise<{ success: boolean; playlist?: MusicPlaylistData; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }

    const cleanName = name.trim();
    if (!cleanName) {
      return { success: false, error: 'Playlist name cannot be empty' };
    }

    const playlistId = `music_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await db.insert(catalogs).values({
      userId: authUser.id,
      catalogId: playlistId,
      name: cleanName,
      color,
      thumbnail: icon,
      itemIds: '[]',
    });

    const newPlaylist: MusicPlaylistData = {
      id: playlistId,
      name: cleanName,
      color,
      icon,
      isDefault: false,
      tracks: [],
    };

    return { success: true, playlist: newPlaylist };
  } catch (err: any) {
    console.error('Error creating custom music playlist:', err);
    return { success: false, error: err?.message || 'Failed to create playlist' };
  }
}

/**
 * Delete a custom music playlist in Neon DB (default ones cannot be deleted).
 */
export async function deleteCustomMusicPlaylist(
  playlistId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const authUser = await resolveAuthUser();
    if (!authUser?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (DEFAULT_MUSIC_PLAYLISTS.some((def) => def.id === playlistId)) {
      return { success: false, error: 'Default playlists cannot be deleted' };
    }

    await db
      .delete(catalogs)
      .where(
        and(
          eq(catalogs.userId, authUser.id),
          eq(catalogs.catalogId, playlistId)
        )
      );

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting music playlist:', err);
    return { success: false, error: err?.message || 'Failed to delete playlist' };
  }
}
