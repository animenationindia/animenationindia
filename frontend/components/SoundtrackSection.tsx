'use client';

import { useState, useEffect } from 'react';
import {
  Music,
  Play,
  Pause,
  ExternalLink,
  Disc,
  Radio,
  Loader2,
  Sparkles,
  Heart,
  Plus,
} from 'lucide-react';
import { useMusicPlayer } from '@/context/MusicPlayerContext';
import SaveToMusicModal from './SaveToMusicModal';
import { SavedMusicTrack } from '@/lib/music-shared';

interface RealTrack {
  id: number;
  title: string;
  artist: string;
  duration: string;
  previewUrl: string | null;
  artworkUrl: string | null;
  appleMusicUrl: string;
}

interface SoundtrackSectionProps {
  mediaTitle: string;
  themes?: any[];
}

export default function SoundtrackSection({ mediaTitle, themes = [] }: SoundtrackSectionProps) {
  const [tracks, setTracks] = useState<RealTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalTrack, setModalTrack] = useState<SavedMusicTrack | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { currentTrack, isPlaying, playTrack, togglePlay } = useMusicPlayer();

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const searchTerm = `${mediaTitle} soundtrack`;
    fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=song&limit=6`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.results && data.results.length > 0) {
          const parsed: RealTrack[] = data.results.map((item: any) => {
            const totalSec = Math.floor((item.trackTimeMillis || 180000) / 1000);
            const mins = Math.floor(totalSec / 60);
            const secs = String(totalSec % 60).padStart(2, '0');
            return {
              id: item.trackId,
              title: item.trackName,
              artist: item.artistName,
              duration: `${mins}:${secs}`,
              previewUrl: item.previewUrl || null,
              artworkUrl: item.artworkUrl100 || null,
              appleMusicUrl:
                item.trackViewUrl ||
                `https://music.apple.com/search?term=${encodeURIComponent(mediaTitle)}`,
            };
          });
          setTracks(parsed);
        } else {
          setTracks([]);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (active) {
          setTracks([]);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [mediaTitle]);

  const mapToSavedTrack = (t: RealTrack): SavedMusicTrack => ({
    id: `itunes_${t.id}`,
    title: t.title,
    artist: t.artist,
    duration: t.duration,
    previewUrl: t.previewUrl,
    artworkUrl: t.artworkUrl,
    animeTitle: mediaTitle,
    type: 'ost',
    externalUrl: t.appleMusicUrl,
    savedAt: new Date().toISOString(),
  });

  const handleTrackClick = (track: RealTrack) => {
    if (!track.previewUrl) return;

    const trackIdStr = `itunes_${track.id}`;
    if (currentTrack?.id === trackIdStr) {
      togglePlay();
    } else {
      const playlistContext = tracks.map(mapToSavedTrack);
      playTrack(mapToSavedTrack(track), playlistContext);
    }
  };

  const handleOpenSaveModal = (e: React.MouseEvent, track: RealTrack) => {
    e.stopPropagation();
    setModalTrack(mapToSavedTrack(track));
    setIsModalOpen(true);
  };

  const spotifySearchUrl = `https://open.spotify.com/search/${encodeURIComponent(
    mediaTitle + ' soundtrack'
  )}`;
  const appleMusicSearchUrl = `https://music.apple.com/search?term=${encodeURIComponent(
    mediaTitle + ' soundtrack'
  )}`;

  if (isLoading) {
    return (
      <section className="container mx-auto max-w-[1500px] px-4 py-8 border-t border-white/5">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <Loader2 size={16} className="animate-spin text-[#ff4dd2]" />
          <span>Searching official soundtrack and audio previews...</span>
        </div>
      </section>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <section className="container mx-auto max-w-[1500px] px-4 py-8 border-t border-white/5">
      {/* -- Header Row -- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-[#ff4dd2]/15 text-[#ff4dd2] border border-[#ff4dd2]/25 flex-shrink-0">
            <Music size={20} />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2.5 flex-wrap">
              <span>Official Soundtrack & Score</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-emerald-500/30">
                Live Preview
              </span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Stream original motion picture score and opening/ending themes
            </p>
          </div>
        </div>

        {/* Streaming Links */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {themes.length > 0 && (
            <span className="text-[11px] text-[#ff4dd2] font-bold flex items-center gap-1 bg-[#ff4dd2]/10 border border-[#ff4dd2]/25 px-3 py-1.5 rounded-xl">
              <Sparkles size={11} />
              OP/ED Themes ?
            </span>
          )}

          <a
            href={spotifySearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-2xl bg-[#1DB954]/15 hover:bg-[#1DB954]/25 text-[#1DB954] border border-[#1DB954]/30 px-3.5 py-2 text-xs font-bold transition-all active:scale-95"
          >
            <Disc size={13} className="animate-spin" style={{ animationDuration: '3s' }} />
            <span>Spotify</span>
            <ExternalLink size={11} />
          </a>

          <a
            href={appleMusicSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-2xl bg-[#FC3C44]/15 hover:bg-[#FC3C44]/25 text-[#FC3C44] border border-[#FC3C44]/30 px-3.5 py-2 text-xs font-bold transition-all active:scale-95"
          >
            <Radio size={13} />
            <span>Apple Music</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* -- Tracklist Grid -- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {tracks.map((track, idx) => {
          const trackIdStr = `itunes_${track.id}`;
          const isCurrent = currentTrack?.id === trackIdStr;
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
              {/* Left: Artwork + Track Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 flex items-center justify-center border border-white/10">
                  {track.artworkUrl ? (
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-gray-500">{idx + 1}</span>
                  )}
                  {track.previewUrl && (
                    <div
                      className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                        isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isTrackPlaying ? (
                        <Pause size={13} className="text-white" />
                      ) : (
                        <Play size={13} className="text-white fill-white ml-0.5" />
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
                  <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              {/* Right: Sound Wave indicator + Save Button + Duration + Apple Music link */}
              <div className="flex items-center gap-2.5 pl-3 flex-shrink-0">
                {isTrackPlaying && (
                  <div className="flex items-center gap-0.5 text-[#ff4dd2]">
                    <span className="w-0.5 h-3 bg-[#ff4dd2] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-0.5 h-4 bg-[#ff4dd2] rounded-full animate-bounce" style={{ animationDelay: '75ms' }} />
                    <span className="w-0.5 h-2 bg-[#ff4dd2] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  </div>
                )}

                {/* Save to Playlist Button */}
                <button
                  type="button"
                  onClick={(e) => handleOpenSaveModal(e, track)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-[#ff4dd2]/20 border border-white/10 hover:border-[#ff4dd2]/40 text-gray-300 hover:text-[#ff4dd2] text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
                  title="Save to Neon DB Music Playlist"
                >
                  <Heart size={12} className="group-hover:fill-current" />
                  <span className="hidden sm:inline">Save</span>
                </button>

                <span className="text-xs font-mono text-gray-400">{track.duration}</span>

                <a
                  href={track.appleMusicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1 text-zinc-500 hover:text-white transition-colors"
                  title="Open on Apple Music"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save to Music Modal */}
      <SaveToMusicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        track={modalTrack}
      />
    </section>
  );
}
