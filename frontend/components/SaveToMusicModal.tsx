'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Music2,
  Check,
  Plus,
  Heart,
  Flame,
  Moon,
  Disc,
  Sparkles,
  Radio,
  Loader2,
  FolderPlus,
} from 'lucide-react';
import {
  SavedMusicTrack,
  MusicPlaylistData,
  DEFAULT_MUSIC_PLAYLISTS,
  dispatchMusicPlaylistsUpdated,
} from '@/lib/music-shared';
import {
  getUserMusicPlaylists,
  saveTrackToMusicPlaylists,
  createCustomMusicPlaylist,
} from '@/app/actions/music';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface SaveToMusicModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: SavedMusicTrack | null;
}

export default function SaveToMusicModal({
  isOpen,
  onClose,
  track,
}: SaveToMusicModalProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<MusicPlaylistData[]>(DEFAULT_MUSIC_PLAYLISTS);
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<string[]>(['music_liked']);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New playlist form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Check auth
  const isAuthed = Boolean(
    session?.user?.id ||
    (typeof window !== 'undefined' && localStorage.getItem('user_id'))
  );

  useEffect(() => {
    if (!isOpen || !track) return;

    if (!isAuthed) {
      const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/';
      router.push(`/signin?callbackUrl=${encodeURIComponent(returnUrl)}`);
      onClose();
      return;
    }

    setIsLoading(true);
    setSuccessMsg(null);

    getUserMusicPlaylists()
      .then((res) => {
        if (res.playlists && res.playlists.length > 0) {
          setPlaylists(res.playlists);

          // Find playlists where track is already present
          const presentIn = res.playlists
            .filter((p) => p.tracks.some((t) => String(t.id) === String(track.id)))
            .map((p) => p.id);

          if (presentIn.length > 0) {
            setSelectedPlaylistIds(presentIn);
          } else {
            // Suggest default based on track type
            if (track.type === 'op') {
              setSelectedPlaylistIds(['music_liked', 'music_op']);
            } else if (track.type === 'ed') {
              setSelectedPlaylistIds(['music_liked', 'music_ed']);
            } else if (track.type === 'ost') {
              setSelectedPlaylistIds(['music_liked', 'music_ost']);
            } else {
              setSelectedPlaylistIds(['music_liked']);
            }
          }
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, track, isAuthed, router, onClose]);

  if (!isOpen || !track) return null;

  const togglePlaylistSelection = (id: string) => {
    setSelectedPlaylistIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (selectedPlaylistIds.length === 0) return;
    setIsSaving(true);
    setSuccessMsg(null);

    try {
      const res = await saveTrackToMusicPlaylists({
        playlistIds: selectedPlaylistIds,
        track,
      });

      if (res.success) {
        setSuccessMsg('Track successfully saved to Neon DB!');
        dispatchMusicPlaylistsUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error('Failed to save track:', e);
    } finally {
      setIsSaving(false);
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
        setPlaylists((prev) => [...prev, res.playlist!]);
        setSelectedPlaylistIds((prev) => [...prev, res.playlist!.id]);
        setNewPlaylistName('');
        setShowCreateForm(false);
      }
    } catch (err) {
      console.error('Create playlist error:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Heart':
        return <Heart size={16} className="text-[#ff4dd2]" />;
      case 'Flame':
        return <Flame size={16} className="text-amber-400" />;
      case 'Moon':
        return <Moon size={16} className="text-cyan-400" />;
      case 'Disc':
        return <Disc size={16} className="text-purple-400" />;
      default:
        return <Music2 size={16} className="text-emerald-400" />;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative w-full max-w-md rounded-3xl border border-[#ff4dd2]/30 bg-[#090a1a] p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(255,77,210,0.2)] overflow-hidden"
        >
          {/* Neon Top Bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#ff4dd2] via-purple-500 to-cyan-400" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-[#ff4dd2]/15 border border-[#ff4dd2]/30 flex items-center justify-center text-[#ff4dd2]">
              <Music2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                Save to Music Vault
              </h3>
              <p className="text-xs text-gray-400">Save directly to your Neon DB playlists</p>
            </div>
          </div>

          {/* Track Preview Info Card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 mb-5">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 flex-shrink-0 border border-white/10">
              {track.artworkUrl ? (
                <img src={track.artworkUrl} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#ff4dd2]">
                  <Disc size={20} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-white truncate">{track.title}</p>
              <p className="text-[11px] text-gray-400 truncate">{track.artist}</p>
              {track.animeTitle && (
                <p className="text-[10px] text-[#ff4dd2] font-semibold truncate">{track.animeTitle}</p>
              )}
            </div>
          </div>

          {/* Playlists Selection List */}
          <div className="mb-4">
            <label className="block text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
              Select Destination Playlist(s):
            </label>

            {isLoading ? (
              <div className="py-8 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 size={16} className="animate-spin text-[#ff4dd2]" />
                <span>Loading playlists from Neon DB...</span>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {playlists.map((pl) => {
                  const isChecked = selectedPlaylistIds.includes(pl.id);
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => togglePlaylistSelection(pl.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                        isChecked
                          ? 'border-[#ff4dd2]/60 bg-[#ff4dd2]/15 text-white shadow-[0_0_15px_rgba(255,77,210,0.15)]'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                          {renderIcon(pl.icon)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{pl.name}</p>
                          <p className="text-[10px] text-gray-400">{pl.tracks.length} tracks</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isChecked
                            ? 'border-[#ff4dd2] bg-[#ff4dd2] text-black'
                            : 'border-white/30 bg-transparent'
                        }`}
                      >
                        {isChecked && <Check size={12} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create New Playlist Toggle */}
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 text-xs font-bold text-[#ff4dd2] hover:text-[#ff7be0] transition mb-5 cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Create New Music Playlist</span>
            </button>
          ) : (
            <form onSubmit={handleCreatePlaylist} className="flex gap-2 mb-5">
              <input
                type="text"
                placeholder="Playlist name (e.g. Gym Hype)"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]"
                autoFocus
              />
              <button
                type="submit"
                disabled={isCreating || !newPlaylistName.trim()}
                className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
              >
                {isCreating ? <Loader2 size={12} className="animate-spin" /> : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-2.5 py-2 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </form>
          )}

          {/* Success Notification */}
          {successMsg && (
            <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Check size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-wider text-gray-300 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || selectedPlaylistIds.length === 0}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#ff4dd2] to-[#c026d3] hover:from-[#ff7be0] hover:to-[#d946ef] text-black font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,77,210,0.4)] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>Save to Playlists</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
