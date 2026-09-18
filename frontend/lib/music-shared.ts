export interface SavedMusicTrack {
  id: string; // unique track id, e.g. "itunes-123456" or "theme-op1"
  title: string;
  artist: string;
  duration?: string;
  previewUrl: string | null;
  artworkUrl?: string | null;
  animeId?: string | number;
  animeTitle?: string;
  type?: 'op' | 'ed' | 'ost' | 'song';
  externalUrl?: string | null;
  savedAt: string;
}

export interface MusicPlaylistData {
  id: string; // e.g. 'music_liked', 'music_op', 'music_ed', 'music_ost', or 'music_custom_...'
  name: string;
  color: 'pink' | 'emerald' | 'purple' | 'rose' | 'amber' | 'cyan';
  icon: 'Heart' | 'Flame' | 'Moon' | 'Music' | 'Sparkles' | 'Radio' | 'Disc';
  description?: string;
  isDefault?: boolean;
  tracks: SavedMusicTrack[];
}

export const DEFAULT_MUSIC_PLAYLISTS: MusicPlaylistData[] = [
  {
    id: 'music_liked',
    name: 'Liked Tracks',
    color: 'pink',
    icon: 'Heart',
    description: 'Your favorite anime OSTs and theme songs',
    isDefault: true,
    tracks: [],
  },
  {
    id: 'music_op',
    name: 'Epic Openings',
    color: 'amber',
    icon: 'Flame',
    description: 'High-energy hype opening themes',
    isDefault: true,
    tracks: [],
  },
  {
    id: 'music_ed',
    name: 'Emotional Endings',
    color: 'cyan',
    icon: 'Moon',
    description: 'Chill, sentimental, and relaxing endings',
    isDefault: true,
    tracks: [],
  },
  {
    id: 'music_ost',
    name: 'Soundtracks & BGM',
    color: 'purple',
    icon: 'Disc',
    description: 'Original anime background scores and symphonies',
    isDefault: true,
    tracks: [],
  },
];

export const MUSIC_PLAYLISTS_CHANGED_EVENT = 'animenation-music-playlists-changed';

export function dispatchMusicPlaylistsUpdated(playlists?: MusicPlaylistData[]) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(MUSIC_PLAYLISTS_CHANGED_EVENT, { detail: playlists })
    );
  }
}
