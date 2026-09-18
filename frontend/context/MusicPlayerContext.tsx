'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { SavedMusicTrack } from '@/lib/music-shared';

interface MusicPlayerContextType {
  currentTrack: SavedMusicTrack | null;
  playlist: SavedMusicTrack[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isLoop: boolean;
  isPlayerVisible: boolean;
  playTrack: (track: SavedMusicTrack, playlistContext?: SavedMusicTrack[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seek: (timeInSeconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  toggleLoop: () => void;
  closePlayer: () => void;
  setIsPlayerVisible: (val: boolean) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<SavedMusicTrack | null>(null);
  const [playlist, setPlaylist] = useState<SavedMusicTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLoop, setIsLoop] = useState<boolean>(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      // Handled in nextTrack logic or loop
      if (audio.loop) return;
      handleAutoNext();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audioRef.current = null;
    };
  }, []);

  const handleAutoNext = useCallback(() => {
    setPlaylist((prevList) => {
      setCurrentTrack((curr) => {
        if (!curr || prevList.length <= 1) {
          setIsPlaying(false);
          return curr;
        }
        const currentIndex = prevList.findIndex((t) => t.id === curr.id);
        const nextIndex = (currentIndex + 1) % prevList.length;
        const nextTrackItem = prevList[nextIndex];

        if (nextTrackItem && audioRef.current && nextTrackItem.previewUrl) {
          audioRef.current.src = nextTrackItem.previewUrl;
          audioRef.current.play().catch(() => setIsPlaying(false));
          return nextTrackItem;
        }
        return curr;
      });
      return prevList;
    });
  }, []);

  const playTrack = useCallback((track: SavedMusicTrack, playlistContext?: SavedMusicTrack[]) => {
    if (!audioRef.current || !track.previewUrl) return;

    if (playlistContext && playlistContext.length > 0) {
      setPlaylist(playlistContext);
    } else {
      setPlaylist((prev) => (prev.some((t) => t.id === track.id) ? prev : [track, ...prev]));
    }

    setCurrentTrack(track);
    setIsPlayerVisible(true);

    audioRef.current.src = track.previewUrl;
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.loop = isLoop;
    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
  }, [isMuted, volume, isLoop]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, [isPlaying, currentTrack]);

  const nextTrack = useCallback(() => {
    if (!currentTrack || playlist.length <= 1) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    const target = playlist[nextIndex];
    if (target) {
      playTrack(target, playlist);
    }
  }, [currentTrack, playlist, playTrack]);

  const prevTrack = useCallback(() => {
    if (!currentTrack || playlist.length <= 1) return;
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    const target = playlist[prevIndex];
    if (target) {
      playTrack(target, playlist);
    }
  }, [currentTrack, playlist, playTrack]);

  const seek = useCallback((timeInSeconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeInSeconds;
    setCurrentTime(timeInSeconds);
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
    if (clamped > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.volume = nextMuted ? 0 : volume;
  }, [isMuted, volume]);

  const toggleLoop = useCallback(() => {
    if (!audioRef.current) return;
    const nextLoop = !isLoop;
    setIsLoop(nextLoop);
    audioRef.current.loop = nextLoop;
  }, [isLoop]);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsPlayerVisible(false);
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        playlist,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isLoop,
        isPlayerVisible,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seek,
        setVolume,
        toggleMute,
        toggleLoop,
        closePlayer,
        setIsPlayerVisible,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}
