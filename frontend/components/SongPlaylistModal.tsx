'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Check, Music, ListPlus, Loader2, Heart } from 'lucide-react';
import { NormalizedTheme } from '../lib/animethemes-api';

interface SongPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: NormalizedTheme | null;
}

export default function SongPlaylistModal({ isOpen, onClose, song }: SongPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !song) return;

    const token = localStorage.getItem('token') || localStorage.getItem('user_token');

    if (!token) {
      setLoading(false);
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    setLoading(true);

    fetch(`${backendUrl}/api/song-playlists/my-playlists`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPlaylists(data);
        }
      })
      .catch(err => console.error('Error fetching song playlists:', err))
      .finally(() => setLoading(false));
  }, [isOpen, song]);

  if (!isOpen || !song) return null;

  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('user_token')) : null;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim() || !token) return;

    setActionLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/song-playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          description: newPlaylistDesc.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.playlist) {
        setPlaylists(prev => [...prev, data.playlist]);
        setNewPlaylistName('');
        setNewPlaylistDesc('');
        setIsCreating(false);
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSongInPlaylist = async (playlist: any) => {
    if (!token) {
      alert('Please log in to add songs to playlists!');
      return;
    }

    const isAlreadyIn = playlist.songs.some((s: any) => s.songId === String(song.id));
    setActionLoading(true);

    try {
      if (isAlreadyIn) {
        // Remove from playlist
        const res = await fetch(`${backendUrl}/api/song-playlists/${playlist._id}/songs/${song.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setPlaylists(prev => prev.map(p => {
            if (p._id === playlist._id) {
              return { ...p, songs: p.songs.filter((s: any) => s.songId !== String(song.id)) };
            }
            return p;
          }));
        }
      } else {
        // Add to playlist
        const res = await fetch(`${backendUrl}/api/song-playlists/${playlist._id}/songs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            song: {
              songId: song.id,
              type: song.type,
              sequence: song.sequence,
              slug: song.slug,
              songTitle: song.songTitle,
              artists: song.artists,
              videoUrl: song.videoUrl,
              audioUrl: song.audioUrl,
              animeId: song.animeId,
              animeTitle: song.animeTitle,
              animeImage: song.animeImage
            }
          })
        });
        const data = await res.json();
        if (res.ok && data.playlist) {
          setPlaylists(prev => prev.map(p => p._id === playlist._id ? data.playlist : p));
        }
      }
    } catch (err) {
      console.error('Toggle song in playlist error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b0c20] border border-[#ff4dd2]/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#ff4dd2]/10 text-[#ff4dd2] border border-[#ff4dd2]/20">
              <Music size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Add Theme to Playlist</h3>
              <p className="text-xs text-gray-400 truncate max-w-[240px]">
                {song.songTitle} ({song.slug})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Not Logged In Warning */}
        {!token && (
          <div className="p-4 bg-white/5 rounded-2xl text-center text-xs text-gray-300">
            Please log in to save anime themes to your playlists!
          </div>
        )}

        {/* Playlists List */}
        {token && (
          <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 size={24} className="animate-spin text-[#ff4dd2]" />
                <span className="text-xs">Loading playlists...</span>
              </div>
            ) : playlists.length === 0 && !isCreating ? (
              <div className="text-center py-6 text-xs text-gray-400">
                No playlists yet. Create your first Anime Theme Playlist!
              </div>
            ) : (
              <div className="space-y-2">
                {playlists.map((playlist) => {
                  const isInPlaylist = playlist.songs?.some((s: any) => s.songId === String(song.id));
                  return (
                    <button
                      key={playlist._id}
                      onClick={() => handleToggleSongInPlaylist(playlist)}
                      disabled={actionLoading}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                        isInPlaylist
                          ? 'bg-[#ff4dd2]/15 border-[#ff4dd2]/60 text-white'
                          : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          playlist.isFavorites ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {playlist.isFavorites ? <Heart size={15} className="fill-rose-400" /> : <Music size={15} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{playlist.name}</p>
                          <span className="text-[10px] text-gray-400">
                            {playlist.songs?.length || 0} tracks
                          </span>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                        isInPlaylist
                          ? 'bg-[#ff4dd2] border-[#ff4dd2] text-black'
                          : 'border-white/20 bg-black/20 text-transparent'
                      }`}>
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Create New Playlist Form */}
            {isCreating ? (
              <form onSubmit={handleCreatePlaylist} className="p-3.5 bg-black/40 border border-white/10 rounded-2xl space-y-3 mt-3">
                <input
                  type="text"
                  placeholder="Playlist Name (e.g. Favorite Openings)"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]"
                  autoFocus
                  required
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ff4dd2]"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading || !newPlaylistName.trim()}
                    className="flex-1 py-2 rounded-xl bg-[#ff4dd2] hover:bg-[#ff7be0] text-black text-xs font-extrabold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Save Playlist
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-[#ff4dd2]/50 text-gray-300 hover:text-[#ff4dd2] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer mt-2"
              >
                <Plus size={15} /> + New Playlist
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
