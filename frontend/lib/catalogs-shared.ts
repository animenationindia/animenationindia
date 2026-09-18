export type CatalogThumbnail = 'Folder' | 'Sparkles' | 'BookOpen' | 'Film' | 'Tv' | 'Flame' | 'Star' | 'Heart' | 'Clapperboard' | 'Eye' | 'ThumbsUp' | 'ThumbsDown' | 'Ban';

export interface CatalogData {
  id: string;
  name: string;
  color: 'pink' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'purple';
  thumbnail?: CatalogThumbnail;
  itemIds: (string | number)[];
  custom?: boolean;
}

export const CATALOGS_CHANGED_EVENT = 'animenation-catalogs-changed';
export const WATCHLIST_CHANGED_EVENT = 'animenation-watchlist-changed';

export const DEFAULT_USER_CATALOGS: CatalogData[] = [
  { id: 'watchlist', name: 'Main Watchlist', color: 'pink', thumbnail: 'Folder', itemIds: [] },
  { id: 'anime_vault', name: 'Anime Vault', color: 'purple', thumbnail: 'Sparkles', itemIds: [], custom: true },
  { id: 'manga_list', name: 'Manga Reading List', color: 'emerald', thumbnail: 'BookOpen', itemIds: [], custom: true },
  { id: 'manhwa_vault', name: 'Manhwa & Webtoons', color: 'cyan', thumbnail: 'Flame', itemIds: [], custom: true },
  { id: 'novel_archive', name: 'Light Novel Archive', color: 'amber', thumbnail: 'BookOpen', itemIds: [], custom: true },
  { id: 'masterpieces', name: 'All-Time Masterpieces', color: 'amber', thumbnail: 'Star', itemIds: [], custom: true },
  { id: 'late_night', name: 'Late Night Binge', color: 'rose', thumbnail: 'Film', itemIds: [], custom: true },
];

/**
 * Merges existing user catalogs with default folders so no default category is ever missing,
 * while preserving all custom folders and saved item IDs.
 */
export function mergeWithDefaultCatalogs(existing: CatalogData[] = []): CatalogData[] {
  if (!Array.isArray(existing) || existing.length === 0) {
    return DEFAULT_USER_CATALOGS.map((c) => ({ ...c, itemIds: [...(c.itemIds || [])] }));
  }

  const existingMap = new Map<string, CatalogData>();
  existing.forEach((c) => {
    if (c && c.id) {
      existingMap.set(c.id, {
        ...c,
        name: c.name || 'Custom Folder',
        color: c.color || 'pink',
        thumbnail: c.thumbnail || 'Folder',
        itemIds: Array.isArray(c.itemIds) ? c.itemIds : [],
      });
    }
  });

  // Ensure all default catalogs exist
  const result: CatalogData[] = [];

  // 1. First add 'watchlist'
  const watchlistCat = existingMap.get('watchlist') || DEFAULT_USER_CATALOGS[0];
  result.push({
    ...DEFAULT_USER_CATALOGS[0],
    ...watchlistCat,
    name: 'Main Watchlist',
  });
  existingMap.delete('watchlist');

  // 2. Add other default categories
  for (let i = 1; i < DEFAULT_USER_CATALOGS.length; i++) {
    const def = DEFAULT_USER_CATALOGS[i];
    if (existingMap.has(def.id)) {
      result.push(existingMap.get(def.id)!);
      existingMap.delete(def.id);
    } else {
      result.push({ ...def, itemIds: [] });
    }
  }

  // 3. Append all user-created custom catalogs
  for (const customCat of existingMap.values()) {
    result.push(customCat);
  }

  return result;
}

/**
 * Dispatches a global event so all open tabs and components sync their folder state in real-time.
 */
export function dispatchCatalogsUpdated(catalogs?: CatalogData[]) {
  if (typeof window !== 'undefined') {
    if (catalogs) {
      try {
        localStorage.setItem('animenation_catalogs', JSON.stringify(catalogs));
      } catch {}
    }
    window.dispatchEvent(new CustomEvent(CATALOGS_CHANGED_EVENT, { detail: catalogs }));
  }
}

export function dispatchWatchlistUpdated(removedId?: string | number) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(WATCHLIST_CHANGED_EVENT, {
        detail: removedId != null ? { removedId: String(removedId) } : undefined,
      })
    );
  }
}

