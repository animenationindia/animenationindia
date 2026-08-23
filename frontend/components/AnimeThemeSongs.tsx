'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Music, 
  Volume2, 
  VolumeX, 
  Heart, 
  ListPlus, 
  Video, 
  Headphones, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { NormalizedTheme } from '../lib/animethemes-api';
import SongPlaylistModal from './SongPlaylistModal';

interface AnimeThemeSongsProps {
  themes: NormalizedTheme[];
  animeTitle?: string;
}

export default function AnimeThemeSongs({ themes, animeTitle = 'Anime' }: AnimeThemeSongsProps) {
  const [filter, setFilter] = useState<'ALL' | 'OP' | 'ED'>('ALL');
  const [currentTheme, setCurrentTheme] = useState<NormalizedTheme | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [showVideoPreview, setShowVideoPreview] = useState(false);

  // Favorites state per song
  const [favoriteSongIds, setFavoriteSongIds] = useState<Set<string>>(new Set());
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<NormalizedTheme | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pendingSyncRef = useRef<{ time: number; shouldPlay: boolean } | null>(null);

  // If no themes, gracefully hide completely
  if (!themes || themes.length === 0) {
    return null;
  }

  const openings = themes.filter(t => t.type === 'OP');
  const endings = themes.filter(t => t.type === 'ED');

  const displayedThemes = themes.filter(t => {
    if (filter === 'OP') return t.type === 'OP';
    if (filter === 'ED') return t.type === 'ED';
    return true;
  });

  // Fetch initial favorites for this user
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

    fetch(`${backendUrl}/api/song-playlists/my-playlists`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(playlists => {
        if (Array.isArray(playlists)) {
          const favPlaylist = playlists.find(p => p.isFavorites);
          if (favPlaylist && Array.isArray(favPlaylist.songs)) {
            const set = new Set<string>(favPlaylist.songs.map((s: any) => String(s.songId)));
            setFavoriteSongIds(set);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Synchronize incoming media player element with saved time, mute, and loop states
  const syncIncomingPlayer = (element: HTMLMediaElement | null) => {
    if (!element) return;
    element.muted = isMuted;
    element.loop = isLooping;

    if (element.duration && !isNaN(element.duration)) {
      setDuration(element.duration);
    }

    if (pendingSyncRef.current !== null) {
      const { time, shouldPlay } = pendingSyncRef.current;
      element.currentTime = time;
      setCurrentTime(time);
      if (shouldPlay) {
        element.play().catch(() => {});
        setIsPlaying(true);
      } else {
        element.pause();
        setIsPlaying(false);
      }
      pendingSyncRef.current = null;
    }
  };

  // Play a song from the list (or toggle if already active)
  const handlePlayTheme = (theme: NormalizedTheme) => {
    // If clicking the same song that is already active -> Toggle Play / Pause
    if (currentTheme?.id === theme.id) {
      if (isPlaying) {
        if (showVideoPreview && videoRef.current) {
          videoRef.current.pause();
        } else if (audioRef.current) {
          audioRef.current.pause();
        }
        setIsPlaying(false);
      } else {
        if (showVideoPreview && videoRef.current) {
          videoRef.current.play().catch(() => {});
        } else if (audioRef.current) {
          audioRef.current.play().catch(() => {});
        }
        setIsPlaying(true);
      }
      return;
    }

    // Switching to a NEW track -> Stop current playback, reset position to 0
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }

    setCurrentTheme(theme);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    // Queue fresh start for new song from 0:00
    pendingSyncRef.current = { time: 0, shouldPlay: true };

    setTimeout(() => {
      if (showVideoPreview && theme.videoUrl) {
        if (videoRef.current) {
          videoRef.current.src = theme.videoUrl;
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(() => {});
        }
      } else {
        if (audioRef.current) {
          audioRef.current.src = theme.audioUrl || theme.videoUrl;
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }
      }
    }, 50);
  };

  // 🔄 Seamless Audio <-> Video Mode Switcher (Zero Double Sound + Exact Timestamp Sync)
  const handleToggleVideoMode = () => {
    if (!currentTheme) return;

    // 1. Capture exact current timestamp and playing state from active player
    let savedTime = currentTime;
    if (showVideoPreview && videoRef.current) {
      savedTime = videoRef.current.currentTime || currentTime;
      videoRef.current.pause();
    } else if (!showVideoPreview && audioRef.current) {
      savedTime = audioRef.current.currentTime || currentTime;
      audioRef.current.pause();
    }

    const wasPlaying = isPlaying;
    const targetMode = !showVideoPreview;

    // 2. Set pending sync before state switch
    pendingSyncRef.current = { time: savedTime, shouldPlay: wasPlaying };
    setCurrentTime(savedTime);
    setShowVideoPreview(targetMode);

    // 3. Immediately sync incoming media element upon mount
    setTimeout(() => {
      if (targetMode && videoRef.current && currentTheme.videoUrl) {
        videoRef.current.src = currentTheme.videoUrl;
        videoRef.current.currentTime = savedTime;
        if (wasPlaying) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      } else if (!targetMode && audioRef.current) {
        audioRef.current.src = currentTheme.audioUrl || currentTheme.videoUrl;
        audioRef.current.currentTime = savedTime;
        if (wasPlaying) {
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    }, 30);
  };

  // Time update listeners (updates shared currentTime state)
  const handleAudioTimeUpdate = () => {
    if (!showVideoPreview && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleVideoTimeUpdate = () => {
    if (showVideoPreview && videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  // Scrubber / Seek handler
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (showVideoPreview && videoRef.current) {
      videoRef.current.currentTime = time;
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleFavoriteSong = async (theme: NormalizedTheme, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token') || localStorage.getItem('user_token');
    if (!token) {
      alert('Please log in to save songs to your Favorite Themes!');
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const isFav = favoriteSongIds.has(String(theme.id));

    // Optimistic UI update
    setFavoriteSongIds(prev => {
      const next = new Set(prev);
      if (isFav) next.delete(String(theme.id));
      else next.add(String(theme.id));
      return next;
    });

    try {
      const res = await fetch(`${backendUrl}/api/song-playlists/toggle-favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          song: {
            songId: theme.id,
            type: theme.type,
            sequence: theme.sequence,
            slug: theme.slug,
            songTitle: theme.songTitle,
            artists: theme.artists,
            videoUrl: theme.videoUrl,
            audioUrl: theme.audioUrl,
            animeId: theme.animeId,
            animeTitle: theme.animeTitle || animeTitle,
            animeImage: theme.animeImage
          }
        })
      });

      if (!res.ok) {
        // Revert on error
        setFavoriteSongIds(prev => {
          const next = new Set(prev);
          if (isFav) next.add(String(theme.id));
          else next.delete(String(theme.id));
          return next;
        });
      }
    } catch {
      // Revert on network failure
      setFavoriteSongIds(prev => {
        const next = new Set(prev);
        if (isFav) next.add(String(theme.id));
        else next.delete(String(theme.id));
        return next;
      });
    }
  };

  return (
    <div className="bg-[#0b0c20]/70 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-7 shadow-xl">
      
      {/* 🎵 Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-4 bg-[#ff4dd2] rounded-full" />
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Opening & Ending Themes
            </h3>
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#ff4dd2]/10 text-[#ff4dd2] px-2 py-0.5 rounded-full border border-[#ff4dd2]/20">
              AnimeThemes
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Stream official high-quality openings & endings directly
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/5 self-start sm:self-auto">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'ALL'
                ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All ({themes.length})
          </button>
          <button
            onClick={() => setFilter('OP')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'OP'
                ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Openings ({openings.length})
          </button>
          <button
            onClick={() => setFilter('ED')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === 'ED'
                ? 'bg-[#ff4dd2] text-black shadow-md shadow-[#ff4dd2]/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Endings ({endings.length})
          </button>
        </div>
      </div>

      {/* 📜 Themes List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
        {displayedThemes.map((theme) => {
          const isThisPlaying = currentTheme?.id === theme.id && isPlaying;
          const isThisSelected = currentTheme?.id === theme.id;
          const isFav = favoriteSongIds.has(String(theme.id));

          return (
            <div
              key={theme.id}
              onClick={() => handlePlayTheme(theme)}
              className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer group ${
                isThisSelected
                  ? 'bg-gradient-to-r from-[#ff4dd2]/15 via-[#6366f1]/10 to-transparent border-[#ff4dd2]/60 shadow-lg shadow-[#ff4dd2]/10'
                  : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/15'
              }`}
            >
              {/* Left: Play/Pause Button + Badge + Title & Artist */}
              <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
                {/* Play Button */}
                <button
                  type="button"
                  aria-label={isThisPlaying ? 'Pause theme' : 'Play theme'}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isThisPlaying
                      ? 'bg-[#ff4dd2] text-black shadow-[0_0_15px_rgba(255,77,210,0.6)] scale-105'
                      : 'bg-white/10 text-white group-hover:bg-[#ff4dd2] group-hover:text-black'
                  }`}
                >
                  {isThisPlaying ? (
                    <Pause size={16} className="fill-current" />
                  ) : (
                    <Play size={16} className="fill-current ml-0.5" />
                  )}
                </button>

                {/* Type Badge */}
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider flex-shrink-0 ${
                  theme.type === 'OP'
                    ? 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {theme.slug || `${theme.type} ${theme.sequence}`}
                </span>

                {/* Song Title & Artists */}
                <div className="min-w-0 flex-1">
                  <p className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                    isThisSelected ? 'text-[#ff4dd2]' : 'text-white group-hover:text-[#ff4dd2]'
                  }`}>
                    {theme.songTitle}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate mt-0.5 font-medium">
                    {theme.artists.length > 0 ? theme.artists.join(', ') : 'Unknown Artist'}
                  </p>
                </div>
              </div>

              {/* Right: Waveform animation (when playing) + Favorite + Add to Playlist */}
              <div className="flex items-center gap-2 flex-shrink-0">
                
                {/* 🎶 Dancing Equalizer Animation */}
                {isThisPlaying && (
                  <div className="flex items-end gap-0.5 h-4 px-2">
                    <span className="w-1 bg-[#ff4dd2] rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                    <span className="w-1 bg-[#ff4dd2] rounded-full animate-bounce [animation-delay:-0.1s] h-4" />
                    <span className="w-1 bg-[#ff4dd2] rounded-full animate-bounce [animation-delay:-0.4s] h-2" />
                    <span className="w-1 bg-[#ff4dd2] rounded-full animate-bounce h-4" />
                  </div>
                )}

                {/* ❤️ Favorite Song Button */}
                <button
                  type="button"
                  title={isFav ? 'Remove from Favorite Themes' : 'Add to Favorite Themes'}
                  onClick={(e) => toggleFavoriteSong(theme, e)}
                  className={`p-2 rounded-xl transition-all ${
                    isFav
                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                      : 'bg-white/5 text-gray-400 hover:text-rose-400 hover:bg-white/10'
                  }`}
                >
                  <Heart size={15} className={isFav ? 'fill-rose-400' : ''} />
                </button>

                {/* 📑 Add to Playlist Button */}
                <button
                  type="button"
                  title="Add to My Playlists"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSongForPlaylist(theme);
                  }}
                  className="p-2 rounded-xl bg-white/5 hover:bg-[#ff4dd2]/20 text-gray-400 hover:text-[#ff4dd2] hover:border-[#ff4dd2]/40 transition-all cursor-pointer"
                >
                  <ListPlus size={15} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* 🎧 Live Mini Player Bar (when a theme is active) */}
      {currentTheme && (
        <div className="mt-6 pt-4 border-t border-white/10 bg-black/40 rounded-2xl p-4 border border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
            
            {/* Playing Info */}
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div className="w-9 h-9 rounded-xl bg-[#ff4dd2]/20 border border-[#ff4dd2]/40 flex items-center justify-center text-[#ff4dd2] flex-shrink-0">
                <Music size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                  {currentTheme.songTitle}
                </p>
                <p className="text-[10px] text-gray-400 truncate">
                  {currentTheme.artists.join(', ') || 'Anime Theme'} • <span className="text-[#ff4dd2]">{currentTheme.slug}</span>
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Loop Button */}
              <button
                onClick={() => {
                  const nextLoop = !isLooping;
                  setIsLooping(nextLoop);
                  if (audioRef.current) audioRef.current.loop = nextLoop;
                  if (videoRef.current) videoRef.current.loop = nextLoop;
                }}
                title="Toggle Loop"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isLooping ? 'bg-[#ff4dd2]/20 text-[#ff4dd2]' : 'text-gray-400 hover:text-white'
                }`}
              >
                <RotateCcw size={14} />
              </button>

              {/* Mute Button */}
              <button
                onClick={() => {
                  const nextMuted = !isMuted;
                  setIsMuted(nextMuted);
                  if (audioRef.current) audioRef.current.muted = nextMuted;
                  if (videoRef.current) videoRef.current.muted = nextMuted;
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {/* Video Preview / Audio Only Toggle Button */}
              {currentTheme.videoUrl && (
                <button
                  type="button"
                  onClick={handleToggleVideoMode}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-extrabold uppercase transition-all duration-300 cursor-pointer shadow-md ${
                    showVideoPreview
                      ? 'bg-[#ff4dd2] text-black shadow-[#ff4dd2]/30 scale-105'
                      : 'bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white border border-white/10'
                  }`}
                >
                  {showVideoPreview ? (
                    <>
                      <Headphones size={13} />
                      <span>Audio Only</span>
                    </>
                  ) : (
                    <>
                      <Video size={13} />
                      <span>Watch PV</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>

          {/* Progress Bar & Time */}
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff4dd2]"
            />
            <span className="text-[10px] font-mono text-gray-400 w-8">
              {formatTime(duration)}
            </span>
          </div>

          {/* Inline Clean 1080p Video PV Player (Rendered ONLY in Video Mode) */}
          {showVideoPreview && currentTheme.videoUrl && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black relative">
              <video
                ref={videoRef}
                src={currentTheme.videoUrl}
                controls
                playsInline
                onLoadedMetadata={() => syncIncomingPlayer(videoRef.current)}
                onCanPlay={() => syncIncomingPlayer(videoRef.current)}
                onTimeUpdate={handleVideoTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  if (isLooping && videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                  } else {
                    setIsPlaying(false);
                  }
                }}
                className="w-full aspect-video rounded-2xl"
              />
            </div>
          )}
        </div>
      )}

      {/* Audio Element (Active ONLY in Audio Mode to guarantee ZERO double sound) */}
      {!showVideoPreview && currentTheme && (
        <audio
          ref={audioRef}
          src={currentTheme.audioUrl || currentTheme.videoUrl}
          onLoadedMetadata={() => syncIncomingPlayer(audioRef.current)}
          onCanPlay={() => syncIncomingPlayer(audioRef.current)}
          onTimeUpdate={handleAudioTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            if (isLooping && audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            } else {
              setIsPlaying(false);
            }
          }}
        />
      )}

      {/* Modal to Add to Playlist */}
      <SongPlaylistModal
        isOpen={!!selectedSongForPlaylist}
        onClose={() => setSelectedSongForPlaylist(null)}
        song={selectedSongForPlaylist}
      />

    </div>
  );
}
