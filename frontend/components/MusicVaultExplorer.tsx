'use client';

import React, { useState } from 'react';
import {
  Music2,
  Play,
  Pause,
  Trash2,
  Plus,
  Heart,
  Flame,
  Moon,
  Disc,
  X,
  Loader2,
  ArrowLeft,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  MusicPlaylistData,
  SavedMusicTrack,
  dispatchMusicPlaylistsUpdated,
} from '@/lib/music-shared';
import {
  removeTrackFromMusicPlaylist,
  createCustomMusicPlaylist,
  deleteCustomMusicPlaylist,
} from '@/app/actions/music';
import { useMusicPlayer } from '@/context/MusicPlayerContext';

interface MusicVaultExplorerProps {
  playlists: MusicPlaylistData[];
  onPlaylistsUpdate: (updated: MusicPlaylistData[]) => void;
  onBackToWatchlist: () => void;
  isAuthenticated: boolean;
}

export default function MusicVaultExplorer({
  playlists,
  onPlaylistsUpdate,
  onBackToWatchlist,
  isAuthenticated,
}: MusicVaultExplorerProps) {
  const [activePlaylistId, setActivePlaylistId] = useState<string>('music_liked');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusicPlayer();

  const activePlaylist =
    playlists.find((p) => p.id === activePlaylistId) || playlists[0] || null;

  const renderIcon = (iconName: string, size = 16) => {
    switch (iconName) {
      case 'Heart':
        return <Heart size={size} className="text-[#ff4dd2]" />;
      case 'Flame':
        return <Flame size={size} className="text-amber-400" />;
      case 'Moon':
        return <Moon size={size} className="text-cyan-400" />;
      case 'Disc':
        return <Disc size={size} className="text-purple-400" />;
      default:
        return <Music2 size={size} className="text-emerald-400" />;
    }
  };

  const handleTrackClick = (track: SavedMusicTrack) => {
    if (!track.previewUrl) return;
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      playTrack(track, activePlaylist?.tracks || []);
    }
  };

  const handlePlayAll = () => {
    if (!activePlaylist || activePlaylist.tracks.length === 0) return;
    const firstPlayable = activePlaylist.tracks.find((t) => t.previewUrl);
    if (firstPlayable) {
      playTrack(firstPlayable, activePlaylist.tracks);
    }
  };

  const handleRemoveTrack = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activePlaylist) return;

    // Optimistic UI update
    const updatedPlaylists = playlists.map((p) => {
      if (p.id === activePlaylist.id) {
        return {
          ...p,
          tracks: p.tracks.filter((t) => String(t.id) !== String(trackId)),
        };
      }
      return p;
    });
    onPlaylistsUpdate(updatedPlaylists);
    dispatchMusicPlaylistsUpdated(updatedPlaylists);

    if (isAuthenticated) {
      await removeTrackFromMusicPlaylist({
        playlistId: activePlaylist.id,
        trackId,
      });
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const res = await createCustomMusicPlaylist({
        name: newPlaylistName.trim(),
        color: 'purple',
        icon: 'Music',
      });

      if (res.success && res.playlist) {
        const updated = [...playlists, res.playlist!];
        onPlaylistsUpdate(updated);
        setActivePlaylistId(res.playlist!.id);
        setNewPlaylistName('');
        setShowCreateForm(false);
        dispatchMusicPlaylistsUpdated(updated);
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom playlist?')) {
      const updated = playlists.filter((p) => p.id !== playlistId);
      onPlaylistsUpdate(updated);
      setActivePlaylistId('music_liked');
      dispatchMusicPlaylistsUpdated(updated);

      if (isAuthenticated) {
        await deleteCustomMusicPlaylist(playlistId);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* -- Top Header & Breadcrumb -- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-[#ff4dd2]/30 bg-gradient-to-r from-[#ff4dd2]/10 via-[#0a0b1e] to-purple-950/20 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 flex items-center justify-center text-[#ff4dd2] shadow-[0_0_20px_rgba(255,77,210,0.3)]">
            <Music2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest bg-[#ff4dd2] text-black px-2.5 py-0.5 rounded-full">
                Music Vault
              </span>
              <span className="text-xs text-gray-400 font-mono">Neon DB Sync</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight mt-0.5">
              Anime Music Playlists
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onBackToWatchlist}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold uppercase tracking-wider text-white transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft size={15} />
          <span>Back to Watchlist</span>
        </button>
      </div>

      {/* -- Playlist Selector Tabs -- */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {playlists.map((pl) => {
          const isActive = pl.id === activePlaylistId;
          return (
            <button
              key={pl.id}
              type="button"
              onClick={() => setActivePlaylistId(pl.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-[#ff4dd2] text-black border-[#ff4dd2] shadow-[0_0_20px_rgba(255,77,210,0.35)]'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10 hover:border-white/20'
              }`}
            >
              <span className={isActive ? 'text-black' : ''}>{renderIcon(pl.icon, 14)}</span>
              <span>{pl.name}</span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'
                }`}
              >
                {pl.tracks.length}
              </span>

              {!pl.isDefault && (
                <span
                  onClick={(e) => handleDeletePlaylist(pl.id, e)}
                  className="ml-1 p-0.5 hover:text-red-500 transition-colors"
                  title="Delete playlist"
                >
                  <X size={13} />
                </span>
              )}
            </button>
          );
        })}

        {/* Create Playlist Button */}
        {!showCreateForm ? (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-dashed border-white/20 hover:border-[#ff4dd2]/50 text-gray-400 hover:text-[#ff4dd2] text-xs font-bold whitespace-nowrap transition cursor-pointer"
          >
            <Plus size={14} />
            <span>New Playlist</span>
          </button>
        ) : (
          <form onSubmit={handleCreatePlaylist} className="flex items-center gap-1.5">
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#ff4dd2] w-36"
              autoFocus
            />
            <button
              type="submit"
              disabled={isCreating || !newPlaylistName.trim()}
              className="px-3 py-1.5 bg-[#ff4dd2] text-black text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
            >
              {isCreating ? <Loader2 size={12} className="animate-spin" /> : 'Add'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="p-1 text-gray-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </form>
        )}
      </div>

      {/* -- Active Playlist Header & Actions -- */}
      {activePlaylist && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/15">
              {renderIcon(activePlaylist.icon, 20)}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{activePlaylist.name}</span>
                <span className="text-xs font-normal text-gray-400">
                  ({activePlaylist.tracks.length} tracks)
                </span>
              </h3>
              {activePlaylist.description && (
                <p className="text-xs text-gray-400 mt-0.5">{activePlaylist.description}</p>
              )}
            </div>
          </div>

          {activePlaylist.tracks.length > 0 && (
            <button
              type="button"
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#ff4dd2] hover:bg-[#ff7be0] text-black text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(255,77,210,0.3)] transition active:scale-95 cursor-pointer self-start sm:self-auto"
            >
              <Play size={14} className="fill-black" />
              <span>Play All</span>
            </button>
          )}
        </div>
      )}

      {/* -- Tracklist Display -- */}
      {activePlaylist && activePlaylist.tracks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activePlaylist.tracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            const isTrackPlaying = isCurrent && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => handleTrackClick(track)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer group select-none ${
                  isTrackPlaying
                    ? 'border-[#ff4dd2] bg-[#ff4dd2]/10 shadow-[0_0_20px_rgba(255,77,210,0.15)]'
                    : 'border-white/10 bg-[#0a0b1a]/80 hover:bg-[#0e0f22] hover:border-[#ff4dd2]/30'
                }`}
              >
                {/* Left: Index + Artwork + Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-gray-500 w-5 text-right flex-shrink-0">
                    {idx + 1}
                  </span>

                  <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 flex items-center justify-center border border-white/10">
                    {track.artworkUrl ? (
                      <img
                        src={track.artworkUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#ff4dd2]">
                        <Disc size={20} />
                      </div>
                    )}
                    {track.previewUrl && (
                      <div
                        className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                          isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isTrackPlaying ? (
                          <Pause size={14} className="text-white" />
                        ) : (
                          <Play size={14} className="text-white fill-white ml-0.5" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold truncate transition-colors ${
                        isCurrent ? 'text-[#ff4dd2]' : 'text-white group-hover:text-[#ff4dd2]'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1.5">
                      <span>{track.artist}</span>
                      {track.animeTitle && (
                        <>
                          <span className="text-gray-600">&bull;</span>
                          <span className="text-[#ff4dd2]/80 truncate">{track.animeTitle}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Right: Playing waves + Duration + Remove */}
                <div className="flex items-center gap-2.5 pl-3 flex-shrink-0">
                  {isTrackPlaying && (
                    <div className="flex items-center gap-0.5 text-[#ff4dd2]">
                      <span className="w-0.5 h-3 bg-[#ff4dd2] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-0.5 h-4 bg-[#ff4dd2] rounded-full animate-bounce" style={{ animationDelay: '75ms' }} />
                      <span className="w-0.5 h-2 bg-[#ff4dd2] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    </div>
                  )}

                  {track.duration && (
                    <span className="text-xs font-mono text-gray-400">{track.duration}</span>
                  )}

                  {track.externalUrl && (
                    <a
                      href={track.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
                      title="Open in Apple Music / Source"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleRemoveTrack(track.id, e)}
                    className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                    title="Remove from playlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-[#ff4dd2]/15 border border-[#ff4dd2]/30 flex items-center justify-center text-[#ff4dd2] mb-4 shadow-[0_0_25px_rgba(255,77,210,0.2)]">
            <Music2 size={28} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Tracks Saved Yet</h3>
          <p className="text-xs text-gray-400 leading-relaxed max-w-xs mb-4">
            Browse any Anime Details page &gt; tap the <strong className="text-white">Music</strong> tab &gt; click <strong className="text-[#ff4dd2]">Save</strong> on any OST or OP/ED theme!
          </p>
        </div>
      )}
    </div>
  );
}
